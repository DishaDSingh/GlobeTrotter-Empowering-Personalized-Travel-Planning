import { useMemo, useState } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Compass, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ItineraryItemCard } from './ItineraryItemCard'
import { AddActivityDrawer } from './AddActivityDrawer'
import { useReorderItineraryActivities } from '@/hooks/useItinerary'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ItineraryActivity, TripStop } from '@/types'

interface ItineraryBuilderProps {
  tripId: string
  stops: TripStop[]
  items: ItineraryActivity[]
}

function groupKey(item: ItineraryActivity) {
  return `${item.trip_stop_id}::${item.date ?? 'unscheduled'}`
}

export function ItineraryBuilder({ tripId, stops, items }: ItineraryBuilderProps) {
  const [drawerStop, setDrawerStop] = useState<TripStop | null>(null)
  const [drawerDate, setDrawerDate] = useState<string | undefined>(undefined)
  const reorder = useReorderItineraryActivities(tripId)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const stopOptions = stops.map((s) => ({ id: s.id, label: s.destination?.city ?? 'Stop' }))

  const groups = useMemo(() => {
    const map = new Map<string, ItineraryActivity[]>()
    for (const item of items) {
      const key = groupKey(item)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sequence - b.sequence)
    return map
  }, [items])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeItem = items.find((i) => i.id === active.id)
    const overItem = items.find((i) => i.id === over.id)
    if (!activeItem || !overItem) return

    const key = groupKey(activeItem)
    if (key !== groupKey(overItem)) return

    const group = groups.get(key) ?? []
    const oldIndex = group.findIndex((i) => i.id === active.id)
    const newIndex = group.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(group, oldIndex, newIndex)

    reorder.mutate(reordered.map((item, idx) => ({ id: item.id, sequence: idx })))
  }

  if (stops.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="h-7 w-7" />}
        title="Add destinations first"
        description="Add at least one destination to this trip before building your itinerary."
      />
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-8">
        {stops.map((stop) => {
          const stopItems = items.filter((i) => i.trip_stop_id === stop.id)
          const dateKeys = Array.from(new Set(stopItems.map((i) => i.date ?? 'unscheduled'))).sort()

          return (
            <div key={stop.id}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-900">{stop.destination?.city ?? 'Destination'}</h3>
                  <p className="text-xs text-ink-400">
                    {stop.arrival_date && stop.departure_date
                      ? `${formatDate(stop.arrival_date)} – ${formatDate(stop.departure_date)}`
                      : 'Dates not set'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDrawerStop(stop)
                    setDrawerDate(stop.arrival_date ?? undefined)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add activity
                </Button>
              </div>

              {dateKeys.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 p-5 text-center text-sm text-ink-400">
                  No activities yet for {stop.destination?.city}.
                </p>
              ) : (
                <div className="space-y-5">
                  {dateKeys.map((dateKey) => {
                    const dayItems = (groups.get(`${stop.id}::${dateKey}`) ?? [])
                    const dayCost = dayItems.reduce((sum, i) => sum + (i.custom_cost ?? i.activity?.price ?? 0), 0)
                    return (
                      <div key={dateKey}>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-ink-700">
                            {dateKey === 'unscheduled' ? 'Unscheduled' : formatDate(dateKey, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs font-medium text-ink-400">Day total: {formatCurrency(dayCost, dayItems[0]?.activity?.currency ?? 'USD')}</p>
                        </div>
                        <SortableContext items={dayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {dayItems.map((item) => (
                              <ItineraryItemCard key={item.id} item={item} tripId={tripId} stopOptions={stopOptions} />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AddActivityDrawer open={!!drawerStop} onClose={() => setDrawerStop(null)} tripId={tripId} stop={drawerStop} defaultDate={drawerDate} />
    </DndContext>
  )
}
