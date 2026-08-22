import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Globe2, MapPin, ShieldCheck, Star, Users } from 'lucide-react'
import { useAdminStats } from '@/hooks/useAdmin'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function Admin() {
  const { data, isLoading, isError } = useAdminStats()

  if (isLoading) return <PageLoader />
  if (isError || !data) {
    return <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="Couldn't load admin data" description="Please try again shortly." />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Admin dashboard</h1>
        <p className="mt-1 text-ink-500">Platform-wide activity and engagement.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={data.total_users} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Total trips" value={data.total_trips} icon={<MapPin className="h-5 w-5" />} tone="sunset" />
        <StatCard label="Active users (30d)" value={data.active_users} icon={<ShieldCheck className="h-5 w-5" />} tone="emerald" />
        <StatCard label="Public trips" value={data.public_trips} icon={<Globe2 className="h-5 w-5" />} tone="sky" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">User growth</h3>
          {data.user_growth.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.user_growth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4ecf0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0d8f86" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-ink-400">Not enough data yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">Trips created</h3>
          {data.trips_created.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.trips_created}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4ecf0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-ink-400">Not enough data yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">Popular cities</h3>
          <div className="space-y-2.5">
            {data.popular_cities.map((c, i) => (
              <div key={c.city} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">{i + 1}</span>
                  {c.city}
                </span>
                <span className="text-sm font-medium text-ink-500">{c.trips} trips</span>
              </div>
            ))}
            {data.popular_cities.length === 0 && <p className="text-sm text-ink-400">No trip data yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold text-ink-900">Top-rated activities</h3>
          <div className="space-y-2.5">
            {data.popular_activities.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <span className="truncate text-ink-700">{a.name}</span>
                <span className="flex items-center gap-1 font-medium text-ink-500">
                  <Star className="h-3.5 w-3.5 fill-sunset-500 text-sunset-500" /> {a.rating.toFixed(1)}
                </span>
              </div>
            ))}
            {data.popular_activities.length === 0 && <p className="text-sm text-ink-400">No activity data yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
