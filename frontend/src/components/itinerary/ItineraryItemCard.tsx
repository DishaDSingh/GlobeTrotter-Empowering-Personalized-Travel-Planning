import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, Copy, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { ItineraryActivity } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { EditItineraryItemModal } from './EditItineraryItemModal'
import { useDeleteItineraryActivity, useDuplicateItineraryActivity } from '@/hooks/useItinerary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const CATEGORY_EMOJI: Record<string, string> = {
  Attraction: '🗺️',
  Museum: '🏛️',
  Food: '🍽️',
  Adventure: '🧭',
  Nature: '🌿',
  Shopping: '🛍️',
  Entertainment: '🎭',
  Culture: '🎎',
  Religious: '🛕',
  Nightlife: '🌃',
}

interface ItineraryItemCardProps {
  item: ItineraryActivity
  tripId: string
  stopOptions: { id: string; label: string }[]
}

export function ItineraryItemCard({ item, tripId, stopOptions }: ItineraryItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteItem = useDeleteItineraryActivity(tripId)
  const duplicateItem = useDuplicateItineraryActivity(tripId)

  const cost = item.custom_cost ?? item.activity?.price ?? 0

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 shadow-sm',
        isDragging && 'z-10 opacity-70 shadow-[var(--shadow-lift)]',
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-ink-300 hover:text-ink-500 active:cursor-grabbing" aria-label="Drag to reorder">
        <GripVertical className="h-4.5 w-4.5" />
      </button>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-lg">
        {CATEGORY_EMOJI[item.activity?.category ?? ''] ?? '📍'}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{item.activity?.name ?? 'Activity'}</p>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          {item.start_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {item.start_time}
            </span>
          )}
          <span>{cost > 0 ? formatCurrency(cost, item.activity?.currency ?? 'USD') : 'Free'}</span>
          {item.activity?.duration_minutes && <span>{Math.round(item.activity.duration_minutes / 60) > 0 ? `${(item.activity.duration_minutes / 60).toFixed(1)}h` : `${item.activity.duration_minutes}m`}</span>}
        </div>
        {item.notes && <p className="mt-0.5 truncate text-xs text-ink-400">{item.notes}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => setEditOpen(true)} className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Edit activity">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => duplicateItem.mutate(item.id)} className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Duplicate activity">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={() => setDeleteOpen(true)} className="rounded-full p-2 text-ink-400 hover:bg-danger-500/10 hover:text-danger-500" aria-label="Delete activity">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <EditItineraryItemModal open={editOpen} onClose={() => setEditOpen(false)} item={item} tripId={tripId} stopOptions={stopOptions} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteItem.mutate(item.id)
          setDeleteOpen(false)
        }}
        title="Remove this activity?"
        description="It will be removed from your itinerary."
        confirmLabel="Remove"
        isLoading={deleteItem.isPending}
      />
    </div>
  )
}
