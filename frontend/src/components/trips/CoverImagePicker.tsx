import { useRef } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUploadImage } from '@/hooks/useImageUpload'

interface CoverImagePickerProps {
  value: string
  onChange: (url: string) => void
}

export function CoverImagePicker({ value, onChange }: CoverImagePickerProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const upload = useUploadImage()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    upload.mutate(file, { onSuccess: (url) => onChange(url) })
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-800">Cover image</label>
        <div className="flex gap-2">
          <Input
            placeholder="Paste an image URL, or upload one"
            leftIcon={<ImageIcon className="h-4 w-4" />}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" isLoading={upload.isPending} onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-400">Optional — leave blank to use a default image.</p>
      </div>
      {value && (
        <img
          src={value}
          alt="Cover preview"
          className="h-40 w-full rounded-xl object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
    </div>
  )
}
