"""Generates a standard iCalendar (.ics) file from a trip's itinerary so it
can be imported into Google Calendar, Apple Calendar, Outlook, etc. Built by
hand against RFC 5545 - the format is simple enough not to need a dependency,
and every field comes from the trip's own real data (no invented content).
"""

import re
from datetime import datetime, time, timedelta

from app.models import ItineraryActivity, Trip


def _escape(text: str) -> str:
    return re.sub(r"([,;\\])", r"\\\1", text).replace("\n", "\\n")


def _fold(line: str) -> str:
    # RFC 5545 recommends folding lines longer than 75 octets.
    if len(line) <= 75:
        return line
    chunks = [line[:75]] + [line[i : i + 74] for i in range(75, len(line), 74)]
    return "\r\n ".join(chunks)


def _parse_time(value: str | None) -> time:
    if not value:
        return time(9, 0)
    try:
        hour, minute = value.split(":")[:2]
        return time(int(hour), int(minute))
    except ValueError:
        return time(9, 0)


def build_ics(trip: Trip, items: list[ItineraryActivity]) -> str:
    now_stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//GlobeTrotter//Trip Export//EN",
        "CALSCALE:GREGORIAN",
    ]

    for item in items:
        if not item.date:
            continue
        start_t = _parse_time(item.start_time)
        duration_minutes = item.activity.duration_minutes if item.activity else 60
        start_dt = datetime.combine(item.date, start_t)
        end_dt = start_dt + timedelta(minutes=duration_minutes or 60)

        name = item.activity.name if item.activity else "Activity"
        location = ""
        if item.activity and item.activity.destination:
            location = f"{item.activity.destination.city}, {item.activity.destination.country}"
        description_parts = [item.notes] if item.notes else []
        if item.activity and item.activity.description:
            description_parts.append(item.activity.description)
        description = " ".join(description_parts)

        lines += [
            "BEGIN:VEVENT",
            f"UID:{item.id}@globetrotter.app",
            f"DTSTAMP:{now_stamp}",
            f"DTSTART:{start_dt.strftime('%Y%m%dT%H%M%S')}",
            f"DTEND:{end_dt.strftime('%Y%m%dT%H%M%S')}",
            _fold(f"SUMMARY:{_escape(name)}"),
        ]
        if location:
            lines.append(_fold(f"LOCATION:{_escape(location)}"))
        if description:
            lines.append(_fold(f"DESCRIPTION:{_escape(description)}"))
        lines.append("END:VEVENT")

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"
