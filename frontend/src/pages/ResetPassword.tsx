import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, friendlyErrorMessage } from '@/lib/api'

const schema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    new_password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })
type FormValues = z.infer<typeof schema>

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: params.get('token') ?? '' },
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', { token: values.token, new_password: values.new_password })
      toast.success('Password updated. Please log in.')
      navigate('/login')
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'This reset link is invalid or has expired.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Reset token" error={errors.token?.message} {...register('token')} />
        <Input
          label="New password"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.new_password?.message}
          {...register('new_password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
        <Button type="submit" className="w-full" isLoading={submitting}>
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  )
}
