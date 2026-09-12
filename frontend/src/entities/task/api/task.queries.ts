import { queryOptions } from '@tanstack/vue-query'

import { salesApi } from '@/shared/api'

export const taskKeys = { all: ['tasks'] as const }
export const taskQueries = {
  list: () => queryOptions({ queryKey: taskKeys.all, queryFn: () => salesApi.getTasks() }),
}
