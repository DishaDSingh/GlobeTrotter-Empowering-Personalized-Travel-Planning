import { MapPin } from 'lucide-react'
import { useNearbyDestinations } from '@/hooks/useDestinations'
import { cityImage } from '@/lib/images'
import type { Destination } from '@/types'

interface NearbyDestinationsProps {
  destinationId: string
  onSelect: (destination: Destination) => void
}

export function NearbyDestinations({ destinationId, onSelect }: NearbyDestinationsProps) {
  const { data, isLoading } = useNearbyDestinations(destinationId, 6)

  if (isLoading) {
    return <p className="text-sm text-ink-400">Finding nearby cities…</p>
  }
  if (!data || data.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="mb-3 font-display text-base font-semibold text-ink-900">Nearby destinations</h3>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {data.map(({ destination, distance_km }) => (
          <button
            key={destination.id}
            onClick={() => onSelect(destination)}
            className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-ink-100 text-left transition-shadow hover:shadow-[var(--shadow-soft)]"
          >
            <img src={destination.image_url || cityImage(destination.city, 300)} alt={destination.city} className="h-20 w-full object-cover" />
            <div className="p-2">
              <p className="truncate text-sm font-semibold text-ink-900">{destination.city}</p>
              <p className="flex items-center gap-1 text-xs text-ink-400">
                <MapPin className="h-3 w-3" />
                {distance_km < 1 ? '<1 km' : `${Math.round(distance_km).toLocaleString()} km`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
