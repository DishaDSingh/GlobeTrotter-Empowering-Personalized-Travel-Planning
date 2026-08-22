import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, friendlyErrorMessage } from '@/lib/api'
import type { SharedTripView, Trip } from '@/types'

export function useSharedTrip(shareId: string | undefined) {
  return useQuery({
    queryKey: ['shared', shareId],
    queryFn: async () => {
      const { data } = await api.get<SharedTripView>(`/shared/${shareId}`)
      return data
    },
    enabled: !!shareId,
    retry: false,
  })
}

export function useCopySharedTrip() {
  return useMutation({
    mutationFn: async (shareId: string) => {
      const { data } = await api.post<Trip>(`/shared/${shareId}/copy`)
      return data
    },
    onSuccess: () => toast.success('Trip copied to your account!'),
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't copy this trip.")),
  })
}
