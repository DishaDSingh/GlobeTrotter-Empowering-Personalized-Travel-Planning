import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, friendlyErrorMessage } from '@/lib/api'
import type { BudgetCategory, BudgetRecord, BudgetSummary } from '@/types'

export function useBudget(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', tripId, 'budget'],
    queryFn: async () => {
      const { data } = await api.get<BudgetSummary>(`/trips/${tripId}/budget`)
      return data
    },
    enabled: !!tripId,
  })
}

export interface BudgetRecordPayload {
  category: BudgetCategory
  amount: number
  currency?: string
  description?: string
  date?: string
}

export function useAddBudgetRecord(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: BudgetRecordPayload) => {
      const { data } = await api.post<BudgetRecord>(`/trips/${tripId}/budget`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'budget'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Expense added.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't add this expense.")),
  })
}

export function useUpdateBudgetRecord(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<BudgetRecordPayload>) => {
      const { data } = await api.put<BudgetRecord>(`/trips/${tripId}/budget/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'budget'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useDeleteBudgetRecord(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/trips/${tripId}/budget/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'budget'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('Expense removed.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}
