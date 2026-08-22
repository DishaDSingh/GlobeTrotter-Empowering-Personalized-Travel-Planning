import { useState } from 'react'
import { Check, Copy, Globe2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Trip, TripListItem } from '@/types'

interface ShareTripModalProps {
  trip: Trip | TripListItem | null
  onClose: () => void
  onShare: (tripId: string) => void
  onUnshare: (tripId: string) => void
  isLoading?: boolean
}

export function ShareTripModal({ trip, onClose, onShare, onUnshare, isLoading }: ShareTripModalProps) {
  const [copied, setCopied] = useState(false)

  if (!trip) return null

  const shareUrl = trip.share_id ? `${window.location.origin}/trip/share/${trip.share_id}` : null
  const isPublic = trip.visibility === 'public'

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={!!trip} onClose={onClose} title="Share this trip" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900">{isPublic ? 'Public' : 'Private'}</p>
            <p className="text-xs text-ink-500">
              {isPublic ? 'Anyone with the link can view this trip.' : 'Only you can see this trip.'}
            </p>
          </div>
          <Button
            size="sm"
            variant={isPublic ? 'outline' : 'primary'}
            onClick={() => (isPublic ? onUnshare(trip.id) : onShare(trip.id))}
            isLoading={isLoading}
          >
            {isPublic ? 'Make private' : 'Make public'}
          </Button>
        </div>

        {isPublic && shareUrl && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-800">Shareable link</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 truncate rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
