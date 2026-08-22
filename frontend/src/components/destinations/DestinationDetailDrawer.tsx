import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenText, Heart, MapPin, Plus, Users } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { WeatherCard } from './WeatherCard'
import { NearbyDestinations } from './NearbyDestinations'
import { NearbyPlaces } from './NearbyPlaces'
import { MapView } from '@/components/map/MapView'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { useActivities } from '@/hooks/useActivities'
import { useTrips, useAddStop } from '@/hooks/useTrips'
import { useAuth } from '@/context/AuthContext'
import { cityImage } from '@/lib/images'
import { formatCurrency, cn } from '@/lib/utils'
import type { Destination } from '@/types'

interface DestinationDetailDrawerProps {
  destination: Destination | null
  onClose: () => void
  saved?: boolean
  onToggleSave?: (destination: Destination) => void
  onSelectDestination?: (destination: Destination) => void
}

export function DestinationDetailDrawer({
  destination,
  onClose,
  saved,
  onToggleSave,
  onSelectDestination,
}: DestinationDetailDrawerProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { data: activities, isLoading: activitiesLoading } = useActivities({ destination_id: destination?.id })
  const { data: trips } = useTrips({ filter: 'draft' }, isAuthenticated)
  const [selectedTripId, setSelectedTripId] = useState('')
  const addStop = useAddStop(selectedTripId)

  if (!destination) return null

  const handleAddToTrip = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (selectedTripId) {
      addStop.mutate(
        { destination_id: destination.id },
        { onSuccess: () => navigate(`/trips/${selectedTripId}`) },
      )
    } else {
      navigate('/trips/create', { state: { destinationId: destination.id } })
    }
  }

  return (
    <Drawer open={!!destination} onClose={onClose} side="right">
      <div className="-mx-6 -mt-6 mb-4">
        <div className="relative h-52">
          <img src={destination.image_url || cityImage(destination.city)} alt={destination.city} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6 text-white">
            <p className="font-display text-2xl font-bold">{destination.city}</p>
            <p className="flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-3.5 w-3.5" /> {destination.country}
            </p>
          </div>
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(destination)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 hover:text-danger-500"
              aria-label="Toggle save destination"
            >
              <Heart className={cn('h-4.5 w-4.5', saved && 'fill-danger-500 text-danger-500')} />
            </button>
          )}
        </div>
      </div>

      {destination.description && <p className="text-sm text-ink-600">{destination.description}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-ink-100 p-3">
          <p className="text-ink-400">Daily budget</p>
          <p className="font-semibold text-ink-900">{formatCurrency(destination.estimated_daily_cost, destination.currency)}</p>
        </div>
        <div className="rounded-xl border border-ink-100 p-3">
          <p className="text-ink-400">Population</p>
          <p className="flex items-center gap-1 font-semibold text-ink-900">
            <Users className="h-3.5 w-3.5" /> {destination.population ? destination.population.toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <WeatherCard destinationId={destination.id} city={destination.city} />
      </div>

      <button
        onClick={() => navigate('/trip-guide', { state: { destinationId: destination.id } })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        <BookOpenText className="h-4 w-4" /> View full multi-city trip guide for {destination.city}
      </button>

      <div className="mt-4 overflow-hidden rounded-xl">
        <MapView
          markers={[{ id: destination.id, lat: destination.latitude, lng: destination.longitude, label: destination.city, kind: 'destination' }]}
          height={200}
        />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-display text-base font-semibold text-ink-900">Top activities</h3>
        {activitiesLoading ? (
          <p className="text-sm text-ink-400">Loading activities…</p>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-2.5">
            {activities.slice(0, 4).map((activity) => (
              <ActivityCard key={activity.id} activity={activity} compact />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">No activities listed yet for this destination.</p>
        )}
      </div>

      <div className="mt-6">
        <NearbyPlaces destinationId={destination.id} />
      </div>

      {onSelectDestination && (
        <div className="mt-6">
          <NearbyDestinations destinationId={destination.id} onSelect={onSelectDestination} />
        </div>
      )}

      <div className="sticky bottom-0 mt-6 -mx-6 -mb-6 border-t border-ink-100 bg-white p-6">
        {isAuthenticated && trips && trips.length > 0 && (
          <Select
            className="mb-3"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
          >
            <option value="">Create a new trip</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>Add to "{t.name}"</option>
            ))}
          </Select>
        )}
        <Button className="w-full" onClick={handleAddToTrip} isLoading={addStop.isPending}>
          <Plus className="h-4 w-4" /> {isAuthenticated ? 'Add to trip' : 'Log in to plan a trip'}
        </Button>
      </div>
    </Drawer>
  )
}
