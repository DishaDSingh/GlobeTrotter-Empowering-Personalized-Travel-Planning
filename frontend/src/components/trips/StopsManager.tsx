import { useEffect, useMemo, useState } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MapPin, Plus, Trash2, Wallet } from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDestinationSearch } from '@/hooks/useDestinations'
import { useAddStop, useDeleteStop, useReorderStops, useUpdateStop } from '@/hooks/useTrips'
import { cityImage } from '@/lib/images'
import { formatDate, debounce } from '@/lib/utils'
import type { Destination, TripStop } from '@/types'

function SortableStopRow({
  stop,
  index,
  currency,
  onDelete,
  onUpdateBudget,
}: {
  stop: TripStop
  index: number
  currency: string
  onDelete: (id: string) => void
  onUpdateBudget: (stopId: string, value: number | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })
  const [budgetInput, setBudgetInput] = useState(stop.planned_budget != null ? String(stop.planned_budget) : '')

  useEffect(() => {
    setBudgetInput(stop.planned_budget != null ? String(stop.planned_budget) : '')
  }, [stop.planned_budget])

  const commitBudget = () => {
    const parsed = budgetInput.trim() === '' ? null : Number(budgetInput)
    if (parsed !== stop.planned_budget) onUpdateBudget(stop.id, parsed !== null && !Number.isNaN(parsed) ? parsed : null)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 ${isDragging ? 'z-10 opacity-70 shadow-[var(--shadow-lift)]' : ''}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-ink-300 hover:text-ink-500" aria-label="Drag to reorder">
        <GripVertical className="h-4.5 w-4.5" />
      </button>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{index + 1}</span>
      <img src={stop.destination?.image_url || cityImage(stop.destination?.city ?? '', 100)} alt="" className="h-10 w-10 rounded-lg object-cover" />
      <div className="flex-1">
        <p className="text-sm font-medium text-ink-900">{stop.destination?.city}</p>
        <p className="text-xs text-ink-400">
          {stop.arrival_date && stop.departure_date ? `${formatDate(stop.arrival_date)} – ${formatDate(stop.departure_date)}` : 'Dates not set'}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5 text-ink-400" />
        <span className="text-xs text-ink-400">{currency}</span>
        <input
          type="number"
          min={0}
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          onBlur={commitBudget}
          placeholder="Budget"
          className="w-20 rounded-lg border border-ink-200 px-2 py-1 text-right text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <button onClick={() => onDelete(stop.id)} className="rounded-full p-2 text-ink-400 hover:bg-danger-500/10 hover:text-danger-500" aria-label="Remove destination">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function StopsManager({ tripId, stops, currency = 'USD' }: { tripId: string; stops: TripStop[]; currency?: string }) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const updateDebounced = useMemo(() => debounce((v: string) => setDebounced(v), 300), [])
  const { data: results } = useDestinationSearch(debounced)

  const addStop = useAddStop(tripId)
  const deleteStop = useDeleteStop(tripId)
  const reorderStops = useReorderStops(tripId)
  const updateStop = useUpdateStop(tripId)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = stops.findIndex((s) => s.id === active.id)
    const newIndex = stops.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(stops, oldIndex, newIndex)
    reorderStops.mutate(reordered.map((s, idx) => ({ id: s.id, sequence: idx })))
  }

  const handleAdd = (destination: Destination) => {
    addStop.mutate({ destination_id: destination.id })
    setQuery('')
    setDebounced('')
  }

  const totalPlanned = stops.reduce((sum, s) => sum + (s.planned_budget ?? 0), 0)

  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={(v) => { setQuery(v); updateDebounced(v) }} placeholder="Search a city to add..." />

      {debounced && (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-ink-100 p-2">
          {results?.map((d) => (
            <button key={d.id} onClick={() => handleAdd(d)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-ink-50">
              <img src={d.image_url || cityImage(d.city, 100)} alt="" className="h-9 w-9 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{d.city}</p>
                <p className="text-xs text-ink-400">{d.country}</p>
              </div>
              <Plus className="h-4 w-4 text-brand-600" />
            </button>
          ))}
          {results?.length === 0 && <p className="p-2 text-sm text-ink-400">No matches found.</p>}
        </div>
      )}

      {stops.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400 flex items-center justify-center gap-2">
          <MapPin className="h-4 w-4" /> No destinations added yet.
        </p>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {stops.map((stop, idx) => (
                  <SortableStopRow
                    key={stop.id}
                    stop={stop}
                    index={idx}
                    currency={currency}
                    onDelete={setDeleteTarget}
                    onUpdateBudget={(stopId, value) => updateStop.mutate({ stopId, planned_budget: value })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {totalPlanned > 0 && (
            <p className="text-right text-xs text-ink-400">
              Allocated so far: <span className="font-medium text-ink-700">{currency} {totalPlanned.toLocaleString()}</span> across destinations
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteStop.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
        title="Remove this destination?"
        description="Any itinerary activities for this destination will also be removed."
        confirmLabel="Remove"
        isLoading={deleteStop.isPending}
      />
    </div>
  )
}
