import { queryOptions } from '@tanstack/vue-query'

import { salesApi } from '@/shared/api'

export const apartmentKeys = {
  catalog: ['apartments', 'catalog'] as const,
}

export const apartmentQueries = {
  catalog: () =>
    queryOptions({
      queryKey: apartmentKeys.catalog,
      queryFn: () => salesApi.getApartmentCatalog(),
      staleTime: 5 * 60 * 1000,
    }),
}
