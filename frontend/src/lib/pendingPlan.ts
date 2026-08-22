import type { AIItineraryResponse } from '@/types'

const KEY = 'globetrotter_pending_ai_plan'

export function savePendingPlan(plan: AIItineraryResponse) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(plan))
  } catch {
    /* ignore storage errors (e.g. private browsing) */
  }
}

export function getPendingPlan(): AIItineraryResponse | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AIItineraryResponse) : null
  } catch {
    return null
  }
}

export function clearPendingPlan() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
