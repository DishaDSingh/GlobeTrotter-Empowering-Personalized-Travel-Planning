"""AI itinerary generation and budget optimization.

Pipeline (per spec): user form -> backend -> AI (optional) -> strict JSON
validation via Pydantic -> preview returned to frontend -> user confirms ->
persisted to DB by a separate, explicit "accept" call. The AI (or the
rule-based fallback used when no OPENAI_API_KEY is configured) never writes
directly to the database.
"""

import json
from datetime import date, timedelta

import httpx
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Activity, BudgetRecord, Destination, ItineraryActivity, Trip
from app.schemas.ai import (
    AIBudgetOptimizeResponse,
    AIBudgetSuggestion,
    AIItineraryDay,
    AIItineraryDayActivity,
    AIItineraryRequest,
    AIItineraryResponse,
)

settings = get_settings()

_GENERIC_TEMPLATE = [
    ("08:00", "Breakfast at a local cafe", "Food", 60, 12.0),
    ("10:00", "Morning sightseeing walk", "Attraction", 120, 0.0),
    ("13:00", "Lunch at a recommended restaurant", "Food", 75, 20.0),
    ("15:30", "Featured local experience", "Culture", 150, 30.0),
    ("19:00", "Dinner and evening stroll", "Food", 90, 25.0),
]

_STYLE_CATEGORY_BIAS = {
    "adventure": ["Adventure", "Nature"],
    "relaxation": ["Nature", "Food", "Shopping"],
    "culture": ["Culture", "Museum", "Religious"],
    "balanced": ["Attraction", "Food", "Culture"],
    "nightlife": ["Nightlife", "Entertainment", "Food"],
}


def _rule_based_itinerary(req: AIItineraryRequest, db: Session) -> AIItineraryResponse:
    destination_row = (
        db.query(Destination).filter(func.lower(Destination.city) == req.destination.lower()).first()
    )

    per_day_budget = req.budget / req.duration_days if req.duration_days else req.budget
    days: list[AIItineraryDay] = []
    total_cost = 0.0

    preferred_categories = _STYLE_CATEGORY_BIAS.get(req.style.lower(), _STYLE_CATEGORY_BIAS["balanced"])
    if req.interests:
        preferred_categories = list(dict.fromkeys(req.interests + preferred_categories))

    activities_pool: list[Activity] = []
    if destination_row:
        activities_pool = (
            db.query(Activity)
            .filter(Activity.destination_id == destination_row.id)
            .order_by(Activity.rating.desc())
            .all()
        )

    pool_idx = 0
    for day_num in range(1, req.duration_days + 1):
        day_activities: list[AIItineraryDayActivity] = []
        day_cost = 0.0
        slots = _GENERIC_TEMPLATE
        used_today: set[str] = set()

        for time_str, generic_name, generic_category, duration, generic_cost in slots:
            chosen = None
            if activities_pool:
                # Food slots want a Food-category place to eat; other slots want a
                # non-Food match from the traveler's preferred categories. Widen the
                # search progressively, but never repeat an activity within the same day.
                if generic_category == "Food":
                    target_categories = ["Food"]
                else:
                    target_categories = [c for c in preferred_categories if c != "Food"] or preferred_categories

                candidate_pools = [
                    [a for a in activities_pool if a.id not in used_today and a.category.value in target_categories],
                    [a for a in activities_pool if a.id not in used_today and a.category.value in preferred_categories],
                    [a for a in activities_pool if a.id not in used_today],
                ]
                for candidates in candidate_pools:
                    if candidates:
                        chosen = candidates[pool_idx % len(candidates)]
                        pool_idx += 1
                        break

            if chosen:
                used_today.add(chosen.id)
                cost = chosen.price * req.travelers
                day_activities.append(
                    AIItineraryDayActivity(
                        time=time_str,
                        name=chosen.name,
                        category=chosen.category.value,
                        duration_minutes=chosen.duration_minutes,
                        estimated_cost=round(cost, 2),
                        notes=chosen.description[:140] if chosen.description else None,
                    )
                )
            else:
                cost = generic_cost * req.travelers
                day_activities.append(
                    AIItineraryDayActivity(
                        time=time_str,
                        name=f"{generic_name} in {req.destination}",
                        category=generic_category,
                        duration_minutes=duration,
                        estimated_cost=round(cost, 2),
                    )
                )
            day_cost += cost

        # Soft budget guard: trim the most expensive non-food activity if the day
        # blew past its share of the budget.
        if day_cost > per_day_budget * 1.4 and per_day_budget > 0:
            non_food = [a for a in day_activities if a.category != "Food"]
            if non_food:
                most_expensive = max(non_food, key=lambda a: a.estimated_cost)
                day_activities.remove(most_expensive)
                day_cost -= most_expensive.estimated_cost

        days.append(
            AIItineraryDay(
                day=day_num,
                city=req.destination,
                date_label=f"Day {day_num}",
                activities=day_activities,
                estimated_day_cost=round(day_cost, 2),
            )
        )
        total_cost += day_cost

    notes = None
    if total_cost > req.budget:
        notes = (
            f"This plan is estimated at {total_cost:,.0f} {req.currency}, which is "
            f"{total_cost - req.budget:,.0f} {req.currency} over your stated budget. "
            "Consider removing an activity or choosing more free attractions."
        )

    return AIItineraryResponse(
        destination=req.destination,
        duration_days=req.duration_days,
        total_estimated_cost=round(total_cost, 2),
        currency=req.currency,
        days=days,
        source="rule_based",
        notes=notes,
    )


async def _openai_itinerary(req: AIItineraryRequest) -> AIItineraryResponse | None:
    if not settings.openai_api_key:
        return None

    schema_hint = AIItineraryResponse.model_json_schema()
    system_prompt = (
        "You are a travel itinerary planner. Respond with ONLY valid JSON matching this "
        f"JSON schema (no markdown, no commentary): {json.dumps(schema_hint)}"
    )
    user_prompt = (
        f"Plan a {req.duration_days}-day trip to {req.destination} for {req.travelers} traveler(s), "
        f"style: {req.style}, interests: {', '.join(req.interests) or 'general'}, "
        f"total budget: {req.budget} {req.currency}, starting from: {req.starting_location or 'unspecified'}. "
        "Include realistic times, categories, durations in minutes, and estimated costs per activity."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.5,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            validated = AIItineraryResponse.model_validate(data)
            validated.source = "openai"
            return validated
    except Exception:
        return None


async def generate_itinerary(req: AIItineraryRequest, db: Session) -> AIItineraryResponse:
    ai_result = await _openai_itinerary(req)
    if ai_result:
        return ai_result
    return _rule_based_itinerary(req, db)


def optimize_budget(
    trip: Trip,
    budget_records: list[BudgetRecord],
    itinerary_activities: list[ItineraryActivity],
) -> AIBudgetOptimizeResponse:
    itinerary_cost = 0.0
    activity_costs: list[tuple[str, str, float]] = []
    for ia in itinerary_activities:
        cost = ia.custom_cost if ia.custom_cost is not None else (ia.activity.price if ia.activity else 0.0)
        itinerary_cost += cost
        if cost > 0:
            activity_costs.append((ia.id, ia.activity.name if ia.activity else "Activity", cost))

    other_costs = sum(r.amount for r in budget_records)
    projected_spend = itinerary_cost + other_costs
    total_budget = trip.budget_total or 0.0
    over_by = max(0.0, projected_spend - total_budget)

    suggestions: list[AIBudgetSuggestion] = []

    if over_by > 0:
        activity_costs.sort(key=lambda x: x[2], reverse=True)
        if activity_costs:
            top_id, top_name, top_cost = activity_costs[0]
            suggestions.append(
                AIBudgetSuggestion(
                    title=f"Reconsider '{top_name}'",
                    description=(
                        f"This is your most expensive planned activity at {top_cost:,.2f} "
                        f"{trip.currency}. Swapping it for a lower-cost or free alternative "
                        "would meaningfully reduce your total."
                    ),
                    estimated_savings=round(top_cost * 0.6, 2),
                    category="Activities",
                    target_id=top_id,
                    target_type="itinerary_activity",
                )
            )
        if len(activity_costs) > 1:
            second_id, second_name, second_cost = activity_costs[1]
            suggestions.append(
                AIBudgetSuggestion(
                    title=f"Move '{second_name}' to a free attraction",
                    description="Replacing one paid activity with a free local attraction or park keeps the day interesting while cutting cost.",
                    estimated_savings=round(second_cost, 2),
                    category="Activities",
                    target_id=second_id,
                    target_type="itinerary_activity",
                )
            )

        accommodation_total = sum(r.amount for r in budget_records if r.category.value == "Accommodation")
        if accommodation_total > 0:
            suggestions.append(
                AIBudgetSuggestion(
                    title="Choose more budget-friendly accommodation",
                    description="Shifting to a 3-star hotel, guesthouse, or shared apartment for part of the trip can meaningfully reduce lodging costs.",
                    estimated_savings=round(accommodation_total * 0.15, 2),
                    category="Accommodation",
                )
            )

        transport_total = sum(r.amount for r in budget_records if r.category.value == "Transportation")
        suggestions.append(
            AIBudgetSuggestion(
                title="Use public transportation",
                description="Swapping taxis/rideshares for public transit or a multi-day transit pass typically cuts transportation costs significantly.",
                estimated_savings=round((transport_total or over_by) * 0.3, 2),
                category="Transportation",
            )
        )

        suggestions.sort(key=lambda s: s.estimated_savings, reverse=True)
        suggestions = suggestions[:5]

    return AIBudgetOptimizeResponse(
        total_budget=total_budget,
        projected_spend=round(projected_spend, 2),
        over_by=round(over_by, 2),
        suggestions=suggestions,
    )
