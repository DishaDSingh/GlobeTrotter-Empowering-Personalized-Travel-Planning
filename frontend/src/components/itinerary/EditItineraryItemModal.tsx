import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { useUpdateItineraryActivity } from '@/hooks/useItinerary'
import type { ItineraryActivity } from '@/types'

interface EditItineraryItemModalProps {
  open: boolean
  onClose: () => void
  item: ItineraryActivity
  tripId: string
  stopOptions: { id: string; label: string }[]
}

export function EditItineraryItemModal({ open, onClose, item, tripId, stopOptions }: EditItineraryItemModalProps) {
  const update = useUpdateItineraryActivity(tripId)
  const [date, setDate] = useState(item.date ?? '')
  const [startTime, setStartTime] = useState(item.start_time ?? '')
  const [endTime, setEndTime] = useState(item.end_time ?? '')
  const [customCost, setCustomCost] = useState<string>(item.custom_cost != null ? String(item.custom_cost) : '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [stopId, setStopId] = useState(item.trip_stop_id)

  useEffect(() => {
    if (open) {
      setDate(item.date ?? '')
      setStartTime(item.start_time ?? '')
      setEndTime(item.end_time ?? '')
      setCustomCost(item.custom_cost != null ? String(item.custom_cost) : '')
      setNotes(item.notes ?? '')
      setStopId(item.trip_stop_id)
    }
  }, [open, item])

  const handleSave = () => {
    update.mutate(
      {
        id: item.id,
        date: date || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        custom_cost: customCost ? Number(customCost) : undefined,
        notes: notes || undefined,
        trip_stop_id: stopId !== item.trip_stop_id ? stopId : undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={item.activity?.name ?? 'Edit activity'} size="sm">
      <div className="space-y-4">
        <Select label="Destination / stop" value={stopId} onChange={(e) => setStopId(e.target.value)}>
          {stopOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <Input label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <Input label="Custom cost" type="number" min={0} placeholder="Leave blank to use default price" value={customCost} onChange={(e) => setCustomCost(e.target.value)} />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for this activity..." />
        <Button className="w-full" onClick={handleSave} isLoading={update.isPending}>
          Save changes
        </Button>
      </div>
    </Modal>
  )
}
