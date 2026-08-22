import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Destination,
  NearbyDestination,
  NearbyPlacesResponse,
  NearbyPlaceType,
  RecommendationItem,
  SeasonalRecommendations,
  TripGuideResponse,
  WeatherData,
} from '@/types'

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

const EXPLORE_PAGE_SIZE = 24

export function useDestinationsInfinite(filters: DestinationFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['destinations', 'infinite', filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<Destination[]>('/destinations', {
        params: { ...filters, page: pageParam, page_size: EXPLORE_PAGE_SIZE },
      })
      return { items: data, page: pageParam }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.items.length === EXPLORE_PAGE_SIZE ? lastPage.page + 1 : undefined),
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

export function useTripGuide(destinationId: string | undefined, totalDays: number, travelers = 1) {
  return useQuery({
    queryKey: ['destinations', destinationId, 'trip-guide', totalDays, travelers],
    queryFn: async () => {
      const { data } = await api.get<TripGuideResponse>(`/destinations/${destinationId}/trip-guide`, {
        params: { total_days: totalDays, travelers },
      })
      return data
    },
    enabled: !!destinationId && totalDays > 0,
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

export function useNearbyDestinations(destinationId: string | undefined, limit = 6) {
  return useQuery({
    queryKey: ['destinations', destinationId, 'nearby-destinations', limit],
    queryFn: async () => {
      const { data } = await api.get<NearbyDestination[]>(`/destinations/${destinationId}/nearby-destinations`, {
        params: { limit },
      })
      return data
    },
    enabled: !!destinationId,
    staleTime: 60 * 60 * 1000,
  })
}

export function useNearbyPlaces(destinationId: string | undefined, type: NearbyPlaceType) {
  return useQuery({
    queryKey: ['destinations', destinationId, 'nearby-places', type],
    queryFn: async () => {
      const { data } = await api.get<NearbyPlacesResponse>(`/destinations/${destinationId}/nearby-places`, {
        params: { type, radius_km: 5, limit: 12 },
      })
      return data
    },
    enabled: !!destinationId,
    staleTime: 30 * 60 * 1000,
    retry: false,
  })
}
