import { useMemo, useState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { SearchBar } from '@/components/ui/SearchBar'
import { Input } from '@/components/ui/Input'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { useActivities, useActivitySearch } from '@/hooks/useActivities'
import { useAddItineraryActivity } from '@/hooks/useItinerary'
import { debounce } from '@/lib/utils'
import type { TripStop } from '@/types'

interface AddActivityDrawerProps {
  open: boolean
  onClose: () => void
  tripId: string
  stop: TripStop | null
  defaultDate?: string
}

export function AddActivityDrawer({ open, onClose, tripId, stop, defaultDate }: AddActivityDrawerProps) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [date, setDate] = useState(defaultDate ?? '')
  const [time, setTime] = useState('09:00')
  const updateDebounced = useMemo(() => debounce((v: string) => setDebounced(v), 300), [])

  const browse = useActivities({ destination_id: stop?.destination_id })
  const search = useActivitySearch(debounced, { destination_id: stop?.destination_id })
  const activities = debounced ? search.data : browse.data
  const isLoading = debounced ? search.isLoading : browse.isLoading

  const addActivity = useAddItineraryActivity(tripId)

  if (!stop) return null

  return (
    <Drawer open={open} onClose={onClose} title={`Add activity in ${stop.destination?.city ?? ''}`} side="right">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Start time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v)
            updateDebounced(v)
          }}
          placeholder="Search activities..."
        />
        <div className="space-y-2.5">
          {isLoading && <p className="text-sm text-ink-400">Loading…</p>}
          {activities?.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              compact
              disabled={addActivity.isPending}
              onAdd={() =>
                addActivity.mutate(
                  { trip_stop_id: stop.id, activity_id: activity.id, date: date || undefined, start_time: time || undefined },
                  { onSuccess: onClose },
                )
              }
            />
          ))}
          {activities?.length === 0 && !isLoading && <p className="text-sm text-ink-400">No activities found.</p>}
        </div>
      </div>
    </Drawer>
  )
}
