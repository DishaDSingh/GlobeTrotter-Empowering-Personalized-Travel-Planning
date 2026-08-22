import { Link } from 'react-router-dom'
import { Heart, MapPin, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Destination } from '@/types'
import { cityImage } from '@/lib/images'
import { formatCurrency, cn } from '@/lib/utils'

interface DestinationCardProps {
  destination: Destination
  onOpen?: (destination: Destination) => void
  saved?: boolean
  onToggleSave?: (destination: Destination) => void
  reasons?: string[]
}

export function DestinationCard({ destination, onOpen, saved, onToggleSave, reasons }: DestinationCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[var(--shadow-soft)]"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.(destination)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen?.(destination)
          }
        }}
        aria-label={`View ${destination.city}`}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={destination.image_url || cityImage(destination.city)}
            alt={destination.city}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-3 left-4 text-white">
            <p className="font-display text-lg font-bold">{destination.city}</p>
            <p className="flex items-center gap-1 text-xs text-white/80">
              <MapPin className="h-3 w-3" /> {destination.country}
            </p>
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-800">
            <Star className="h-3 w-3 fill-sunset-500 text-sunset-500" />
            {(destination.popularity_score / 20).toFixed(1)}
          </div>
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleSave(destination)
              }}
              aria-label={saved ? 'Remove from saved' : 'Save destination'}
              className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-700 transition-colors hover:text-danger-500"
            >
              <Heart className={cn('h-4 w-4', saved && 'fill-danger-500 text-danger-500')} />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        {destination.description && <p className="mb-2 line-clamp-2 text-sm text-ink-500">{destination.description}</p>}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-700">
            {formatCurrency(destination.estimated_daily_cost, destination.currency)}
            <span className="text-ink-400"> / day</span>
          </p>
          <Link to="/trips/create" state={{ destinationId: destination.id }} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Plan trip →
          </Link>
        </div>
        {reasons && reasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reasons.slice(0, 2).map((reason) => (
              <span key={reason} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
