import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { heroImage } from '@/lib/images'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2 font-display text-xl font-bold text-ink-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
              <Compass className="h-5 w-5" />
            </span>
            GlobeTrotter
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <img src={heroImage(1400)} alt="Scenic travel destination" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-display text-3xl font-bold leading-tight text-balance">Plan smarter. Travel better.</p>
          <p className="mt-3 max-w-md text-white/80">
            Join thousands of travelers building unforgettable multi-city itineraries with GlobeTrotter.
          </p>
        </div>
      </div>
    </div>
  )
}
