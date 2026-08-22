import { Link } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Compass,
  DollarSign,
  Leaf,
  Map,
  MapPin,
  Menu,
  Share2,
  Sparkles,
  Star,
  Sun,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { BudgetTripPlanner } from '@/components/trips/BudgetTripPlanner'
import { useDestinations, useSeasonalDestinations } from '@/hooks/useDestinations'
import { cityImage, heroImage } from '@/lib/images'
import { formatCurrency } from '@/lib/utils'

const FEATURES = [
  {
    icon: Map,
    title: 'Multi-city itinerary builder',
    description: 'Drag and drop cities and activities into a day-by-day plan that adapts as you go.',
  },
  {
    icon: DollarSign,
    title: 'Smart budget tracking',
    description: 'Track spending by category and get alerts before you go over budget.',
  },
  {
    icon: MapPin,
    title: 'Interactive maps',
    description: 'See every destination and activity plotted on a live map, route included.',
  },
  {
    icon: Wand2,
    title: 'AI trip generation',
    description: 'Describe your dream trip and budget and get a structured itinerary in seconds — you approve every change.',
  },
  {
    icon: Calendar,
    title: 'Calendar & timeline views',
    description: 'Flip between a calendar grid and a vertical timeline to plan the way you think.',
  },
  {
    icon: Share2,
    title: 'Share & remix trips',
    description: 'Publish trips publicly and let other travelers copy your itinerary as a starting point.',
  },
]

const STEPS = [
  { title: 'Create a trip', description: 'Name your trip and pick your travel dates to get started.' },
  { title: 'Add destinations & activities', description: 'Search cities and attractions, then drop them into your plan.' },
  { title: 'Build your itinerary', description: 'Arrange everything day-by-day on a map, calendar, or timeline.' },
  { title: 'Share your journey', description: 'Publish your trip publicly or keep it private — your call.' },
]

const TESTIMONIALS = [
  {
    name: 'Meera S.',
    role: 'Solo traveler, 14 countries',
    quote:
      "GlobeTrotter turned a chaotic spreadsheet habit into an actual plan. I built my whole Southeast Asia loop in an afternoon.",
  },
  {
    name: 'Daniel O.',
    role: 'Family trip planner',
    quote:
      'The budget alerts saved our Europe trip. We caught an overspend on activities before it became a problem.',
  },
  {
    name: 'Farah K.',
    role: 'Weekend-getaway enthusiast',
    quote:
      "I copied a public itinerary someone shared for Jaipur and customized it in minutes. So much easier than starting from scratch.",
  },
]

const SEASON_ICON: Record<string, typeof Sun> = { Winter: Sun, Spring: Leaf, Summer: Sun, Autumn: Leaf }

function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className={`flex items-center gap-2 font-display text-lg font-bold ${scrolled ? 'text-ink-900' : 'text-white'}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
            <Compass className="h-5 w-5" />
          </span>
          GlobeTrotter
        </Link>

        <nav className={`hidden items-center gap-8 text-sm font-medium md:flex ${scrolled ? 'text-ink-700' : 'text-white/90'}`}>
          <a href="#planner" className="transition-opacity hover:opacity-70">Budget Planner</a>
          <a href="#seasonal" className="transition-opacity hover:opacity-70">This Season</a>
          <Link to="/explore" className="transition-opacity hover:opacity-70">Explore</Link>
          <a href="#stories" className="transition-opacity hover:opacity-70">Stories</a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className={`text-sm font-medium ${scrolled ? 'text-ink-700' : 'text-white'}`}>
            Log in
          </Link>
          <Button size="sm" className="bg-sunset-500 hover:bg-sunset-600" onClick={() => (window.location.href = '/signup')}>
            Start planning
          </Button>
        </div>

        <button
          className={`md:hidden ${scrolled ? 'text-ink-900' : 'text-white'}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-100 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-ink-700">
            <a href="#planner" onClick={() => setMobileOpen(false)}>Budget Planner</a>
            <a href="#seasonal" onClick={() => setMobileOpen(false)}>This Season</a>
            <Link to="/explore" onClick={() => setMobileOpen(false)}>Explore</Link>
            <div className="mt-2 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => (window.location.href = '/login')}>
                Log in
              </Button>
              <Button className="flex-1 bg-sunset-500 hover:bg-sunset-600" onClick={() => (window.location.href = '/signup')}>
                Sign up
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-2 text-brand-600 ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </p>
  )
}

function FadeInSection({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function Landing() {
  const { data: destinations, isLoading } = useDestinations({ sort: 'popularity' })
  const { data: seasonal, isLoading: seasonalLoading } = useSeasonalDestinations(4)
  const featured = (destinations ?? []).slice(0, 6)
  const SeasonIcon = seasonal ? SEASON_ICON[seasonal.season] ?? Sun : Sun

  return (
    <div className="bg-warm-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <img src={heroImage(1800)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/30" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-24 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-city planning, minus the spreadsheet
            </span>
            <h1 className="text-balance font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Plan smarter.
              <br />
              Travel better.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/85">
              Create personalized multi-city itineraries, discover amazing destinations, organize activities,
              manage your budget, and share your journey — all in one place.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button size="lg" className="bg-sunset-500 hover:bg-sunset-600" onClick={() => (window.location.href = '/signup')}>
                Start Planning
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15" onClick={() => (window.location.href = '/explore')}>
                Explore Destinations
              </Button>
            </div>

            <div className="mt-14 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6 text-white/90">
              <div>
                <p className="font-display text-2xl font-bold">120+</p>
                <p className="eyebrow text-white/50">Cities</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">4.9 ★</p>
                <p className="eyebrow text-white/50">Planner rating</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">18k</p>
                <p className="eyebrow text-white/50">Itineraries built</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Budget-first AI planner */}
      <section id="planner" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <FadeInSection>
          <div className="mb-10 max-w-2xl">
            <Eyebrow>Budget-friendly by default</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              Tell us your budget. We'll build the plan.
            </h2>
            <p className="mt-3 text-ink-500">
              Every itinerary is fit to what you actually want to spend — day by day, activity by activity — so you
              never have to guess whether a trip is affordable before you book it.
            </p>
          </div>
        </FadeInSection>
        <FadeInSection delay={0.1}>
          <BudgetTripPlanner />
        </FadeInSection>
      </section>

      {/* Seasonal picks */}
      <section id="seasonal" className="bg-ink-900 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeInSection>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow className="text-brand-400">Right now</Eyebrow>
                <h2 className="mt-2 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
                  <SeasonIcon className="h-8 w-8 text-sunset-400" />
                  Best places to visit this {seasonal?.season ?? 'season'}
                </h2>
                <p className="mt-2 max-w-xl text-white/60">
                  Ranked by real seasonal travel patterns for {seasonal?.month ?? 'this month'} — not just popularity.
                </p>
              </div>
              <Link to="/explore" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
                Explore all destinations →
              </Link>
            </div>
          </FadeInSection>

          {seasonalLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(seasonal?.destinations ?? []).map((rec, i) => (
                <FadeInSection key={rec.destination.id} delay={i * 0.05}>
                  <Link to="/explore" className="editorial-card group block overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={rec.destination.image_url || cityImage(rec.destination.city)}
                        alt={rec.destination.city}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <p className="font-display text-lg font-bold">{rec.destination.city}</p>
                        <p className="text-xs text-white/70">{rec.destination.country}</p>
                      </div>
                    </div>
                    <p className="p-4 text-xs text-white/60">{rec.reasons[0]}</p>
                  </Link>
                </FadeInSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular destinations */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <FadeInSection>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <Eyebrow>Discover</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink-900 sm:text-4xl">Popular destinations</h2>
            </div>
            <Link to="/explore" className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block">
              View all →
            </Link>
          </div>
        </FadeInSection>

        {isLoading ? (
          <CardSkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((dest, i) => (
              <FadeInSection key={dest.id} delay={i * 0.05}>
                <Link
                  to="/explore"
                  className="editorial-card group block overflow-hidden rounded-2xl border border-ink-100 bg-white"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={dest.image_url || cityImage(dest.city)}
                      alt={dest.city}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 text-white">
                      <p className="font-display text-lg font-bold">{dest.city}</p>
                      <p className="text-sm text-white/80">{dest.country}</p>
                    </div>
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-800">
                      <Star className="h-3 w-3 fill-sunset-500 text-sunset-500" />
                      {(dest.popularity_score / 20).toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <p className="text-sm text-ink-500">From {formatCurrency(dest.estimated_daily_cost, dest.currency)}/day</p>
                    <span className="text-sm font-semibold text-brand-600">Plan a trip →</span>
                  </div>
                </Link>
              </FadeInSection>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section id="features" className="bg-ink-950 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeInSection>
            <Eyebrow className="text-brand-400">Everything in one place</Eyebrow>
            <h2 className="mt-2 max-w-xl text-balance font-display text-3xl font-bold text-white sm:text-4xl">
              Built for the way real trips come together
            </h2>
          </FadeInSection>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{feature.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <FadeInSection>
          <div className="flex justify-center"><Eyebrow>How it works</Eyebrow></div>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            From idea to itinerary in four steps
          </h2>
        </FadeInSection>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <FadeInSection key={step.title} delay={i * 0.08}>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 font-display text-lg font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="font-display text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{step.description}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="stories" className="bg-warm-100 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeInSection>
            <div className="flex justify-center"><Eyebrow>Traveler stories</Eyebrow></div>
            <h2 className="mt-2 text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              Loved by explorers everywhere
            </h2>
          </FadeInSection>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <FadeInSection key={t.name} delay={i * 0.08}>
                <div className="editorial-card flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6">
                  <div className="mb-3 flex gap-0.5 text-sunset-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm text-ink-600">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                      <p className="text-xs text-ink-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-brand-700 py-20">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sunset-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Users className="mx-auto mb-5 h-10 w-10 text-white/80" />
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready for your next adventure?</h2>
          <p className="mt-3 text-white/80">
            Join GlobeTrotter today and turn your travel ideas into a real, shareable itinerary.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-sunset-500 hover:bg-sunset-600" onClick={() => (window.location.href = '/signup')}>
              Start Planning — it's free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-950 py-12 text-white/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
                  <Compass className="h-4 w-4" />
                </span>
                GlobeTrotter
              </div>
              <p className="mt-3 max-w-xs text-sm">Plan smarter. Travel better.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <div>
                <p className="mb-3 font-semibold text-white">Product</p>
                <ul className="space-y-2">
                  <li><Link to="/explore" className="hover:text-white">Explore</Link></li>
                  <li><Link to="/signup" className="hover:text-white">Sign up</Link></li>
                  <li><a href="#planner" className="hover:text-white">Budget Planner</a></li>
                </ul>
              </div>
              <div>
                <p className="mb-3 font-semibold text-white">Company</p>
                <ul className="space-y-2">
                  <li><a href="#how-it-works" className="hover:text-white">How it works</a></li>
                  <li><a href="#stories" className="hover:text-white">Stories</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-xs">
            © {new Date().getFullYear()} GlobeTrotter. Built for explorers.
          </div>
        </div>
      </footer>
    </div>
  )
}
