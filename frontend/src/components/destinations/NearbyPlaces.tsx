import { useState } from 'react'
import { Bed, Coffee, ExternalLink, MapPin, UtensilsCrossed } from 'lucide-react'
import { useNearbyPlaces } from '@/hooks/useDestinations'
import type { NearbyPlaceType } from '@/types'
import { cn } from '@/lib/utils'

const TABS: { type: NearbyPlaceType; label: string; icon: typeof Bed }[] = [
  { type: 'hotel', label: 'Hotels', icon: Bed },
  { type: 'restaurant', label: 'Restaurants', icon: UtensilsCrossed },
  { type: 'cafe', label: 'Cafés', icon: Coffee },
]

export function NearbyPlaces({ destinationId }: { destinationId: string }) {
  const [active, setActive] = useState<NearbyPlaceType>('hotel')
  const { data, isLoading } = useNearbyPlaces(destinationId, active)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink-900">Nearby places</h3>
        <span className="text-[11px] text-ink-400">Live data from OpenStreetMap</span>
      </div>

      <div className="mb-3 flex gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActive(tab.type)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
              active === tab.type ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-400">Looking up nearby {active}s…</p>
      ) : !data || !data.available ? (
        <p className="text-sm text-ink-400">{data?.message ?? 'Live place data is temporarily unavailable.'}</p>
      ) : data.places.length === 0 ? (
        <p className="text-sm text-ink-400">{data.message ?? 'No mapped places found nearby yet.'}</p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {data.places.map((place) => (
            <a
              key={`${place.name}-${place.latitude}-${place.longitude}`}
              href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=18/${place.latitude}/${place.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 hover:border-brand-200 hover:bg-brand-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{place.name}</p>
                {place.address && <p className="truncate text-xs text-ink-400">{place.address}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {place.distance_km.toFixed(1)} km
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-ink-300" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
