import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bed,
  Car,
  Compass,
  MapPin,
  Plane,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDestination, useDestinationSearch, useTripGuide } from '@/hooks/useDestinations'
import { useAuth } from '@/context/AuthContext'
import { cityImage } from '@/lib/images'
import { savePendingTripGuide } from '@/lib/pendingPlan'
import { formatCurrency, debounce } from '@/lib/utils'
import type { Destination, TripGuidePrefill } from '@/types'

const PIE_COLORS = ['#0d8f86', '#f97316', '#38bdf8', '#10b981', '#c2410c']

export default function TripGuide() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const prefillId = (location.state as { destinationId?: string } | null)?.destinationId

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [selected, setSelected] = useState<Destination | null>(null)
  const [totalDays, setTotalDays] = useState(30)
  const [travelers, setTravelers] = useState(1)

  const { data: prefillDestination } = useDestination(prefillId)
  useEffect(() => {
    if (prefillDestination) setSelected(prefillDestination)
  }, [prefillDestination])

  const updateDebounced = useMemo(() => debounce((v: string) => setDebounced(v), 300), [])
  const { data: results } = useDestinationSearch(debounced)
  const { data: guide, isLoading, isError } = useTripGuide(selected?.id, totalDays, travelers)

  const costSummary = guide
    ? [
        { name: 'Accommodation', value: guide.accommodation_total },
        { name: 'Food', value: guide.food_total },
        { name: 'Local transport', value: guide.local_transport_total },
        { name: 'Activities', value: guide.activities_total },
        { name: 'Inter-city transport', value: guide.inter_city_transport_total },
      ].filter((c) => c.value > 0)
    : []

  const handleUseGuide = () => {
    if (!guide) return
    const tripGuide: TripGuidePrefill = {
      name: guide.legs.length > 1 ? `${guide.primary_destination} Multi-City Trip` : `${guide.primary_destination} Trip`,
      currency: guide.currency,
      budgetTotal: guide.grand_total,
      legs: guide.legs.map((leg) => ({
        destination: leg.destination,
        days: leg.days,
        activities: leg.top_activities,
      })),
    }

    if (!isAuthenticated) {
      savePendingTripGuide(tripGuide)
      navigate('/login')
      return
    }
    navigate('/trips/create', { state: { tripGuide } })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Trip Guide</h1>
        <p className="mt-1 text-ink-500">
          Tell us where you're headed and for how long — we'll suggest which cities to combine, how many days for
          each, and a full cost breakdown: accommodation, food, local transport, inter-city travel, and activities.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr] sm:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-800">Destination</label>
            <SearchBar
              value={selected ? `${selected.city}, ${selected.country}` : query}
              onChange={(v) => {
                setSelected(null)
                setQuery(v)
                updateDebounced(v)
              }}
              placeholder="e.g. Rome, Delhi, Bangkok..."
            />
            {debounced && !selected && (
              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ink-100 bg-white p-2 shadow-[var(--shadow-lift)]">
                {results?.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelected(d)
                      setQuery('')
                      setDebounced('')
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-ink-50"
                  >
                    <img src={d.image_url || cityImage(d.city, 100)} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-900">{d.city}</p>
                      <p className="text-xs text-ink-400">{d.country}</p>
                    </div>
                  </button>
                ))}
                {results?.length === 0 && <p className="p-2 text-sm text-ink-400">No matches found.</p>}
              </div>
            )}
          </div>
          <Input
            label="Trip length (days)"
            type="number"
            min={1}
            max={90}
            value={totalDays}
            onChange={(e) => setTotalDays(Math.min(90, Math.max(1, Number(e.target.value) || 1)))}
          />
          <Input
            label="Travelers"
            type="number"
            min={1}
            max={20}
            value={travelers}
            onChange={(e) => setTravelers(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
          />
        </div>
      </Card>

      {!selected && (
        <EmptyState
          icon={<Compass className="h-7 w-7" />}
          title="Pick a destination to get started"
          description="Search for a city above — try 'Rome' for a month-long multi-city Italy plan, or any of our 68 destinations."
        />
      )}

      {selected && isLoading && <p className="text-sm text-ink-400">Building your trip guide…</p>}
      {selected && isError && (
        <EmptyState icon={<Compass className="h-7 w-7" />} title="Couldn't build a guide" description="Please try again." />
      )}

      {guide && (
        <div className="space-y-8">
          <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="eyebrow text-brand-600">{guide.total_days}-day trip · {guide.travelers} traveler{guide.travelers === 1 ? '' : 's'}</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-ink-900">
                {guide.legs.length > 1 ? `${guide.primary_destination} & ${guide.legs.length - 1} more` : guide.primary_destination}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {guide.legs.map((l) => l.destination.city).join(' → ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-400">Estimated total</p>
              <p className="font-display text-3xl font-bold text-ink-900">{formatCurrency(guide.grand_total, guide.currency)}</p>
              <Button className="mt-3" onClick={handleUseGuide}>
                Start planning this trip <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Route timeline */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold text-ink-900">Suggested route</h3>
            <div className="space-y-4">
              {guide.legs.map((leg, i) => (
                <div key={leg.destination.id}>
                  <Card className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <img
                        src={leg.destination.image_url || cityImage(leg.destination.city)}
                        alt={leg.destination.city}
                        className="h-40 w-full object-cover sm:h-auto sm:w-48"
                      />
                      <div className="flex-1 p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="flex items-center gap-1.5 font-display text-lg font-bold text-ink-900">
                              <MapPin className="h-4 w-4 text-brand-600" /> {leg.destination.city}
                            </p>
                            <p className="text-sm text-ink-400">{leg.destination.country}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-xl font-bold text-ink-900">{formatCurrency(leg.subtotal, guide.currency)}</p>
                            <p className="text-xs text-ink-400">{leg.days} day{leg.days === 1 ? '' : 's'} · {leg.nights} night{leg.nights === 1 ? '' : 's'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <CostChip icon={<Bed className="h-3.5 w-3.5" />} label="Hotel" value={formatCurrency(leg.accommodation_cost, guide.currency)} />
                          <CostChip icon={<UtensilsCrossed className="h-3.5 w-3.5" />} label="Food" value={formatCurrency(leg.food_cost, guide.currency)} />
                          <CostChip icon={<Car className="h-3.5 w-3.5" />} label="Local transport" value={formatCurrency(leg.local_transport_cost, guide.currency)} />
                          <CostChip icon={<Sparkles className="h-3.5 w-3.5" />} label="Activities" value={formatCurrency(leg.activities_cost, guide.currency)} />
                        </div>

                        {leg.top_activities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {leg.top_activities.map((a) => (
                              <span key={a.id} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                                {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {guide.hops[i] && (
                    <div className="ml-6 flex items-center gap-2.5 border-l-2 border-dashed border-ink-200 py-3 pl-6 text-sm text-ink-500">
                      <Plane className="h-4 w-4 text-ink-400" />
                      {guide.hops[i].mode} to {guide.hops[i].to_city} · {formatCurrency(guide.hops[i].estimated_cost, guide.currency)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold text-ink-900">Where the money goes</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={costSummary} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {costSummary.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value), guide.currency)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold text-ink-900">Cost by city</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={guide.legs.map((l) => ({ city: l.destination.city, cost: l.subtotal }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4ecf0" />
                  <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), guide.currency)} />
                  <Bar dataKey="cost" fill="#0d8f86" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <p className="text-xs text-ink-400">{guide.notes}</p>
        </div>
      )}
    </div>
  )
}

function CostChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-warm-100 p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-ink-400">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  )
}
