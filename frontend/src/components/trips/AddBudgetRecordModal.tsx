import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useAddBudgetRecord, useUpdateBudgetRecord } from '@/hooks/useBudget'
import type { BudgetCategory, BudgetRecord } from '@/types'

const CATEGORIES: BudgetCategory[] = ['Transportation', 'Accommodation', 'Activities', 'Food', 'Shopping', 'Other']

interface AddBudgetRecordModalProps {
  open: boolean
  onClose: () => void
  tripId: string
  currency: string
  editingRecord?: BudgetRecord | null
}

export function AddBudgetRecordModal({ open, onClose, tripId, currency, editingRecord }: AddBudgetRecordModalProps) {
  const [category, setCategory] = useState<BudgetCategory>('Other')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')

  const addRecord = useAddBudgetRecord(tripId)
  const updateRecord = useUpdateBudgetRecord(tripId)

  useEffect(() => {
    if (open) {
      setCategory(editingRecord?.category ?? 'Other')
      setAmount(editingRecord ? String(editingRecord.amount) : '')
      setDescription(editingRecord?.description ?? '')
      setDate(editingRecord?.date ?? '')
    }
  }, [open, editingRecord])

  const handleSubmit = () => {
    const payload = { category, amount: Number(amount) || 0, currency, description: description || undefined, date: date || undefined }
    if (editingRecord) {
      updateRecord.mutate({ id: editingRecord.id, ...payload }, { onSuccess: onClose })
    } else {
      addRecord.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editingRecord ? 'Edit expense' : 'Add expense'} size="sm">
      <div className="space-y-4">
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input label={`Amount (${currency})`} type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" />
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button className="w-full" onClick={handleSubmit} isLoading={addRecord.isPending || updateRecord.isPending} disabled={!amount}>
          {editingRecord ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </Modal>
  )
}
