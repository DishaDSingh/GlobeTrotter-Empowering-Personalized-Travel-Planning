import { Link } from 'react-router-dom'
import { Compass, MapPin, Plus, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTrips } from '@/hooks/useTrips'
import { useUserStats } from '@/hooks/useUser'
import { useRecommendedDestinations } from '@/hooks/useDestinations'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeletonGrid, Skeleton } from '@/components/ui/Skeleton'
import { TripCard } from '@/components/trips/TripCard'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { useDeleteTrip, useDuplicateTrip, useShareTrip } from '@/hooks/useTrips'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ShareTripModal } from '@/components/trips/ShareTripModal'
import { AIItineraryModal } from '@/components/trips/AIItineraryModal'
import { useNavigate } from 'react-router-dom'
import type { AIItineraryResponse, TripListItem } from '@/types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [aiOpen, setAiOpen] = useState(false)
  const { data: trips, isLoading: tripsLoading } = useTrips({ filter: 'upcoming', sort: 'start_date' })
  const { data: allTrips } = useTrips({ filter: 'all' })
  const { data: stats } = useUserStats()
  const { data: recommendations, isLoading: recsLoading } = useRecommendedDestinations(4)

  const deleteTrip = useDeleteTrip()
  const duplicateTrip = useDuplicateTrip()
  const shareTrip = useShareTrip()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [shareTarget, setShareTarget] = useState<TripListItem | null>(null)

  // Trips can be budgeted in different currencies, so totals are grouped by
  // currency rather than summed together as if they were the same unit.
  const budgetByCurrency = new Map<string, { budget: number; spent: number }>()
  for (const t of allTrips ?? []) {
    const bucket = budgetByCurrency.get(t.currency) ?? { budget: 0, spent: 0 }
    bucket.budget += t.budget_total
    bucket.spent += t.spent
    budgetByCurrency.set(t.currency, bucket)
  }
  const budgetGroups = Array.from(budgetByCurrency.entries())
  const overallPercentUsed = budgetGroups.length
    ? Math.round(
        (budgetGroups.reduce((sum, [, g]) => sum + (g.budget > 0 ? g.spent / g.budget : 0), 0) / budgetGroups.length) * 100,
      )
    : null

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-ink-500">Ready for your next adventure?</p>
        </div>
        <Link to="/trips/create">
          <Button size="lg">
            <Plus className="h-4 w-4" /> Create Trip
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Trips planned" value={stats?.trips ?? 0} icon={<Compass className="h-5 w-5" />} tone="brand" />
        <StatCard label="Destinations" value={stats?.destinations ?? 0} icon={<MapPin className="h-5 w-5" />} tone="sunset" />
        <StatCard label="Countries" value={stats?.countries ?? 0} icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
        <StatCard
          label="Budget used"
          value={overallPercentUsed != null ? `${overallPercentUsed}%` : '—'}
          icon={<Wallet className="h-5 w-5" />}
          tone="sky"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Upcoming trips</h2>
          <Link to="/trips" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {tripsLoading ? (
          <CardSkeletonGrid count={3} />
        ) : trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trips.slice(0, 3).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={setDeleteTarget}
                onDuplicate={(id) => duplicateTrip.mutate(id)}
                onShare={setShareTarget}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Compass className="h-7 w-7" />}
            title="No upcoming trips yet"
            description="Your next adventure starts here. Create a trip to begin planning."
            action={
              <Link to="/trips/create">
                <Button>
                  <Plus className="h-4 w-4" /> Create Your First Trip
                </Button>
              </Link>
            }
          />
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Budget overview</h2>
          {budgetGroups.length > 0 ? (
            <div className="space-y-5">
              {budgetGroups.map(([groupCurrency, g]) => (
                <div key={groupCurrency} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-ink-900">{formatCurrency(g.budget, groupCurrency)}</span>
                    <span className="text-sm text-ink-500">
                      total in {groupCurrency} across {(allTrips ?? []).filter((t) => t.currency === groupCurrency).length} trip
                      {(allTrips ?? []).filter((t) => t.currency === groupCurrency).length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${g.budget > 0 ? Math.min((g.spent / g.budget) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-500">Spent: <strong className="text-ink-900">{formatCurrency(g.spent, groupCurrency)}</strong></span>
                    <span className="text-ink-500">Remaining: <strong className="text-ink-900">{formatCurrency(g.budget - g.spent, groupCurrency)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">Create a trip and set a budget to see your overview here.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <Sparkles className="h-4 w-4 text-brand-600" /> Quick actions
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => setAiOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-left text-sm font-medium text-brand-800 hover:bg-brand-100"
            >
              <Sparkles className="h-4 w-4" /> Plan a budget-friendly trip with AI
            </button>
            <Link to="/trips/create" className="block rounded-xl border border-ink-100 px-4 py-3 text-sm font-medium text-ink-700 hover:border-brand-200 hover:bg-brand-50">
              Plan a new trip
            </Link>
            <Link to="/explore" className="block rounded-xl border border-ink-100 px-4 py-3 text-sm font-medium text-ink-700 hover:border-brand-200 hover:bg-brand-50">
              Discover destinations
            </Link>
            <Link to="/trips" className="block rounded-xl border border-ink-100 px-4 py-3 text-sm font-medium text-ink-700 hover:border-brand-200 hover:bg-brand-50">
              Manage your trips
            </Link>
          </div>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Recommended for you</h2>
          <Link to="/explore" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Explore more →
          </Link>
        </div>
        {recsLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(recommendations ?? []).map((rec) => (
              <DestinationCard key={rec.destination.id} destination={rec.destination} reasons={rec.reasons} />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTrip.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
        title="Delete this trip?"
        description="This will permanently delete the trip, including its itinerary and budget records."
        confirmLabel="Delete trip"
        isLoading={deleteTrip.isPending}
      />

      <ShareTripModal
        trip={shareTarget}
        onClose={() => setShareTarget(null)}
        onShare={(id) => shareTrip.mutate({ tripId: id, share: true })}
        onUnshare={(id) => shareTrip.mutate({ tripId: id, share: false })}
        isLoading={shareTrip.isPending}
      />

      <AIItineraryModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        prefill={{ destination: '', duration_days: 5, budget: 1500, currency: budgetGroups[0]?.[0] ?? 'USD' }}
        onUse={(result: AIItineraryResponse) => {
          setAiOpen(false)
          navigate('/trips/create', { state: { aiPlan: result } })
        }}
      />
    </div>
  )
}
