import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Plus } from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TripCard } from '@/components/trips/TripCard'
import { ShareTripModal } from '@/components/trips/ShareTripModal'
import { useTrips, useDeleteTrip, useDuplicateTrip, useShareTrip, type TripFilters } from '@/hooks/useTrips'
import { debounce } from '@/lib/utils'
import { useMemo } from 'react'
import type { TripListItem } from '@/types'

const FILTER_TABS: { value: TripFilters['filter']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'draft', label: 'Drafts' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

export default function MyTrips() {
  const [filter, setFilter] = useState<TripFilters['filter']>('all')
  const [sort, setSort] = useState<TripFilters['sort']>('recent')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const updateDebounced = useMemo(() => debounce((v: string) => setDebouncedSearch(v), 300), [])

  const { data: trips, isLoading } = useTrips({ filter, sort, search: debouncedSearch || undefined })
  const deleteTrip = useDeleteTrip()
  const duplicateTrip = useDuplicateTrip()
  const shareTrip = useShareTrip()

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [shareTarget, setShareTarget] = useState<TripListItem | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">My Trips</h1>
          <p className="mt-1 text-ink-500">All your travel plans, in one place.</p>
        </div>
        <Link to="/trips/create">
          <Button>
            <Plus className="h-4 w-4" /> Create Trip
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-100 hover:bg-ink-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v)
              updateDebounced(v)
            }}
            placeholder="Search trips..."
            className="w-full sm:w-64"
          />
          <Select value={sort} onChange={(e) => setSort(e.target.value as TripFilters['sort'])} className="w-40">
            <option value="recent">Recently updated</option>
            <option value="name">Name</option>
            <option value="start_date">Start date</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={6} />
      ) : trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
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
          title={search ? 'No trips match your search' : 'No trips yet'}
          description={search ? 'Try a different search term.' : 'Your next adventure starts here.'}
          action={
            !search && (
              <Link to="/trips/create">
                <Button>
                  <Plus className="h-4 w-4" /> Create Your First Trip
                </Button>
              </Link>
            )
          }
        />
      )}

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
    </div>
  )
}
