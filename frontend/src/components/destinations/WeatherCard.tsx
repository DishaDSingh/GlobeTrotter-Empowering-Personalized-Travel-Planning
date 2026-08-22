import { Cloud, CloudRain, Sun, Wind } from 'lucide-react'
import { useDestinationWeather } from '@/hooks/useDestinations'
import { Skeleton } from '@/components/ui/Skeleton'

function weatherIcon(condition: string | null) {
  if (!condition) return Cloud
  const c = condition.toLowerCase()
  if (c.includes('rain') || c.includes('drizzle') || c.includes('thunder')) return CloudRain
  if (c.includes('clear') || c.includes('mainly clear')) return Sun
  return Cloud
}

export function WeatherCard({ destinationId, city }: { destinationId: string; city: string }) {
  const { data, isLoading } = useDestinationWeather(destinationId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }

  if (!data || !data.available) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-4 text-sm text-ink-400">
        <Wind className="h-5 w-5" />
        Weather unavailable for {city} right now.
      </div>
    )
  }

  const Icon = weatherIcon(data.condition)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-400/10 text-sky-500">
        <Icon className="h-5.5 w-5.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-900">
          {data.temperature_c != null ? `${Math.round(data.temperature_c)}°C` : '—'} · {data.condition ?? 'Unknown'}
        </p>
        <p className="text-xs text-ink-400">
          {city}
          {data.precipitation_probability != null && ` · Rain ${data.precipitation_probability}%`}
        </p>
      </div>
    </div>
  )
}
