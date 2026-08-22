import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  ImageIcon,
  MapPin,
  Plus,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { SearchBar } from '@/components/ui/SearchBar'
import { Card } from '@/components/ui/Card'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { AIItineraryModal } from '@/components/trips/AIItineraryModal'
import { useDestinationSearch, useDestination } from '@/hooks/useDestinations'
import { useActivities } from '@/hooks/useActivities'
import { api, friendlyErrorMessage } from '@/lib/api'
import { cityImage, placeholderImage } from '@/lib/images'
import { debounce, formatCurrency } from '@/lib/utils'
import type { Activity, AIItineraryResponse, Destination, Trip, TripGuidePrefill } from '@/types'

interface SelectedDestination {
  destination: Destination
  arrival_date: string
  departure_date: string
}

const STEPS = ['Basics', 'Dates', 'Destinations', 'Activities', 'Budget', 'Review']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AED', 'SGD']

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function CreateTrip() {
  const navigate = useNavigate()
  const location = useLocation()
  const routerState = location.state as
    | { destinationId?: string; aiPlan?: AIItineraryResponse; tripGuide?: TripGuidePrefill }
    | null
  const prefillDestinationId = routerState?.destinationId
  const aiPlan = routerState?.aiPlan
  const tripGuide = routerState?.tripGuide
  const tripGuideTotalDays = tripGuide?.legs.reduce((sum, leg) => sum + leg.days, 0) ?? 0

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [appliedAiPlan, setAppliedAiPlan] = useState(false)

  const [name, setName] = useState(tripGuide?.name ?? (aiPlan ? `${aiPlan.destination} Trip` : ''))
  const [description, setDescription] = useState(
    tripGuide
      ? `A ${tripGuideTotalDays}-day trip across ${tripGuide.legs.map((l) => l.destination.city).join(', ')}.`
      : aiPlan
        ? `AI-drafted ${aiPlan.duration_days}-day plan for ${aiPlan.destination}, built around your budget.`
        : '',
  )
  const [coverImage, setCoverImage] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(() => {
    const days = tripGuide ? tripGuideTotalDays : aiPlan?.duration_days
    if (!days) return ''
    const start = new Date()
    start.setDate(start.getDate() + 14)
    const end = new Date(start)
    end.setDate(end.getDate() + days - 1)
    return end.toISOString().slice(0, 10)
  })
  const [destinations, setDestinations] = useState<SelectedDestination[]>(() => {
    if (!tripGuide) return []
    const start = new Date()
    start.setDate(start.getDate() + 14)
    let cursor = start.toISOString().slice(0, 10)
    return tripGuide.legs.map((leg) => {
      const arrival = cursor
      const departure = addDays(cursor, leg.days)
      cursor = departure
      return { destination: leg.destination, arrival_date: arrival, departure_date: departure }
    })
  })
  const [activitiesByDestination, setActivitiesByDestination] = useState<Record<string, Activity[]>>(() => {
    if (!tripGuide) return {}
    const map: Record<string, Activity[]> = {}
    for (const leg of tripGuide.legs) map[leg.destination.id] = leg.activities
    return map
  })
  const [budgetTotal, setBudgetTotal] = useState<number>(tripGuide?.budgetTotal ?? aiPlan?.total_estimated_cost ?? 0)
  const [currency, setCurrency] = useState(tripGuide?.currency ?? aiPlan?.currency ?? 'USD')

  useEffect(() => {
    if ((aiPlan || tripGuide) && !startDate) {
      const start = new Date()
      start.setDate(start.getDate() + 14)
      setStartDate(start.toISOString().slice(0, 10))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: prefillDestination } = useDestination(prefillDestinationId)
  useEffect(() => {
    if (prefillDestination) {
      setDestinations((prev) =>
        prev.some((d) => d.destination.id === prefillDestination.id)
          ? prev
          : [...prev, { destination: prefillDestination, arrival_date: '', departure_date: '' }],
      )
      setCurrency(prefillDestination.currency)
    }
  }, [prefillDestination])

  const { data: aiPlanDestinationMatch } = useDestinationSearch(aiPlan && !appliedAiPlan ? aiPlan.destination : '')
  useEffect(() => {
    if (aiPlan && !appliedAiPlan && aiPlanDestinationMatch) {
      const match = aiPlanDestinationMatch.find((d) => d.city.toLowerCase() === aiPlan.destination.toLowerCase())
      if (match) {
        setDestinations((prev) => (prev.some((d) => d.destination.id === match.id) ? prev : [...prev, { destination: match, arrival_date: '', departure_date: '' }]))
        setAppliedAiPlan(true)
      } else if (aiPlanDestinationMatch.length === 0) {
        setAppliedAiPlan(true)
      }
    }
  }, [aiPlan, appliedAiPlan, aiPlanDestinationMatch])

  const canGoNext = () => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return startDate && endDate && startDate <= endDate
    if (step === 2) return destinations.length > 0
    return true
  }

  const buildAIPrefill = () => ({
    destination: destinations[0]?.destination.city ?? '',
    duration_days:
      startDate && endDate ? Math.max(Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1, 1) : 3,
    budget: budgetTotal || 1000,
    currency,
  })

  const handleAIItinerary = (result: AIItineraryResponse) => {
    setBudgetTotal(Math.ceil(result.total_estimated_cost))
    setCurrency(result.currency)
    toast.success('Applied the AI-estimated budget. Finish creating your trip, then use the AI Assistant in the Itinerary tab to add these activities.')
    setAiModalOpen(false)
  }

  const handleSubmit = async (asDraft: boolean) => {
    setSubmitting(true)
    try {
      const { data: trip } = await api.post<Trip>('/trips', {
        name,
        description: description || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        cover_image: coverImage || undefined,
        status: asDraft ? 'draft' : 'planned',
        budget_total: budgetTotal || 0,
        currency,
      })

      for (const sel of destinations) {
        const { data: stop } = await api.post(`/trips/${trip.id}/stops`, {
          destination_id: sel.destination.id,
          arrival_date: sel.arrival_date || undefined,
          departure_date: sel.departure_date || undefined,
        })
        const activities = activitiesByDestination[sel.destination.id] ?? []
        for (const activity of activities) {
          await api.post(`/trips/${trip.id}/activities`, {
            trip_stop_id: stop.id,
            activity_id: activity.id,
            date: sel.arrival_date || startDate || undefined,
          })
        }
      }

      toast.success(asDraft ? 'Trip saved as draft.' : 'Trip created!')
      navigate(`/trips/${trip.id}`)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, "We couldn't create your trip."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Create a new trip</h1>
        <p className="mt-1 text-ink-500">A few quick steps and you'll have a plan ready to refine.</p>
      </div>

      {aiPlan && (
        <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            We've pre-filled this trip from your AI budget plan for <strong>{aiPlan.destination}</strong>
            {' '}({formatCurrency(aiPlan.total_estimated_cost, aiPlan.currency)} estimated). Once your trip is
            created, open the AI Assistant in the Itinerary tab to add these exact activities.
          </p>
        </div>
      )}

      {tripGuide && (
        <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            We've pre-filled this trip from your Trip Guide:{' '}
            <strong>{tripGuide.legs.map((l) => l.destination.city).join(' → ')}</strong>
            {' '}({formatCurrency(tripGuide.budgetTotal, tripGuide.currency)} estimated), with dates, destinations,
            and suggested activities already in place — review and adjust anything below before creating it.
          </p>
        </div>
      )}

      <Stepper steps={STEPS} current={step} />

      <Card className="p-6 sm:p-8">
        {step === 0 && (
          <StepBasics name={name} setName={setName} description={description} setDescription={setDescription} coverImage={coverImage} setCoverImage={setCoverImage} />
        )}
        {step === 1 && <StepDates startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />}
        {step === 2 && <StepDestinations destinations={destinations} setDestinations={setDestinations} />}
        {step === 3 && (
          <StepActivities
            destinations={destinations}
            activitiesByDestination={activitiesByDestination}
            setActivitiesByDestination={setActivitiesByDestination}
          />
        )}
        {step === 4 && (
          <StepBudget
            budgetTotal={budgetTotal}
            setBudgetTotal={setBudgetTotal}
            currency={currency}
            setCurrency={setCurrency}
            onOpenAI={() => setAiModalOpen(true)}
          />
        )}
        {step === 5 && (
          <StepReview
            name={name}
            description={description}
            coverImage={coverImage}
            startDate={startDate}
            endDate={endDate}
            destinations={destinations}
            activitiesByDestination={activitiesByDestination}
            budgetTotal={budgetTotal}
            currency={currency}
          />
        )}

        <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canGoNext()}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSubmit(true)} isLoading={submitting}>
                Save as draft
              </Button>
              <Button onClick={() => handleSubmit(false)} isLoading={submitting}>
                <Check className="h-4 w-4" /> Create Trip
              </Button>
            </div>
          )}
        </div>
      </Card>

      <AIItineraryModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} prefill={buildAIPrefill()} onUse={handleAIItinerary} />
    </div>
  )
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar sm:gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                i < current ? 'bg-brand-600 text-white' : i === current ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : 'bg-ink-100 text-ink-400'
              }`}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`hidden text-sm font-medium sm:block ${i === current ? 'text-ink-900' : 'text-ink-400'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className="h-px w-4 bg-ink-200 sm:w-8" />}
        </div>
      ))}
    </div>
  )
}

function StepBasics({
  name,
  setName,
  description,
  setDescription,
  coverImage,
  setCoverImage,
}: {
  name: string
  setName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  coverImage: string
  setCoverImage: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">Let's name your trip</h2>
      <Input label="Trip name" required placeholder="e.g. Summer in Southeast Asia" value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea label="Description" placeholder="What's this trip about?" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input
        label="Cover image URL"
        placeholder="https://..."
        leftIcon={<ImageIcon className="h-4 w-4" />}
        value={coverImage}
        onChange={(e) => setCoverImage(e.target.value)}
        hint="Optional — leave blank to use a default image."
      />
      {coverImage && (
        <img src={coverImage} alt="Cover preview" className="h-40 w-full rounded-xl object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}
    </div>
  )
}

function StepDates({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: {
  startDate: string
  endDate: string
  setStartDate: (v: string) => void
  setEndDate: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">When are you traveling?</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Start date" type="date" required leftIcon={<Calendar className="h-4 w-4" />} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="End date" type="date" required leftIcon={<Calendar className="h-4 w-4" />} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {startDate && endDate && startDate > endDate && <p className="text-sm text-danger-500">End date must be after the start date.</p>}
    </div>
  )
}

function StepDestinations({
  destinations,
  setDestinations,
}: {
  destinations: SelectedDestination[]
  setDestinations: (updater: (prev: SelectedDestination[]) => SelectedDestination[]) => void
}) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const updateDebounced = useMemo(() => debounce((v: string) => setDebounced(v), 300), [])
  const { data: results, isLoading } = useDestinationSearch(debounced)

  const addDestination = (destination: Destination) => {
    setDestinations((prev) =>
      prev.some((d) => d.destination.id === destination.id) ? prev : [...prev, { destination, arrival_date: '', departure_date: '' }],
    )
    setQuery('')
    setDebounced('')
  }

  const removeDestination = (id: string) => {
    setDestinations((prev) => prev.filter((d) => d.destination.id !== id))
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">Choose your destinations</h2>
      <SearchBar value={query} onChange={(v) => { setQuery(v); updateDebounced(v) }} placeholder="Search cities to add..." />

      {debounced && (
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-ink-100 p-2">
          {isLoading && <p className="p-2 text-sm text-ink-400">Searching…</p>}
          {results?.map((d) => (
            <button
              key={d.id}
              onClick={() => addDestination(d)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-ink-50"
            >
              <img src={d.image_url || cityImage(d.city, 100)} alt={d.city} className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{d.city}</p>
                <p className="text-xs text-ink-400">{d.country}</p>
              </div>
              <Plus className="h-4 w-4 text-brand-600" />
            </button>
          ))}
          {results?.length === 0 && !isLoading && <p className="p-2 text-sm text-ink-400">No matches found.</p>}
        </div>
      )}

      {destinations.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-700">Trip order (in order visited)</p>
          {destinations.map((sel, idx) => (
            <div key={sel.destination.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{idx + 1}</span>
              <img src={sel.destination.image_url || cityImage(sel.destination.city, 100)} alt={sel.destination.city} className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{sel.destination.city}</p>
                <p className="text-xs text-ink-400">{sel.destination.country}</p>
              </div>
              <button onClick={() => removeDestination(sel.destination.id)} aria-label="Remove destination" className="text-ink-400 hover:text-danger-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
          Search and add at least one destination to continue.
        </p>
      )}
    </div>
  )
}

function StepActivities({
  destinations,
  activitiesByDestination,
  setActivitiesByDestination,
}: {
  destinations: SelectedDestination[]
  activitiesByDestination: Record<string, Activity[]>
  setActivitiesByDestination: (updater: (prev: Record<string, Activity[]>) => Record<string, Activity[]>) => void
}) {
  const [activeDestId, setActiveDestId] = useState(destinations[0]?.destination.id ?? '')
  const { data: activities, isLoading } = useActivities({ destination_id: activeDestId })
  const selected = activitiesByDestination[activeDestId] ?? []

  const toggleActivity = (activity: Activity) => {
    setActivitiesByDestination((prev) => {
      const current = prev[activeDestId] ?? []
      const exists = current.some((a) => a.id === activity.id)
      return { ...prev, [activeDestId]: exists ? current.filter((a) => a.id !== activity.id) : [...current, activity] }
    })
  }

  if (destinations.length === 0) {
    return <p className="text-sm text-ink-400">Add destinations in the previous step to pick activities.</p>
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">Pick a few must-do activities</h2>
      <p className="text-sm text-ink-500">Optional — you can add more later in the itinerary builder.</p>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {destinations.map((sel) => (
          <button
            key={sel.destination.id}
            onClick={() => setActiveDestId(sel.destination.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
              activeDestId === sel.destination.id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {sel.destination.city} {(activitiesByDestination[sel.destination.id]?.length ?? 0) > 0 && `(${activitiesByDestination[sel.destination.id].length})`}
          </button>
        ))}
      </div>

      <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
        {isLoading && <p className="text-sm text-ink-400">Loading activities…</p>}
        {activities?.map((activity) => {
          const isSelected = selected.some((a) => a.id === activity.id)
          return (
            <div key={activity.id} className={isSelected ? 'rounded-xl ring-2 ring-brand-500' : ''}>
              <ActivityCard activity={activity} onAdd={() => toggleActivity(activity)} compact />
            </div>
          )
        })}
        {activities?.length === 0 && !isLoading && <p className="text-sm text-ink-400">No activities listed for this destination yet.</p>}
      </div>
    </div>
  )
}

function StepBudget({
  budgetTotal,
  setBudgetTotal,
  currency,
  setCurrency,
  onOpenAI,
}: {
  budgetTotal: number
  setBudgetTotal: (v: number) => void
  currency: string
  setCurrency: (v: string) => void
  onOpenAI: () => void
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">Set your budget</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
        <Input
          label="Total budget"
          type="number"
          min={0}
          leftIcon={<Wallet className="h-4 w-4" />}
          value={budgetTotal || ''}
          onChange={(e) => setBudgetTotal(Number(e.target.value) || 0)}
        />
        <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      <p className="text-sm text-ink-500">You can log detailed expenses by category once your trip is created.</p>

      <button
        onClick={onOpenAI}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-brand-300 bg-brand-50 p-4 text-left hover:bg-brand-100"
      >
        <Sparkles className="h-5 w-5 text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-brand-800">Not sure what fits your budget?</p>
          <p className="text-xs text-brand-600">Try the AI trip planner for a suggested itinerary and cost estimate.</p>
        </div>
      </button>
    </div>
  )
}

function StepReview({
  name,
  description,
  coverImage,
  startDate,
  endDate,
  destinations,
  activitiesByDestination,
  budgetTotal,
  currency,
}: {
  name: string
  description: string
  coverImage: string
  startDate: string
  endDate: string
  destinations: SelectedDestination[]
  activitiesByDestination: Record<string, Activity[]>
  budgetTotal: number
  currency: string
}) {
  const totalActivities = Object.values(activitiesByDestination).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold text-ink-900">Review your trip</h2>

      <div className="overflow-hidden rounded-xl border border-ink-100">
        <img src={coverImage || placeholderImage(name || 'trip', 900, 300)} alt="" className="h-36 w-full object-cover" />
        <div className="p-4">
          <p className="font-display text-lg font-bold text-ink-900">{name || 'Untitled trip'}</p>
          {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
          <p className="mt-2 flex items-center gap-1 text-sm text-ink-500">
            <Calendar className="h-3.5 w-3.5" /> {startDate || '—'} to {endDate || '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReviewStat icon={<MapPin className="h-4 w-4" />} label="Destinations" value={destinations.length} />
        <ReviewStat icon={<Compass className="h-4 w-4" />} label="Activities" value={totalActivities} />
        <ReviewStat icon={<Wallet className="h-4 w-4" />} label="Budget" value={formatCurrency(budgetTotal, currency)} />
        <ReviewStat
          icon={<Calendar className="h-4 w-4" />}
          label="Duration"
          value={startDate && endDate ? `${Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1}d` : '—'}
        />
      </div>

      <div className="space-y-2">
        {destinations.map((sel) => (
          <div key={sel.destination.id} className="rounded-xl border border-ink-100 p-3">
            <p className="text-sm font-semibold text-ink-900">{sel.destination.city}, {sel.destination.country}</p>
            <p className="text-xs text-ink-400">
              {(activitiesByDestination[sel.destination.id]?.length ?? 0)} activit{(activitiesByDestination[sel.destination.id]?.length ?? 0) === 1 ? 'y' : 'ies'} selected
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-100 p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600">{icon}</div>
      <p className="text-sm font-semibold text-ink-900">{value}</p>
      <p className="text-[11px] text-ink-400">{label}</p>
    </div>
  )
}
