import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, Bell, Globe2, Lock, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/context/AuthContext'
import { useUpdateProfile, useUserPreferences, useUpdatePreferences, useChangePassword, useDeleteAccount } from '@/hooks/useUser'
import { friendlyErrorMessage } from '@/lib/api'

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        <p className="text-xs text-ink-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-ink-200'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function Settings() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const { data: preferences } = useUserPreferences()
  const updateProfile = useUpdateProfile()
  const updatePreferences = useUpdatePreferences()
  const changePassword = useChangePassword()
  const deleteAccount = useDeleteAccount()

  const [language, setLanguage] = useState(user?.language ?? 'en')
  const [defaultVisibility, setDefaultVisibility] = useState(preferences?.default_visibility ?? 'private')
  const [notifEmail, setNotifEmail] = useState(preferences?.notifications_email ?? true)
  const [notifPush, setNotifPush] = useState(preferences?.notifications_push ?? true)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (preferences) {
      setDefaultVisibility(preferences.default_visibility)
      setNotifEmail(preferences.notifications_email)
      setNotifPush(preferences.notifications_push)
    }
  }, [preferences])

  const handleSaveGeneral = async () => {
    const updated = await updateProfile.mutateAsync({ language })
    setUser(updated)
  }

  const handleSavePreferences = () => {
    updatePreferences.mutate({ default_visibility: defaultVisibility, notifications_email: notifEmail, notifications_push: notifPush })
  }

  const handleChangePassword = async () => {
    try {
      await changePassword.mutateAsync({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      /* toast handled in hook */
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync()
      toast.success('Your account has been deleted.')
      logout()
      navigate('/')
    } catch (error) {
      toast.error(friendlyErrorMessage(error))
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-ink-500">Manage your account, preferences, and privacy.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-ink-900">
          <Globe2 className="h-4 w-4 text-brand-600" /> General
        </h2>
        <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} className="max-w-xs">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="hi">हिन्दी</option>
          <option value="ja">日本語</option>
        </Select>
        <Button className="mt-4" onClick={handleSaveGeneral} isLoading={updateProfile.isPending}>
          Save
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-ink-900">
          <Bell className="h-4 w-4 text-brand-600" /> Notifications
        </h2>
        <div className="divide-y divide-ink-100">
          <Toggle checked={notifEmail} onChange={setNotifEmail} label="Email notifications" description="Trip reminders and updates via email." />
          <Toggle checked={notifPush} onChange={setNotifPush} label="Push notifications" description="Real-time alerts in the app." />
        </div>

        <h2 className="mb-2 mt-6 flex items-center gap-2 font-display text-base font-semibold text-ink-900">
          <Shield className="h-4 w-4 text-brand-600" /> Privacy
        </h2>
        <Select label="Default visibility for new trips" value={defaultVisibility} onChange={(e) => setDefaultVisibility(e.target.value)} className="max-w-xs">
          <option value="private">Private</option>
          <option value="public">Public</option>
        </Select>

        <Button className="mt-4" onClick={handleSavePreferences} isLoading={updatePreferences.isPending}>
          Save preferences
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-ink-900">
          <Lock className="h-4 w-4 text-brand-600" /> Change password
        </h2>
        <div className="space-y-4">
          <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="At least 6 characters" />
        </div>
        <Button className="mt-4" onClick={handleChangePassword} isLoading={changePassword.isPending} disabled={!currentPassword || newPassword.length < 6}>
          Update password
        </Button>
      </Card>

      <Card className="border-danger-500/20 p-6">
        <h2 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-danger-600">
          <AlertTriangle className="h-4 w-4" /> Delete account
        </h2>
        <p className="mb-4 text-sm text-ink-500">This permanently deletes your account, trips, and all associated data. This can't be undone.</p>
        <Button variant="danger" onClick={() => setDeleteConfirmOpen(true)}>
          Delete my account
        </Button>
      </Card>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This permanently deletes your account and all trips. This action cannot be undone."
        confirmLabel="Delete account"
        isLoading={deleteAccount.isPending}
      />
    </div>
  )
}
