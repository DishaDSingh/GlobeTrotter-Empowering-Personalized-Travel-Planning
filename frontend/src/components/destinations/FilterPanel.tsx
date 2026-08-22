import { Select, Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { DestinationFilters } from '@/hooks/useDestinations'

interface FilterPanelProps {
  filters: DestinationFilters
  onChange: (filters: DestinationFilters) => void
  onReset: () => void
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  return (
    <div className="space-y-5">
      <Input
        label="Country"
        placeholder="e.g. France, India"
        value={filters.country ?? ''}
        onChange={(e) => onChange({ ...filters, country: e.target.value || undefined })}
      />
      <Input
        label="Max daily budget (USD equiv.)"
        type="number"
        min={0}
        placeholder="e.g. 150"
        value={filters.max_daily_cost ?? ''}
        onChange={(e) => onChange({ ...filters, max_daily_cost: e.target.value ? Number(e.target.value) : undefined })}
      />
      <Select
        label="Sort by"
        value={filters.sort ?? 'popularity'}
        onChange={(e) => onChange({ ...filters, sort: e.target.value as DestinationFilters['sort'] })}
      >
        <option value="popularity">Most popular</option>
        <option value="cost">Lowest cost</option>
        <option value="name">Name (A–Z)</option>
      </Select>
      <Button variant="outline" className="w-full" onClick={onReset} type="button">
        Reset filters
      </Button>
    </div>
  )
}
