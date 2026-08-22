import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, friendlyErrorMessage } from '@/lib/api'
import type { SavedDestination, User, UserPreferences } from '@/types'

export function useUserStats() {
  return useQuery({
    queryKey: ['users', 'me', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ trips: number; countries: number; destinations: number }>('/users/me/stats')
      return data
    },
  })
}

export function useUserPreferences() {
  return useQuery({
    queryKey: ['users', 'me', 'preferences'],
    queryFn: async () => {
      const { data } = await api.get<UserPreferences>('/users/me/preferences')
      return data
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<UserPreferences>) => {
      const { data } = await api.put<UserPreferences>('/users/me/preferences', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'preferences'] })
      toast.success('Preferences saved.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string; avatar_url?: string; language?: string }) => {
      const { data } = await api.put<User>('/users/me', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      toast.success('Profile updated.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const { data } = await api.put('/users/me/password', payload)
      return data
    },
    onSuccess: () => toast.success('Password updated.'),
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't update your password.")),
  })
}

export function useSavedDestinations(enabled = true) {
  return useQuery({
    queryKey: ['users', 'me', 'saved-destinations'],
    queryFn: async () => {
      const { data } = await api.get<SavedDestination[]>('/users/me/saved-destinations')
      return data
    },
    enabled,
  })
}

export function useToggleSavedDestination() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ destinationId, save }: { destinationId: string; save: boolean }) => {
      if (save) await api.post(`/users/me/saved-destinations/${destinationId}`)
      else await api.delete(`/users/me/saved-destinations/${destinationId}`)
    },
    onSuccess: (_, { save }) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'saved-destinations'] })
      toast.success(save ? 'Saved to your list.' : 'Removed from your list.')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await api.delete('/users/me')
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  })
}
