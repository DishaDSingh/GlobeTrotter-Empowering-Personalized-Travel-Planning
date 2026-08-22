import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Pencil, Plus, Sparkles, Trash2, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddBudgetRecordModal } from './AddBudgetRecordModal'
import { AIBudgetOptimizerModal } from './AIBudgetOptimizerModal'
import { useBudget, useDeleteBudgetRecord } from '@/hooks/useBudget'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BudgetRecord, ItineraryActivity, TripDetail, TripStop } from '@/types'

const PIE_COLORS = ['#0d8f86', '#f97316', '#38bdf8', '#10b981', '#c2410c', '#134e4a']

export function BudgetTab({ trip, stops, itineraryItems }: { trip: TripDetail; stops: TripStop[]; itineraryItems: ItineraryActivity[] }) {
  const { data: summary, isLoading } = useBudget(trip.id)
  const deleteRecord = useDeleteBudgetRecord(trip.id)

  const [addOpen, setAddOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<BudgetRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  const cityBreakdown = useMemo(() => {
    const byStop = new Map<string, number>()
    for (const item of itineraryItems) {
      const cost = item.custom_cost ?? item.activity?.price ?? 0
      byStop.set(item.trip_stop_id, (byStop.get(item.trip_stop_id) ?? 0) + cost)
    }
    return stops
      .map((stop) => ({
        city: stop.destination?.city ?? 'Unknown',
        actual: byStop.get(stop.id) ?? 0,
        planned: stop.planned_budget ?? 0,
      }))
      .filter((row) => row.actual > 0 || row.planned > 0)
  }, [itineraryItems, stops])

  const hasPlannedBudgets = cityBreakdown.some((row) => row.planned > 0)

  const spendingOverTime = useMemo(() => {
    if (!summary) return []
    const byDate = new Map<string, number>()
    for (const r of summary.records) {
      if (!r.date) continue
      byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.amount)
    }
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({ date: formatDate(date, { month: 'short', day: 'numeric' }), amount }))
  }, [summary])

  if (isLoading || !summary) {
    return <p className="text-sm text-ink-400">Loading budget…</p>
  }

  const alertMessage =
    summary.total_budget > 0 && summary.percent_used >= 100
      ? `You have exceeded your planned budget by ${formatCurrency(summary.spent - summary.total_budget, trip.currency)}.`
      : summary.total_budget > 0 && summary.percent_used >= 70
        ? `You are currently using ${summary.percent_used.toFixed(0)}% of your planned budget.`
        : null

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-ink-400">Total Budget</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">{formatCurrency(summary.total_budget, trip.currency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-ink-400">Spent</p>
          <p className="mt-1 font-display text-2xl font-bold text-sunset-600">{formatCurrency(summary.spent, trip.currency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-ink-400">Remaining</p>
          <p className={`mt-1 font-display text-2xl font-bold ${summary.remaining < 0 ? 'text-danger-500' : 'text-emerald-600'}`}>
            {formatCurrency(summary.remaining, trip.currency)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-ink-400">Avg. daily cost</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">{formatCurrency(summary.average_daily_cost, trip.currency)}</p>
        </Card>
      </div>

      {alertMessage && (
        <div className={`rounded-xl p-4 text-sm font-medium ${summary.percent_used >= 100 ? 'bg-danger-500/10 text-danger-600' : 'bg-sunset-100 text-sunset-700'}`}>
          {alertMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add expense
        </Button>
        <Button variant="outline" onClick={() => setAiOpen(true)}>
          <Sparkles className="h-4 w-4" /> Optimize My Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">Spending by category</h3>
          {summary.by_category.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={summary.by_category} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {summary.by_category.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), trip.currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-ink-400">Add expenses to see this chart.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">City-by-city spending</h3>
          {cityBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4ecf0" />
                <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value), trip.currency)} />
                {hasPlannedBudgets && <Legend />}
                <Bar dataKey="actual" name="Actual" fill="#0d8f86" radius={[6, 6, 0, 0]} />
                {hasPlannedBudgets && <Bar dataKey="planned" name="Planned" fill="#e7e5e4" radius={[6, 6, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-ink-400">
              Add itinerary activities, or set a planned budget per destination in the Overview tab, to see this chart.
            </p>
          )}
        </Card>
      </div>

      {spendingOverTime.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">Spending over time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={spendingOverTime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4ecf0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value), trip.currency)} />
              <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div>
        <h3 className="mb-3 font-display text-base font-semibold text-ink-900">Expenses</h3>
        {summary.records.length === 0 ? (
          <EmptyState icon={<Wallet className="h-7 w-7" />} title="No expenses logged" description="Add your first expense to start tracking your budget." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-100">
            {summary.records.map((record) => (
              <div key={record.id} className="flex items-center justify-between border-b border-ink-100 p-3.5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-900">{record.description || record.category}</p>
                  <p className="text-xs text-ink-400">{record.category} · {record.date ? formatDate(record.date) : 'No date'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-ink-800">{formatCurrency(record.amount, record.currency)}</p>
                  <button onClick={() => setEditRecord(record)} className="text-ink-400 hover:text-ink-700" aria-label="Edit expense">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(record.id)} className="text-ink-400 hover:text-danger-500" aria-label="Delete expense">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddBudgetRecordModal open={addOpen || !!editRecord} onClose={() => { setAddOpen(false); setEditRecord(null) }} tripId={trip.id} currency={trip.currency} editingRecord={editRecord} />
      <AIBudgetOptimizerModal open={aiOpen} onClose={() => setAiOpen(false)} tripId={trip.id} currency={trip.currency} />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteRecord.mutate(deleteId)
          setDeleteId(null)
        }}
        title="Delete this expense?"
        confirmLabel="Delete"
        isLoading={deleteRecord.isPending}
      />
    </div>
  )
}
