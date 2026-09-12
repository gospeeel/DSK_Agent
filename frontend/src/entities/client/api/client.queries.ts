import { queryOptions } from '@tanstack/vue-query'

import { salesApi } from '@/shared/api'

export const clientKeys = {
  all: ['clients'] as const,
  detail: (id: string) => ['clients', id] as const,
}

export const clientQueries = {
  list: () => queryOptions({ queryKey: clientKeys.all, queryFn: () => salesApi.getClients() }),
  detail: (id: string) =>
    queryOptions({ queryKey: clientKeys.detail(id), queryFn: () => salesApi.getClient(id) }),
}
