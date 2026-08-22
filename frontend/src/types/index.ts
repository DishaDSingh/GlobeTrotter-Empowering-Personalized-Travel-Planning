export type TripVisibility = 'private' | 'public'
export type TripStatus = 'draft' | 'planned' | 'completed'
export type ActivityCategory =
  | 'Attraction'
  | 'Museum'
  | 'Food'
  | 'Adventure'
  | 'Nature'
  | 'Shopping'
  | 'Entertainment'
  | 'Culture'
  | 'Religious'
  | 'Nightlife'
export type BudgetCategory = 'Transportation' | 'Accommodation' | 'Activities' | 'Food' | 'Shopping' | 'Other'

export interface User {
  id: string
  name: string
  email: string
  avatar_url: string | null
  language: string
  role: 'user' | 'admin'
  created_at: string
}

export interface UserPreferences {
  travel_style: string | null
  interests: string[]
  preferred_currency: string
  default_visibility: string
  notifications_email: boolean
  notifications_push: boolean
}

export interface Destination {
  id: string
  city: string
  country: string
  country_code: string
  latitude: number
  longitude: number
  description: string | null
  image_url: string | null
  population: number | null
  popularity_score: number
  estimated_daily_cost: number
  currency: string
  created_at: string
}

export interface Activity {
  id: string
  destination_id: string
  name: string
  description: string | null
  category: ActivityCategory
  image_url: string | null
  latitude: number
  longitude: number
  price: number
  currency: string
  duration_minutes: number
  rating: number
  opening_time: string | null
  closing_time: string | null
  created_at: string
}

export interface TripStop {
  id: string
  trip_id: string
  destination_id: string
  arrival_date: string | null
  departure_date: string | null
  sequence: number
  notes: string | null
  planned_budget: number | null
  destination?: Destination
}

export interface Trip {
  id: string
  user_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  cover_image: string | null
  visibility: TripVisibility
  status: TripStatus
  share_id: string | null
  budget_total: number
  currency: string
  created_at: string
  updated_at: string
}

export interface TripListItem extends Trip {
  destination_count: number
  spent: number
}

export interface TripDetail extends Trip {
  stops: TripStop[]
  destination_count: number
  spent: number
  remaining: number
}

export interface ItineraryActivity {
  id: string
  trip_id: string
  trip_stop_id: string
  activity_id: string
  date: string | null
  start_time: string | null
  end_time: string | null
  notes: string | null
  custom_cost: number | null
  sequence: number
  activity?: Activity
}

export interface CalendarDay {
  date: string
  items: ItineraryActivity[]
  total_cost: number
}

export interface BudgetRecord {
  id: string
  trip_id: string
  category: BudgetCategory
  amount: number
  currency: string
  description: string | null
  date: string | null
  created_at: string
}

export interface BudgetSummary {
  total_budget: number
  spent: number
  remaining: number
  average_daily_cost: number
  percent_used: number
  by_category: { category: string; amount: number }[]
  over_budget_by: number
  records: BudgetRecord[]
}

export interface WeatherData {
  temperature_c: number | null
  condition: string | null
  precipitation_probability: number | null
  wind_kph: number | null
  available: boolean
  message: string | null
}

export interface RecommendationItem {
  destination: Destination
  score: number
  reasons: string[]
}

export interface SeasonalRecommendations {
  season: string
  month: string
  destinations: RecommendationItem[]
}

export interface SavedDestination {
  id: string
  destination_id: string
  created_at: string
  destination?: Destination
}

export interface AIItineraryRequestPayload {
  destination: string
  duration_days: number
  budget: number
  travelers: number
  style: string
  interests: string[]
  starting_location?: string
  currency: string
}

export interface AIItineraryDayActivity {
  time: string
  name: string
  category: string
  duration_minutes: number
  estimated_cost: number
  notes: string | null
}

export interface AIItineraryDay {
  day: number
  city: string
  date_label: string | null
  activities: AIItineraryDayActivity[]
  estimated_day_cost: number
}

export interface AIItineraryResponse {
  destination: string
  duration_days: number
  total_estimated_cost: number
  currency: string
  days: AIItineraryDay[]
  source: string
  notes: string | null
}

export interface AIBudgetSuggestion {
  title: string
  description: string
  estimated_savings: number
  category: string
  target_id: string | null
  target_type: string | null
}

export interface AIBudgetOptimizeResponse {
  total_budget: number
  projected_spend: number
  over_by: number
  suggestions: AIBudgetSuggestion[]
}

export interface SharedTripView {
  trip: Trip
  owner_name: string
  stops: TripStop[]
  itinerary: ItineraryActivity[]
  budget_summary: { total_budget: number; spent: number }
}

export interface AdminStats {
  total_users: number
  total_trips: number
  active_users: number
  public_trips: number
  popular_cities: { city: string; trips: number }[]
  popular_activities: { name: string; rating: number }[]
  user_growth: { month: string; count: number }[]
  trips_created: { month: string; count: number }[]
}

export interface ApiError {
  detail: string
}
