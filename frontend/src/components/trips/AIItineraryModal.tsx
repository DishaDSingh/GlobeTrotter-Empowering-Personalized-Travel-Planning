import { useEffect, useState } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useAcceptAIItinerary, useGenerateAIItinerary } from '@/hooks/useAI'
import { formatCurrency } from '@/lib/utils'
import type { AIItineraryResponse } from '@/types'

const STYLES = ['Balanced', 'Adventure', 'Relaxation', 'Culture', 'Nightlife']

interface AIItineraryModalProps {
  open: boolean
  onClose: () => void
  prefill: { destination: string; duration_days: number; budget: number; currency: string }
  onUse: (result: AIItineraryResponse) => void
  tripId?: string
}

export function AIItineraryModal({ open, onClose, prefill, onUse, tripId }: AIItineraryModalProps) {
  const [destination, setDestination] = useState(prefill.destination)
  const [durationDays, setDurationDays] = useState(prefill.duration_days)
  const [budget, setBudget] = useState(prefill.budget)
  const [travelers, setTravelers] = useState(2)
  const [style, setStyle] = useState('Balanced')
  const [result, setResult] = useState<AIItineraryResponse | null>(null)

  const generate = useGenerateAIItinerary()
  const accept = useAcceptAIItinerary(tripId ?? '')

  useEffect(() => {
    if (open) {
      setDestination(prefill.destination)
      setDurationDays(prefill.duration_days)
      setBudget(prefill.budget)
      setResult(null)
    }
  }, [open, prefill.destination, prefill.duration_days, prefill.budget])

  const handleGenerate = () => {
    if (!destination.trim()) {
      toast.error('Enter a destination to generate an itinerary.')
      return
    }
    generate.mutate(
      { destination, duration_days: durationDays, budget, travelers, style, interests: [], currency: prefill.currency },
      { onSuccess: setResult },
    )
  }

  const handleAcceptToTrip = () => {
    if (!result || !tripId) return
    accept.mutate(result, {
      onSuccess: () => {
        toast.success('AI itinerary added to your trip!')
        onClose()
      },
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="AI Trip Planner" size="lg">
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            Describe your trip and we'll generate a structured day-by-day itinerary you can review before anything is saved.
          </p>
          <Input label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Paris" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (days)" type="number" min={1} max={30} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value) || 1)} />
            <Input label="Travelers" type="number" min={1} max={20} value={travelers} onChange={(e) => setTravelers(Number(e.target.value) || 1)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={`Budget (${prefill.currency})`} type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} />
            <Select label="Travel style" value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <Button className="w-full" onClick={handleGenerate} isLoading={generate.isPending}>
            <Wand2 className="h-4 w-4" /> Generate itinerary
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4">
            <div>
              <p className="text-sm font-semibold text-brand-800">{result.destination} · {result.duration_days} days</p>
              <p className="text-xs text-brand-600">Estimated total: {formatCurrency(result.total_estimated_cost, result.currency)}</p>
            </div>
            <Sparkles className="h-6 w-6 text-brand-500" />
          </div>

          {result.notes && <p className="rounded-lg bg-sunset-100 p-3 text-xs text-sunset-700">{result.notes}</p>}

          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {result.days.map((day) => (
              <div key={day.day} className="rounded-xl border border-ink-100 p-3">
                <p className="mb-2 text-sm font-semibold text-ink-900">Day {day.day} · {day.city}</p>
                <div className="space-y-1.5">
                  {day.activities.map((act, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-ink-600">
                      <span>{act.time} · {act.name}</span>
                      <span className="font-medium text-ink-800">{act.estimated_cost > 0 ? formatCurrency(act.estimated_cost, result.currency) : 'Free'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
              Try again
            </Button>
            {tripId ? (
              <Button className="flex-1" onClick={handleAcceptToTrip} isLoading={accept.isPending}>
                Add to trip
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => onUse(result)}>
                Use this estimate
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
