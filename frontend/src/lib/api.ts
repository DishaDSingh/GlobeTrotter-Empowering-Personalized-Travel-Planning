import axios, { type AxiosError } from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

const TOKEN_KEY = 'globetrotter_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function friendlyErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const err = error as AxiosError<{ detail?: string }>
  if (err?.response?.data?.detail) return err.response.data.detail
  if (err?.code === 'ERR_NETWORK') return "We couldn't reach the server. Please check your connection and try again."
  return fallback
}

export function isUnauthorized(error: unknown): boolean {
  const err = error as AxiosError
  return err?.response?.status === 401
}
