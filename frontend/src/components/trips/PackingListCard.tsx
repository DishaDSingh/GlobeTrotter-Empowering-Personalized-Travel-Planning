import { Luggage } from 'lucide-react'
import { usePackingList } from '@/hooks/usePackingList'
import { Skeleton } from '@/components/ui/Skeleton'

export function PackingListCard({ tripId }: { tripId: string }) {
  const { data, isLoading } = usePackingList(tripId)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Luggage className="h-4 w-4 text-brand-600" /> Packing list
      </p>
      <p className="mb-3 text-xs text-ink-400">{data.season_label} conditions</p>
      <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {Object.entries(data.categories).map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{category}</p>
            <ul className="mt-1 space-y-1">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm text-ink-700">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-400">{data.notes}</p>
    </div>
  )
}
