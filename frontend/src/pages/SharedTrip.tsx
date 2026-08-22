import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Compass, Copy, MapPin, Wallet } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { MapView, type MapMarker } from '@/components/map/MapView'
import { useSharedTrip, useCopySharedTrip } from '@/hooks/useShared'
import { useAuth } from '@/context/AuthContext'
import { placeholderImage } from '@/lib/images'
import { formatCurrency, formatDateRange } from '@/lib/utils'

export default function SharedTrip() {
  const { shareId } = useParams<{ shareId: string }>()
  const { data, isLoading, isError } = useSharedTrip(shareId)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const copyTrip = useCopySharedTrip()

  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!data) return []
    const stopMarkers: MapMarker[] = data.stops
      .filter((s) => s.destination)
      .map((s) => ({ id: s.id, lat: s.destination!.latitude, lng: s.destination!.longitude, label: s.destination!.city, kind: 'destination' }))
    const activityMarkers: MapMarker[] = data.itinerary
      .filter((i) => i.activity)
      .map((i) => ({ id: i.id, lat: i.activity!.latitude, lng: i.activity!.longitude, label: i.activity!.name, kind: 'activity' }))
    return [...stopMarkers, ...activityMarkers]
  }, [data])

  const handleCopy = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/trip/share/${shareId}` } } })
      return
    }
    if (!shareId) return
    copyTrip.mutate(shareId, {
      onSuccess: (trip) => navigate(`/trips/${trip.id}`),
    })
  }

  if (isLoading) return <PageLoader />

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50 px-6">
        <EmptyState
          icon={<Compass className="h-7 w-7" />}
          title="This trip isn't available"
          description="The link may be invalid, or the owner has made this trip private."
          action={<Link to="/"><Button>Back to home</Button></Link>}
        />
      </div>
    )
  }

  const { trip, owner_name, stops, itinerary, budget_summary } = data

  const itemsByStop = new Map<string, typeof itinerary>()
  for (const item of itinerary) {
    if (!itemsByStop.has(item.trip_stop_id)) itemsByStop.set(item.trip_stop_id, [])
    itemsByStop.get(item.trip_stop_id)!.push(item)
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
              <Compass className="h-4.5 w-4.5" />
            </span>
            GlobeTrotter
          </Link>
          <Button onClick={handleCopy} isLoading={copyTrip.isPending}>
            <Copy className="h-4 w-4" /> Copy this itinerary
          </Button>
        </div>
      </header>

      <div className="relative h-64 sm:h-80">
        <img src={trip.cover_image || placeholderImage(trip.name, 1400, 500)} alt={trip.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-5 pb-6 text-white">
          <Badge tone="neutral" className="bg-white/15 text-white">Shared by {owner_name}</Badge>
          <h1 className="mt-2 font-display text-3xl font-bold">{trip.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
            <Calendar className="h-3.5 w-3.5" /> {formatDateRange(trip.start_date, trip.end_date)}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-5 py-10">
        {trip.description && <p className="text-ink-600">{trip.description}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">Itinerary</h2>
            {stops.length === 0 ? (
              <p className="text-sm text-ink-400">No destinations added yet.</p>
            ) : (
              stops.map((stop) => (
                <div key={stop.id}>
                  <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-ink-900">
                    <MapPin className="h-4 w-4 text-brand-600" /> {stop.destination?.city}, {stop.destination?.country}
                  </h3>
                  <div className="space-y-2">
                    {(itemsByStop.get(stop.id) ?? []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-3 text-sm">
                        <div>
                          <span className="font-medium text-ink-900">{item.activity?.name}</span>
                          {item.start_time && <span className="ml-2 text-xs text-ink-400">{item.start_time}</span>}
                        </div>
                        <span className="text-xs font-medium text-ink-600">
                          {(item.custom_cost ?? item.activity?.price ?? 0) > 0 ? formatCurrency(item.custom_cost ?? item.activity?.price ?? 0, item.activity?.currency ?? trip.currency) : 'Free'}
                        </span>
                      </div>
                    ))}
                    {(itemsByStop.get(stop.id) ?? []).length === 0 && <p className="text-xs text-ink-400">No activities added for this stop.</p>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Wallet className="h-4 w-4 text-brand-600" /> Budget summary
              </p>
              <p className="text-2xl font-bold text-ink-900">{formatCurrency(budget_summary.spent, trip.currency)}</p>
              <p className="text-xs text-ink-400">of {formatCurrency(budget_summary.total_budget, trip.currency)} budgeted</p>
            </div>

            {mapMarkers.length > 0 && (
              <MapView markers={mapMarkers} showRoute height={280} className="overflow-hidden rounded-2xl border border-ink-100" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
