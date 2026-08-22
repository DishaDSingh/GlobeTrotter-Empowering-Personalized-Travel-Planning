import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, friendlyErrorMessage } from '@/lib/api'

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<{ url: string }>('/uploads/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.url
    },
    onError: (error) => toast.error(friendlyErrorMessage(error, "We couldn't upload that image.")),
  })
}
