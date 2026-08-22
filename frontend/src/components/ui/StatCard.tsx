import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: 'brand' | 'sunset' | 'emerald' | 'sky'
  className?: string
}

const TONE_CLASSES = {
  brand: 'bg-brand-50 text-brand-700',
  sunset: 'bg-sunset-100 text-sunset-700',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  sky: 'bg-sky-400/10 text-sky-500',
}

export function StatCard({ label, value, icon, tone = 'brand', className }: StatCardProps) {
  return (
    <Card className={cn('flex items-center gap-4 p-5', className)}>
      {icon && <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', TONE_CLASSES[tone])}>{icon}</div>}
      <div>
        <p className="text-2xl font-bold text-ink-900 font-display">{value}</p>
        <p className="text-sm text-ink-500">{label}</p>
      </div>
    </Card>
  )
}
