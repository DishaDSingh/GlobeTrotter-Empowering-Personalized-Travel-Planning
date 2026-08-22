import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PackingListResponse } from '@/types'

export function usePackingList(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', tripId, 'packing-list'],
    queryFn: async () => {
      const { data } = await api.get<PackingListResponse>(`/trips/${tripId}/packing-list`)
      return data
    },
    enabled: !!tripId,
  })
}
