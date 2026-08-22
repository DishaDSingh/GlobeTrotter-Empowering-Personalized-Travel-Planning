import { NavLink, useNavigate } from 'react-router-dom'
import { Compass, LayoutDashboard, Map, Plus, User as UserIcon } from 'lucide-react'

const LINKS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/explore', label: 'Explore', icon: Compass },
]

const LINKS_RIGHT = [
  { to: '/trips', label: 'Trips', icon: Map },
  { to: '/profile', label: 'Profile', icon: UserIcon },
]

export function MobileNav() {
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
      isActive ? 'text-brand-600' : 'text-ink-400'
    }`

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      {LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className={linkClass}>
          <link.icon className="h-5 w-5" />
          {link.label}
        </NavLink>
      ))}

      <div className="flex flex-1 justify-center">
        <button
          onClick={() => navigate('/trips/create')}
          aria-label="Create trip"
          className="-translate-y-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[var(--shadow-lift)] active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {LINKS_RIGHT.map((link) => (
        <NavLink key={link.to} to={link.to} className={linkClass}>
          <link.icon className="h-5 w-5" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
