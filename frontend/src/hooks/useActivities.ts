import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Activity, ActivityCategory } from '@/types'

export interface ActivityFilters {
  destination_id?: string
  category?: ActivityCategory
  max_price?: number
}

export function useActivities(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: async () => {
      const { data } = await api.get<Activity[]>('/activities', { params: filters })
      return data
    },
    enabled: !!filters.destination_id,
  })
}

export function useActivitySearch(query: string, filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ['activities', 'search', query, filters],
    queryFn: async () => {
      const { data } = await api.get<Activity[]>('/activities/search', { params: { q: query, ...filters } })
      return data
    },
    enabled: query.trim().length > 0,
  })
}
