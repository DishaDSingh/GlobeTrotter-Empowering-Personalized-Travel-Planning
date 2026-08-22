import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CurrencyRatesResponse } from '@/types'

export const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY'] as const

export function useCurrencyRates(base: string, enabled = true) {
  return useQuery({
    queryKey: ['currency', 'rates', base],
    queryFn: async () => {
      const { data } = await api.get<CurrencyRatesResponse>('/currency/rates', { params: { base } })
      return data
    },
    enabled: enabled && !!base,
    staleTime: 60 * 60 * 1000,
    retry: false,
  })
}

export function convertAmount(amount: number, rates: Record<string, number> | undefined, to: string): number | null {
  if (!rates) return null
  const rate = rates[to.toUpperCase()]
  if (rate == null) return null
  return amount * rate
}
