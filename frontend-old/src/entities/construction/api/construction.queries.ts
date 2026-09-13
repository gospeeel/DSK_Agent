import { queryOptions } from '@tanstack/vue-query'

import { salesApi } from '@/shared/api'

export const constructionKeys = {
  events: ['construction', 'events'] as const,
  objects: ['construction', 'objects'] as const,
}

export const constructionQueries = {
  events: () =>
    queryOptions({
      queryKey: constructionKeys.events,
      queryFn: () => salesApi.getConstructionEvents(),
    }),
  objects: () =>
    queryOptions({
      queryKey: constructionKeys.objects,
      queryFn: () => salesApi.getConstructionObjects(),
    }),
}
