import { useEffect } from 'react'
import { AlertTriangle, PartyPopper, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useOptimizeBudget } from '@/hooks/useAI'
import { formatCurrency } from '@/lib/utils'

export function AIBudgetOptimizerModal({ open, onClose, tripId, currency }: { open: boolean; onClose: () => void; tripId: string; currency: string }) {
  const optimize = useOptimizeBudget()

  useEffect(() => {
    if (open) optimize.mutate(tripId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripId])

  return (
    <Modal open={open} onClose={onClose} title="Optimize My Trip" size="md">
      {optimize.isPending && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner />
          <p className="text-sm text-ink-500">Analyzing your itinerary and budget…</p>
        </div>
      )}

      {optimize.data && (
        <div className="space-y-5">
          {optimize.data.over_by > 0 ? (
            <div className="flex items-start gap-3 rounded-xl bg-sunset-100 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sunset-600" />
              <div>
                <p className="text-sm font-semibold text-sunset-800">
                  Your current plan may exceed your budget by {formatCurrency(optimize.data.over_by, currency)}.
                </p>
                <p className="mt-0.5 text-xs text-sunset-700">
                  Projected spend: {formatCurrency(optimize.data.projected_spend, currency)} of {formatCurrency(optimize.data.total_budget, currency)} budgeted.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4">
              <PartyPopper className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">
                You're on track! Projected spend is {formatCurrency(optimize.data.projected_spend, currency)} of {formatCurrency(optimize.data.total_budget, currency)}.
              </p>
            </div>
          )}

          {optimize.data.suggestions.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                <Sparkles className="h-4 w-4 text-brand-600" /> Suggestions to reduce cost
              </p>
              <div className="space-y-2.5">
                {optimize.data.suggestions.map((s, i) => (
                  <div key={i} className="rounded-xl border border-ink-100 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink-900">{s.title}</p>
                      <span className="whitespace-nowrap text-xs font-semibold text-emerald-600">
                        save ~{formatCurrency(s.estimated_savings, currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">{s.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-400">
                These are suggestions only — nothing in your itinerary has been changed. Edit activities directly in the Itinerary tab if you'd like to apply them.
              </p>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </Modal>
  )
}
