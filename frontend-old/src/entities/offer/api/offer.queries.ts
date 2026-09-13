import { queryOptions } from '@tanstack/vue-query'

import { salesApi } from '@/shared/api'

export const offerKeys = { all: ['offers'] as const }
export const offerQueries = {
  list: () => queryOptions({ queryKey: offerKeys.all, queryFn: () => salesApi.getOffers() }),
}
