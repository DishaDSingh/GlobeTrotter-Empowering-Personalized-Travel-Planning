import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useGenerateAIItinerary } from '@/hooks/useAI'
import { useAuth } from '@/context/AuthContext'
import { savePendingPlan } from '@/lib/pendingPlan'
import { formatCurrency } from '@/lib/utils'

const STYLES = ['Balanced', 'Adventure', 'Relaxation', 'Culture', 'Nightlife']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY']

export function BudgetTripPlanner() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const generate = useGenerateAIItinerary()

  const [destination, setDestination] = useState('Paris')
  const [durationDays, setDurationDays] = useState(6)
  const [budget, setBudget] = useState(1200)
  const [currency, setCurrency] = useState('USD')
  const [style, setStyle] = useState('Balanced')

  const handleGenerate = () => {
    if (!destination.trim()) return
    generate.mutate({ destination, duration_days: durationDays, budget, travelers: 2, style, interests: [], currency })
  }

  const handleUsePlan = () => {
    if (!generate.data) return
    if (isAuthenticated) {
      navigate('/trips/create', { state: { aiPlan: generate.data } })
    } else {
      savePendingPlan(generate.data)
      navigate('/signup')
    }
  }

  const result = generate.data
  const overBudget = result ? result.total_estimated_cost > budget : false

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-5 space-y-5 rounded-3xl border border-ink-200 bg-warm-50 p-6">
        <div className="eyebrow flex items-center gap-2 text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-900" />
          Budget-first trip builder
        </div>
        <Input label="Where to?" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Paris, Goa, Tokyo" />

        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <label className="font-medium text-ink-800">Trip length</label>
            <span className="font-display font-semibold text-ink-900">{durationDays} days</span>
          </div>
          <input
            type="range"
            min={2}
            max={14}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Input label="Total budget" type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-800">Travel style</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  style === s ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={handleGenerate} isLoading={generate.isPending}>
          <Wand2 className="h-4 w-4" /> Build my budget-friendly plan
        </Button>
        <p className="text-xs text-ink-400">Free to try, no account needed. We'll fit activities to your budget automatically.</p>
      </div>

      <div className="lg:col-span-7 rounded-3xl border border-ink-200 bg-white p-6 sm:p-7">
        {!result && !generate.isPending && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-ink-400">
            <Sparkles className="mb-3 h-8 w-8 text-brand-400" />
            <p className="max-w-xs text-sm">Tell us your destination and budget on the left, and we'll draft a realistic day-by-day plan right here.</p>
          </div>
        )}

        {generate.isPending && (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-ink-400">Building your itinerary…</div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-brand-700">{result.destination} · {result.duration_days} days</p>
                <p className="font-display text-2xl font-bold text-ink-900">
                  {formatCurrency(result.total_estimated_cost, result.currency)}
                  <span className="text-sm font-sans font-normal text-ink-400"> estimated total</span>
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${overBudget ? 'bg-sunset-100 text-sunset-700' : 'bg-emerald-500/10 text-emerald-600'}`}>
                {overBudget ? 'Slightly over budget' : 'Within budget'}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className={`h-full rounded-full ${overBudget ? 'bg-sunset-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min((result.total_estimated_cost / Math.max(budget, 1)) * 100, 100)}%` }}
              />
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {result.days.map((day) => (
                <div key={day.day} className="rounded-xl border border-ink-100 p-3">
                  <p className="mb-1.5 text-sm font-semibold text-ink-900">Day {day.day}</p>
                  <div className="space-y-1">
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

            <Button className="w-full" onClick={handleUsePlan}>
              Use this plan <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
