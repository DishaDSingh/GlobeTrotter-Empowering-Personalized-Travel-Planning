import type { CalendarDay } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

export function CalendarGridView({ days }: { days: CalendarDay[] }) {
  if (days.length === 0) {
    return <p className="rounded-xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-400">No scheduled activities yet.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {days.map((day) => (
        <div key={day.date} className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-ink-100 pb-2">
            <p className="font-display text-sm font-bold text-ink-900">{formatDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <span className="text-xs font-medium text-brand-600">{formatCurrency(day.total_cost, day.items[0]?.activity?.currency ?? 'USD')}</span>
          </div>
          <div className="space-y-2">
            {day.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-ink-500">{item.start_time ?? '—'}</span>
                <span className="flex-1 truncate px-2 text-ink-800">{item.activity?.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
