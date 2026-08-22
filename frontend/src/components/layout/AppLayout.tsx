import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Navbar } from './Navbar'
import { MobileNav } from './MobileNav'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

function MobilePublicHeader() {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
      <Link to="/" className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
          <Compass className="h-4 w-4" />
        </span>
        GlobeTrotter
      </Link>
      <Button size="sm" onClick={() => navigate('/login')}>
        Log in
      </Button>
    </header>
  )
}

export function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      {!user && <MobilePublicHeader />}
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12">
        <Outlet />
      </main>
      {user && <MobileNav />}
    </div>
  )
}
