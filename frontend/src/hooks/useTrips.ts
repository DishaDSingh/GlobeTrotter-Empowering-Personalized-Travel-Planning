import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, friendlyErrorMessage } from '@/lib/api'
import type { Trip, TripDetail, TripListItem, TripStop } from '@/types'

export interface TripFilters {
  filter?: 'all' | 'upcoming' | 'past' | 'draft' | 'public' | 'private'
  search?: string
  sort?: 'recent' | 'name' | 'start_date'
}

export function useTrips(filters: TripFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['trips', filters],
    queryFn: async () => {
      const { data } = await api.get<TripListItem[]>('/trips', { params: filters })
      return data
    },
    enabled,
  })
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      const { data } = await api.get<TripDetail>(`/trips/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export interface TripCreatePayload {
  name: string
  description?: string
  start_date?: string
  end_date?: string
  cover_image?: string
  visibility?: 'private' | 'public'
  status?: 'draft' | 'planned' | 'completed'
  budget_total?: number
  currency?: string
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TripCreatePayload) => {
      const { data } = await api.post<Trip>('/trips', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Trip created!')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't create your trip.")),
  })
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<TripCreatePayload>) => {
      const { data } = await api.put<Trip>(`/trips/${tripId}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't update your trip.")),
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tripId: string) => {
      await api.delete(`/trips/${tripId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Trip deleted.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't delete this trip.")),
  })
}

export function useDuplicateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { data } = await api.post<Trip>(`/trips/${tripId}/duplicate`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Trip duplicated.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't duplicate this trip.")),
  })
}

export function useShareTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ tripId, share }: { tripId: string; share: boolean }) => {
      const { data } = share
        ? await api.post<Trip>(`/trips/${tripId}/share`)
        : await api.delete<Trip>(`/trips/${tripId}/share`)
      return data
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useAddStop(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { destination_id: string; arrival_date?: string; departure_date?: string }) => {
      const { data } = await api.post<TripStop>(`/trips/${tripId}/stops`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      toast.success('Destination added to trip.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't add this destination.")),
  })
}

export function useUpdateStop(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      stopId,
      ...payload
    }: {
      stopId: string
      arrival_date?: string
      departure_date?: string
      notes?: string
      planned_budget?: number | null
    }) => {
      const { data } = await api.put<TripStop>(`/trips/${tripId}/stops/${stopId}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useReorderStops(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (stops: { id: string; sequence: number }[]) => {
      const { data } = await api.put<TripStop[]>(`/trips/${tripId}/stops/reorder`, { stops })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useDeleteStop(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (stopId: string) => {
      await api.delete(`/trips/${tripId}/stops/${stopId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'activities'] })
      toast.success('Destination removed from trip.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}
