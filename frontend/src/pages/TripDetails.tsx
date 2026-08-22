import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Calendar,
  Copy,
  Download,
  Globe2,
  List,
  LayoutGrid,
  Lock,
  Map as MapIcon,
  Pencil,
  Printer,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageLoader } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { StopsManager } from '@/components/trips/StopsManager'
import { EditTripModal } from '@/components/trips/EditTripModal'
import { ShareTripModal } from '@/components/trips/ShareTripModal'
import { AIItineraryModal } from '@/components/trips/AIItineraryModal'
import { PackingListCard } from '@/components/trips/PackingListCard'
import { ItineraryBuilder } from '@/components/itinerary/ItineraryBuilder'
import { CalendarGridView } from '@/components/itinerary/CalendarGridView'
import { TimelineView } from '@/components/itinerary/TimelineView'
import { BudgetTab } from '@/components/trips/BudgetTab'
import { MapView, type MapMarker } from '@/components/map/MapView'
import { WeatherCard } from '@/components/destinations/WeatherCard'
import { useTrip, useDeleteTrip, useDuplicateTrip, useShareTrip } from '@/hooks/useTrips'
import { useItineraryActivities, useCalendar } from '@/hooks/useItinerary'
import { api, friendlyErrorMessage } from '@/lib/api'
import { placeholderImage } from '@/lib/images'
import { formatCurrency, formatDateRange, tripDurationDays } from '@/lib/utils'

const TABS = ['Overview', 'Itinerary', 'Map', 'Calendar', 'Budget'] as const
type Tab = (typeof TABS)[number]

const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'success'> = { draft: 'neutral', planned: 'brand', completed: 'success' }

export default function TripDetails() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Overview')
  const [calendarMode, setCalendarMode] = useState<'calendar' | 'timeline'>('timeline')
  const [editOpen, setEditOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const { data: trip, isLoading } = useTrip(tripId)
  const { data: itineraryItems = [] } = useItineraryActivities(tripId)

  const handleDownloadIcs = async () => {
    if (!tripId || !trip) return
    try {
      const response = await api.get(`/trips/${tripId}/export.ics`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${trip.name.replace(/[^A-Za-z0-9 _-]/g, '')}.ics`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "We couldn't export your itinerary."))
    }
  }
  const { data: calendarDays = [] } = useCalendar(tripId)

  const deleteTrip = useDeleteTrip()
  const duplicateTrip = useDuplicateTrip()
  const shareTrip = useShareTrip()

  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!trip) return []
    const stopMarkers: MapMarker[] = trip.stops
      .filter((s) => s.destination)
      .map((s) => ({ id: s.id, lat: s.destination!.latitude, lng: s.destination!.longitude, label: s.destination!.city, sublabel: s.destination!.country, kind: 'destination' }))
    const activityMarkers: MapMarker[] = itineraryItems
      .filter((i) => i.activity)
      .map((i) => ({
        id: i.id,
        lat: i.activity!.latitude,
        lng: i.activity!.longitude,
        label: i.activity!.name,
        sublabel: `${formatCurrency(i.custom_cost ?? i.activity!.price, i.activity!.currency)} · ${i.activity!.category}`,
        kind: 'activity',
      }))
    return [...stopMarkers, ...activityMarkers]
  }, [trip, itineraryItems])

  if (isLoading || !trip) return <PageLoader />

  const duration = tripDurationDays(trip.start_date, trip.end_date)

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl">
        <div className="relative h-56 sm:h-72">
          <img src={trip.cover_image || placeholderImage(trip.name, 1400, 500)} alt={trip.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6">
            <div className="text-white">
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={STATUS_TONE[trip.status]}>{trip.status}</Badge>
                <Badge tone="neutral" className="bg-white/15 text-white">
                  {trip.visibility === 'public' ? <Globe2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {trip.visibility}
                </Badge>
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{trip.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                <Calendar className="h-3.5 w-3.5" /> {formatDateRange(trip.start_date, trip.end_date)}
                {duration > 0 && ` · ${duration} day${duration === 1 ? '' : 's'}`}
                {' · '}{trip.destination_count} destination{trip.destination_count === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex gap-2 no-print">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => setAiOpen(true)}>
                <Sparkles className="h-3.5 w-3.5" /> AI Assistant
              </Button>
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => setShareOpen(true)}>
                Share
              </Button>
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-100 hover:bg-ink-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-sm text-ink-500">
          <button onClick={() => duplicateTrip.mutate(trip.id)} className="flex items-center gap-1.5 rounded-full border border-ink-100 px-3 py-1.5 hover:bg-ink-50">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 rounded-full border border-ink-100 px-3 py-1.5 text-danger-500 hover:bg-danger-500/5">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Destinations</h2>
              <StopsManager tripId={trip.id} stops={trip.stops} currency={trip.currency} />
            </div>
            {trip.description && (
              <div>
                <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">About this trip</h2>
                <p className="text-sm text-ink-600">{trip.description}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Wallet className="h-4 w-4 text-brand-600" /> Budget snapshot
              </p>
              <p className="text-2xl font-bold text-ink-900">{formatCurrency(trip.spent, trip.currency)}</p>
              <p className="text-xs text-ink-400">of {formatCurrency(trip.budget_total, trip.currency)} budgeted</p>
              <button onClick={() => setTab('Budget')} className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700">
                View full budget →
              </button>
            </div>
            {trip.stops[0]?.destination && (
              <WeatherCard destinationId={trip.stops[0].destination.id} city={trip.stops[0].destination.city} />
            )}
            <PackingListCard tripId={trip.id} />
          </div>
        </div>
      )}

      {tab === 'Itinerary' && <ItineraryBuilder tripId={trip.id} stops={trip.stops} items={itineraryItems} />}

      {tab === 'Map' && (
        mapMarkers.length > 0 ? (
          <MapView markers={mapMarkers} showRoute height={520} className="overflow-hidden rounded-2xl border border-ink-100" />
        ) : (
          <EmptyState icon={<MapIcon className="h-7 w-7" />} title="Nothing to show on the map yet" description="Add destinations or activities to see them plotted here." />
        )
      )}

      {tab === 'Calendar' && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex gap-2">
              <button
                onClick={() => setCalendarMode('calendar')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${calendarMode === 'calendar' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-100 text-ink-600'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Calendar
              </button>
              <button
                onClick={() => setCalendarMode('timeline')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${calendarMode === 'timeline' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-100 text-ink-600'}`}
              >
                <List className="h-3.5 w-3.5" /> Timeline
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadIcs}
                className="flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                <Download className="h-3.5 w-3.5" /> Export calendar
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                <Printer className="h-3.5 w-3.5" /> Print itinerary
              </button>
            </div>
          </div>
          {calendarMode === 'calendar' ? <CalendarGridView days={calendarDays} /> : <TimelineView days={calendarDays} />}
        </div>
      )}

      {tab === 'Budget' && <BudgetTab trip={trip} stops={trip.stops} itineraryItems={itineraryItems} />}

      <EditTripModal trip={trip} open={editOpen} onClose={() => setEditOpen(false)} />
      <ShareTripModal
        trip={shareOpen ? trip : null}
        onClose={() => setShareOpen(false)}
        onShare={(id) => shareTrip.mutate({ tripId: id, share: true })}
        onUnshare={(id) => shareTrip.mutate({ tripId: id, share: false })}
        isLoading={shareTrip.isPending}
      />
      <AIItineraryModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        tripId={trip.id}
        prefill={{ destination: trip.stops[0]?.destination?.city ?? '', duration_days: duration || 3, budget: trip.budget_total || 1000, currency: trip.currency }}
        onUse={() => setAiOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteTrip.mutate(trip.id, { onSuccess: () => navigate('/trips') })
          setDeleteOpen(false)
        }}
        title="Delete this trip?"
        description="This will permanently delete the trip, including its itinerary and budget records."
        confirmLabel="Delete trip"
        isLoading={deleteTrip.isPending}
      />
    </div>
  )
}
