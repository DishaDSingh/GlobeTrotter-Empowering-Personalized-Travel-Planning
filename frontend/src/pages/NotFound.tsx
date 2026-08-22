import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-50 px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Lost your way?</h1>
      <p className="mt-2 max-w-sm text-ink-500">We couldn't find the page you're looking for. Let's get you back on track.</p>
      <Link to="/">
        <Button className="mt-6">Back to home</Button>
      </Link>
    </div>
  )
}
