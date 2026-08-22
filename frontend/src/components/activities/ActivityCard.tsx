import { Clock, Plus, Star } from 'lucide-react'
import type { Activity } from '@/types'
import { placeholderImage } from '@/lib/images'
import { formatCurrency, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

const CATEGORY_TONE: Record<string, 'brand' | 'warning' | 'success' | 'info' | 'neutral'> = {
  Food: 'warning',
  Museum: 'info',
  Culture: 'info',
  Adventure: 'success',
  Nature: 'success',
}

interface ActivityCardProps {
  activity: Activity
  onAdd?: (activity: Activity) => void
  compact?: boolean
  disabled?: boolean
}

export function ActivityCard({ activity, onAdd, compact, disabled }: ActivityCardProps) {
  return (
    <div className={cn('flex gap-3 rounded-xl border border-ink-100 bg-white p-3 transition-shadow hover:shadow-[var(--shadow-soft)]', compact ? '' : 'sm:gap-4 sm:p-4')}>
      <img
        src={activity.image_url || placeholderImage(activity.name, 200, 200)}
        alt={activity.name}
        className={cn('shrink-0 rounded-lg object-cover', compact ? 'h-16 w-16' : 'h-20 w-20 sm:h-24 sm:w-24')}
      />
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-ink-900">{activity.name}</h4>
            <Badge tone={CATEGORY_TONE[activity.category] ?? 'neutral'}>{activity.category}</Badge>
          </div>
          {!compact && activity.description && (
            <p className="mt-1 line-clamp-2 text-xs text-ink-500">{activity.description}</p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-sunset-500 text-sunset-500" /> {activity.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {Math.round(activity.duration_minutes / 60) > 0 ? `${(activity.duration_minutes / 60).toFixed(1)}h` : `${activity.duration_minutes}m`}
            </span>
            <span className="font-medium text-ink-700">
              {activity.price > 0 ? formatCurrency(activity.price, activity.currency) : 'Free'}
            </span>
          </div>
          {onAdd && (
            <button
              onClick={() => onAdd(activity)}
              disabled={disabled}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100 disabled:opacity-50"
              aria-label={`Add ${activity.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
