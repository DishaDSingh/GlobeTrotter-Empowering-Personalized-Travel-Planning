import { useEffect, useState } from 'react'
import { Compass, Globe2, MapPin, Pencil } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useUserStats, useUserPreferences, useUpdateProfile, useUpdatePreferences, useSavedDestinations, useToggleSavedDestination } from '@/hooks/useUser'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { initials } from '@/lib/utils'

const TRAVEL_STYLES = ['Balanced', 'Adventure', 'Relaxation', 'Culture', 'Nightlife']
const INTEREST_OPTIONS = ['Museum', 'Food', 'Nature', 'Culture', 'Adventure', 'Nightlife', 'Shopping', 'Religious']

export default function Profile() {
  const { user, setUser } = useAuth()
  const { data: stats } = useUserStats()
  const { data: preferences } = useUserPreferences()
  const { data: saved } = useSavedDestinations()
  const toggleSaved = useToggleSavedDestination()
  const updateProfile = useUpdateProfile()
  const updatePreferences = useUpdatePreferences()

  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const [language, setLanguage] = useState(user?.language ?? 'en')
  const [travelStyle, setTravelStyle] = useState(preferences?.travel_style ?? 'Balanced')
  const [interests, setInterests] = useState<string[]>(preferences?.interests ?? [])

  useEffect(() => {
    if (preferences) {
      setTravelStyle(preferences.travel_style ?? 'Balanced')
      setInterests(preferences.interests)
    }
  }, [preferences])

  const handleSaveProfile = async () => {
    const updated = await updateProfile.mutateAsync({ name, avatar_url: avatarUrl || undefined, language })
    setUser(updated)
    await updatePreferences.mutateAsync({ travel_style: travelStyle, interests })
    setEditOpen(false)
  }

  const toggleInterest = (interest: string) => {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-ink-800 text-2xl font-bold text-white">
            {user?.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" /> : initials(user?.name ?? 'U')}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-ink-900">{user?.name}</h1>
            <p className="text-ink-500">{user?.email}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
              <Globe2 className="h-3 w-3" /> Language: {user?.language?.toUpperCase()}
              {preferences?.travel_style && ` · Style: ${preferences.travel_style}`}
            </p>
          </div>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit profile
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Trips" value={stats?.trips ?? 0} icon={<Compass className="h-5 w-5" />} tone="brand" />
        <StatCard label="Countries" value={stats?.countries ?? 0} icon={<Globe2 className="h-5 w-5" />} tone="sunset" />
        <StatCard label="Destinations" value={stats?.destinations ?? 0} icon={<MapPin className="h-5 w-5" />} tone="emerald" />
      </div>

      {preferences?.interests && preferences.interests.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">Travel interests</h2>
          <div className="flex flex-wrap gap-2">
            {preferences.interests.map((i) => (
              <span key={i} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">{i}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Saved destinations</h2>
        {saved && saved.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.filter((s) => s.destination).map((s) => (
              <DestinationCard
                key={s.id}
                destination={s.destination!}
                saved
                onToggleSave={(d) => toggleSaved.mutate({ destinationId: d.id, save: false })}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<MapPin className="h-7 w-7" />} title="No saved destinations yet" description="Save destinations you love while exploring to see them here." />
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile" size="md">
        <div className="space-y-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="hi">हिन्दी</option>
            <option value="ja">日本語</option>
          </Select>
          <Select label="Travel style" value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)}>
            {TRAVEL_STYLES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-800">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${interests.includes(i) ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleSaveProfile} isLoading={updateProfile.isPending || updatePreferences.isPending}>
            Save changes
          </Button>
        </div>
      </Modal>
    </div>
  )
}
