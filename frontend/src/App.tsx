import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute, AdminRoute } from '@/components/layout/ProtectedRoute'
import { PageLoader } from '@/components/ui/Spinner'

const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Explore = lazy(() => import('@/pages/Explore'))
const TripGuide = lazy(() => import('@/pages/TripGuide'))
const MyTrips = lazy(() => import('@/pages/MyTrips'))
const CreateTrip = lazy(() => import('@/pages/CreateTrip'))
const TripDetails = lazy(() => import('@/pages/TripDetails'))
const SharedTrip = lazy(() => import('@/pages/SharedTrip'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const Admin = lazy(() => import('@/pages/Admin'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/trip/share/:shareId" element={<SharedTrip />} />

        <Route element={<AppLayout />}>
          <Route path="/explore" element={<Explore />} />
          <Route path="/trip-guide" element={<TripGuide />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trips" element={<MyTrips />} />
            <Route path="/trips/create" element={<CreateTrip />} />
            <Route path="/trips/:tripId" element={<TripDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
