import { Link } from 'react-router-dom'
import { Calendar, Copy, Globe2, Lock, MapPin, MoreVertical, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { TripListItem } from '@/types'
import { formatCurrency, formatDateRange } from '@/lib/utils'
import { cityImage } from '@/lib/images'
import { Badge } from '@/components/ui/Badge'

const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'success'> = {
  draft: 'neutral',
  planned: 'brand',
  completed: 'success',
}

interface TripCardProps {
  trip: TripListItem
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onShare: (trip: TripListItem) => void
}

export function TripCard({ trip, onDuplicate, onDelete, onShare }: TripCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]">
      <Link to={`/trips/${trip.id}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <img
            src={trip.cover_image || cityImage(trip.name)}
            alt={trip.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <p className="truncate font-display text-lg font-bold">{trip.name}</p>
            <p className="flex items-center gap-1 text-xs text-white/80">
              <Calendar className="h-3 w-3" /> {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
        </div>
      </Link>

      <div className="relative p-4">
        <div className="mb-3 flex items-center gap-2">
          <Badge tone={STATUS_TONE[trip.status]}>{trip.status}</Badge>
          <Badge tone="neutral">
            {trip.visibility === 'public' ? <Globe2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {trip.visibility}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="flex items-center gap-1 text-ink-500">
            <MapPin className="h-3.5 w-3.5" /> {trip.destination_count} destination{trip.destination_count === 1 ? '' : 's'}
          </p>
          <p className="font-medium text-ink-700">
            {formatCurrency(trip.spent, trip.currency)} / {formatCurrency(trip.budget_total, trip.currency)}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm hover:text-ink-900"
          aria-label="Trip actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-3 top-12 z-20 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-[var(--shadow-lift)]">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onShare(trip)
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDuplicate(trip.id)
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onDelete(trip.id)
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-500 hover:bg-danger-500/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
