import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { CoverImagePicker } from './CoverImagePicker'
import { useUpdateTrip } from '@/hooks/useTrips'
import type { TripDetail } from '@/types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AED', 'SGD']

export function EditTripModal({ trip, open, onClose }: { trip: TripDetail; open: boolean; onClose: () => void }) {
  const update = useUpdateTrip(trip.id)
  const [name, setName] = useState(trip.name)
  const [description, setDescription] = useState(trip.description ?? '')
  const [coverImage, setCoverImage] = useState(trip.cover_image ?? '')
  const [startDate, setStartDate] = useState(trip.start_date ?? '')
  const [endDate, setEndDate] = useState(trip.end_date ?? '')
  const [budgetTotal, setBudgetTotal] = useState(String(trip.budget_total))
  const [currency, setCurrency] = useState(trip.currency)
  const [status, setStatus] = useState(trip.status)

  useEffect(() => {
    if (open) {
      setName(trip.name)
      setDescription(trip.description ?? '')
      setCoverImage(trip.cover_image ?? '')
      setStartDate(trip.start_date ?? '')
      setEndDate(trip.end_date ?? '')
      setBudgetTotal(String(trip.budget_total))
      setCurrency(trip.currency)
      setStatus(trip.status)
    }
  }, [open, trip])

  const handleSave = () => {
    update.mutate(
      {
        name,
        description: description || undefined,
        cover_image: coverImage || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        budget_total: Number(budgetTotal) || 0,
        currency,
        status,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit trip" size="md">
      <div className="space-y-4">
        <Input label="Trip name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <CoverImagePicker value={coverImage} onChange={setCoverImage} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End date" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Budget" type="number" min={0} value={budgetTotal} onChange={(e) => setBudgetTotal(e.target.value)} className="col-span-2" />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="draft">Draft</option>
          <option value="planned">Planned</option>
          <option value="completed">Completed</option>
        </Select>
        <Button className="w-full" onClick={handleSave} isLoading={update.isPending}>
          Save changes
        </Button>
      </div>
    </Modal>
  )
}
