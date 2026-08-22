import { useMemo, useState } from 'react'
import { Compass, SlidersHorizontal } from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { FilterPanel } from '@/components/destinations/FilterPanel'
import { DestinationDetailDrawer } from '@/components/destinations/DestinationDetailDrawer'
import { useDestinations, useDestinationSearch, type DestinationFilters } from '@/hooks/useDestinations'
import { useAuth } from '@/context/AuthContext'
import { useSavedDestinations, useToggleSavedDestination } from '@/hooks/useUser'
import { debounce } from '@/lib/utils'
import type { Destination } from '@/types'

export default function Explore() {
  const { isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFilters] = useState<DestinationFilters>({ sort: 'popularity' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<Destination | null>(null)

  const updateDebounced = useMemo(() => debounce((v: string) => setDebouncedQuery(v), 300), [])

  const searchResult = useDestinationSearch(debouncedQuery)
  const browseResult = useDestinations(filters)

  const isSearching = debouncedQuery.trim().length > 0
  const destinations = isSearching ? searchResult.data : browseResult.data
  const isLoading = isSearching ? searchResult.isLoading : browseResult.isLoading

  const { data: saved } = useSavedDestinations(isAuthenticated)
  const toggleSaved = useToggleSavedDestination()
  const savedIds = new Set((saved ?? []).map((s) => s.destination_id))

  const handleToggleSave = (destination: Destination) => {
    if (!isAuthenticated) return
    toggleSaved.mutate({ destinationId: destination.id, save: !savedIds.has(destination.id) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Explore destinations</h1>
        <p className="mt-1 text-ink-500">Search cities, filter by budget, and find your next trip idea.</p>
      </div>

      <div className="flex gap-3">
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v)
            updateDebounced(v)
          }}
          placeholder="Search cities or countries..."
          className="flex-1"
        />
        <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-ink-100 bg-white p-5">
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters({ sort: 'popularity' })} />
          </div>
        </aside>

        <div>
          {isLoading ? (
            <CardSkeletonGrid count={9} />
          ) : destinations && destinations.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  onOpen={setSelected}
                  saved={savedIds.has(destination.id)}
                  onToggleSave={isAuthenticated ? handleToggleSave : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Compass className="h-7 w-7" />}
              title="No destinations found"
              description="Try a different search term or adjust your filters."
            />
          )}
        </div>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="bottom">
        <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters({ sort: 'popularity' })} />
        <Button className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>
          Show results
        </Button>
      </Drawer>

      <DestinationDetailDrawer
        destination={selected}
        onClose={() => setSelected(null)}
        saved={selected ? savedIds.has(selected.id) : false}
        onToggleSave={isAuthenticated ? handleToggleSave : undefined}
      />
    </div>
  )
}
