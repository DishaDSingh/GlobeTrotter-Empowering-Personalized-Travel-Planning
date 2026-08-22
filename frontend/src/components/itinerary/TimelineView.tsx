import { Clock } from 'lucide-react'
import type { CalendarDay } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

const CATEGORY_EMOJI: Record<string, string> = {
  Attraction: '🗺️', Museum: '🏛️', Food: '🍽️', Adventure: '🧭', Nature: '🌿',
  Shopping: '🛍️', Entertainment: '🎭', Culture: '🎎', Religious: '🛕', Nightlife: '🌃',
}

export function TimelineView({ days }: { days: CalendarDay[] }) {
  if (days.length === 0) {
    return <p className="rounded-xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-400">No scheduled activities yet.</p>
  }

  return (
    <div className="space-y-10">
      {days.map((day, dayIdx) => (
        <div key={day.date}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink-900">
              Day {dayIdx + 1} · {formatDate(day.date, { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <span className="text-sm font-medium text-ink-400">{formatCurrency(day.total_cost, day.items[0]?.activity?.currency ?? 'USD')}</span>
          </div>
          <div className="relative ml-4 space-y-6 border-l-2 border-ink-100 pl-6">
            {day.items.map((item) => (
              <div key={item.id} className="relative">
                <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand-500 bg-white" />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                  <Clock className="h-3 w-3" /> {item.start_time ?? '—'}
                </div>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-ink-100 bg-white p-3">
                  <span className="text-lg">{CATEGORY_EMOJI[item.activity?.category ?? ''] ?? '📍'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-900">{item.activity?.name}</p>
                    <p className="text-xs text-ink-400">
                      {item.activity?.duration_minutes ? `${Math.round(item.activity.duration_minutes / 60 * 10) / 10}h` : ''}
                      {' · '}
                      {(item.custom_cost ?? item.activity?.price ?? 0) > 0 ? formatCurrency(item.custom_cost ?? item.activity?.price ?? 0, item.activity?.currency ?? 'USD') : 'Free'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
