from datetime import date

from app.models import BudgetRecord, Trip
from app.schemas.budget import BudgetByCategory, BudgetRecordOut, BudgetSummary


def _trip_duration_days(trip: Trip) -> int:
    if trip.start_date and trip.end_date:
        delta = (trip.end_date - trip.start_date).days + 1
        return max(delta, 1)
    return 1


def compute_summary(trip: Trip, records: list[BudgetRecord]) -> BudgetSummary:
    spent = sum(r.amount for r in records)
    total = trip.budget_total or 0.0
    remaining = total - spent
    duration = _trip_duration_days(trip)
    avg_daily = spent / duration if duration else 0.0
    percent_used = (spent / total * 100) if total > 0 else 0.0

    by_category_map: dict[str, float] = {}
    for r in records:
        key = r.category.value if hasattr(r.category, "value") else str(r.category)
        by_category_map[key] = by_category_map.get(key, 0.0) + r.amount

    by_category = [BudgetByCategory(category=k, amount=v) for k, v in by_category_map.items()]

    return BudgetSummary(
        total_budget=total,
        spent=spent,
        remaining=remaining,
        average_daily_cost=round(avg_daily, 2),
        percent_used=round(percent_used, 1),
        by_category=by_category,
        over_budget_by=max(0.0, spent - total),
        records=[BudgetRecordOut.model_validate(r) for r in records],
    )


def budget_alert_message(summary: BudgetSummary) -> str | None:
    if summary.total_budget <= 0:
        return None
    if summary.percent_used >= 100:
        return f"You have exceeded your planned budget by {summary.spent - summary.total_budget:,.2f} {summary.records[0].currency if summary.records else ''}.".strip()
    if summary.percent_used >= 70:
        return f"You are currently using {summary.percent_used:.0f}% of your planned budget."
    return None
