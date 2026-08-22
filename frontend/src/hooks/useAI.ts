import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, friendlyErrorMessage } from '@/lib/api'
import type { AIBudgetOptimizeResponse, AIItineraryRequestPayload, AIItineraryResponse } from '@/types'

export function useGenerateAIItinerary() {
  return useMutation({
    mutationFn: async (payload: AIItineraryRequestPayload) => {
      const { data } = await api.post<AIItineraryResponse>('/ai/generate-itinerary', payload)
      return data
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't generate an itinerary right now.")),
  })
}

export function useAcceptAIItinerary(tripId: string) {
  return useMutation({
    mutationFn: async (itinerary: AIItineraryResponse) => {
      const { data } = await api.post(`/ai/generate-itinerary/${tripId}/accept`, itinerary)
      return data
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't add this itinerary to your trip.")),
  })
}

export function useOptimizeBudget() {
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { data } = await api.post<AIBudgetOptimizeResponse>('/ai/optimize-budget', { trip_id: tripId })
      return data
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't analyze this trip's budget.")),
  })
}
