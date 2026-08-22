import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Destination, RecommendationItem, SeasonalRecommendations, WeatherData } from '@/types'

export interface DestinationFilters {
  country?: string
  max_daily_cost?: number
  min_popularity?: number
  sort?: 'popularity' | 'cost' | 'name'
}

export function useDestinations(filters: DestinationFilters = {}) {
  return useQuery({
    queryKey: ['destinations', filters],
    queryFn: async () => {
      const { data } = await api.get<Destination[]>('/destinations', { params: filters })
      return data
    },
  })
}

export function useDestinationSearch(query: string) {
  return useQuery({
    queryKey: ['destinations', 'search', query],
    queryFn: async () => {
      const { data } = await api.get<Destination[]>('/destinations/search', { params: { q: query } })
      return data
    },
    enabled: query.trim().length > 0,
  })
}

export function useDestination(id: string | undefined) {
  return useQuery({
    queryKey: ['destinations', id],
    queryFn: async () => {
      const { data } = await api.get<Destination>(`/destinations/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useDestinationWeather(id: string | undefined) {
  return useQuery({
    queryKey: ['destinations', id, 'weather'],
    queryFn: async () => {
      const { data } = await api.get<WeatherData>(`/destinations/${id}/weather`)
      return data
    },
    enabled: !!id,
    retry: false,
    staleTime: 10 * 60 * 1000,
  })
}

export function useRecommendedDestinations(limit = 8) {
  return useQuery({
    queryKey: ['destinations', 'recommended', limit],
    queryFn: async () => {
      const { data } = await api.get<RecommendationItem[]>('/destinations/recommended', { params: { limit } })
      return data
    },
  })
}

export function useSeasonalDestinations(limit = 8) {
  return useQuery({
    queryKey: ['destinations', 'seasonal', limit],
    queryFn: async () => {
      const { data } = await api.get<SeasonalRecommendations>('/destinations/seasonal', { params: { limit } })
      return data
    },
    staleTime: 60 * 60 * 1000,
  })
}
