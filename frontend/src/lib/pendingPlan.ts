import type { AIItineraryResponse, TripGuidePrefill } from '@/types'

const AI_PLAN_KEY = 'globetrotter_pending_ai_plan'
const TRIP_GUIDE_KEY = 'globetrotter_pending_trip_guide'

function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore storage errors (e.g. private browsing) */
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function clear(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function savePendingPlan(plan: AIItineraryResponse) {
  save(AI_PLAN_KEY, plan)
}

export function getPendingPlan(): AIItineraryResponse | null {
  return read<AIItineraryResponse>(AI_PLAN_KEY)
}

export function clearPendingPlan() {
  clear(AI_PLAN_KEY)
}

export function savePendingTripGuide(tripGuide: TripGuidePrefill) {
  save(TRIP_GUIDE_KEY, tripGuide)
}

export function getPendingTripGuide(): TripGuidePrefill | null {
  return read<TripGuidePrefill>(TRIP_GUIDE_KEY)
}

export function clearPendingTripGuide() {
  clear(TRIP_GUIDE_KEY)
}

/** Used right after login/signup to resume whichever pre-auth planning flow
 * (AI budget plan or trip guide) the user started before being sent to
 * authenticate. Consumes (clears) whichever one it finds. */
export function consumePendingCreateTripRedirect(): { pathname: string; state: object } | null {
  const tripGuide = getPendingTripGuide()
  if (tripGuide) {
    clearPendingTripGuide()
    return { pathname: '/trips/create', state: { tripGuide } }
  }
  const aiPlan = getPendingPlan()
  if (aiPlan) {
    clearPendingPlan()
    return { pathname: '/trips/create', state: { aiPlan } }
  }
  return null
}
