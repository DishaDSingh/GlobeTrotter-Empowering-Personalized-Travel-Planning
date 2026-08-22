import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, friendlyErrorMessage } from '@/lib/api'

const schema = z.object({ email: z.string().min(1, 'Email is required').email('Enter a valid email') })
type FormValues = z.infer<typeof schema>

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/forgot-password', values)
      setSent(true)
      // No email provider is configured for this project (see README), so the
      // dev flow surfaces the reset link directly instead of sending an email.
      if (data?.dev_reset_token) {
        toast.info('No email service is configured — continuing with a dev reset link.')
        setTimeout(() => navigate(`/reset-password?token=${data.dev_reset_token}`), 1200)
      }
    } catch (error) {
      toast.error(friendlyErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll help you reset it.">
      {sent ? (
        <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
          If an account with that email exists, password reset instructions have been generated.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" className="w-full" isLoading={submitting}>
            Send reset instructions
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-500">
        Remembered your password?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
