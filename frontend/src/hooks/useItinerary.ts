import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, friendlyErrorMessage } from '@/lib/api'
import type { CalendarDay, ItineraryActivity } from '@/types'

export function useItineraryActivities(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', tripId, 'activities'],
    queryFn: async () => {
      const { data } = await api.get<ItineraryActivity[]>(`/trips/${tripId}/activities`)
      return data
    },
    enabled: !!tripId,
  })
}

export function useCalendar(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', tripId, 'calendar'],
    queryFn: async () => {
      const { data } = await api.get<CalendarDay[]>(`/trips/${tripId}/calendar`)
      return data
    },
    enabled: !!tripId,
  })
}

export interface AddItineraryActivityPayload {
  trip_stop_id: string
  activity_id: string
  date?: string
  start_time?: string
  end_time?: string
  notes?: string
  custom_cost?: number
}

function invalidateTripData(queryClient: ReturnType<typeof useQueryClient>, tripId: string) {
  queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'activities'] })
  queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'calendar'] })
  queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'budget'] })
}

export function useAddItineraryActivity(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AddItineraryActivityPayload) => {
      const { data } = await api.post<ItineraryActivity>(`/trips/${tripId}/activities`, payload)
      return data
    },
    onSuccess: () => {
      invalidateTripData(queryClient, tripId)
      toast.success('Activity added to itinerary.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't add this activity.")),
  })
}

export function useUpdateItineraryActivity(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<AddItineraryActivityPayload> & { sequence?: number }) => {
      const { data } = await api.put<ItineraryActivity>(`/trips/${tripId}/activities/${id}`, payload)
      return data
    },
    onSuccess: () => invalidateTripData(queryClient, tripId),
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useReorderItineraryActivities(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: string; sequence: number; date?: string; trip_stop_id?: string; start_time?: string }[]) => {
      const { data } = await api.put<ItineraryActivity[]>(`/trips/${tripId}/activities/reorder`, { items })
      return data
    },
    onSuccess: () => invalidateTripData(queryClient, tripId),
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useDuplicateItineraryActivity(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ItineraryActivity>(`/trips/${tripId}/activities/${id}/duplicate`)
      return data
    },
    onSuccess: () => {
      invalidateTripData(queryClient, tripId)
      toast.success('Activity duplicated.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useDeleteItineraryActivity(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/trips/${tripId}/activities/${id}`)
    },
    onSuccess: () => {
      invalidateTripData(queryClient, tripId)
      toast.success('Activity removed.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}
