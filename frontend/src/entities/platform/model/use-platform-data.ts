import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiAudience, ApiUser } from '@/shared/api/backend-contracts'

export function usePlatformData(identity: () => ApiUser | null, audience: () => ApiAudience) {
  const scope = computed(() => ['backend', audience(), identity()?.id ?? 0] as const)
  const sessions = useQuery(
    computed(() => ({
      queryKey: [...scope.value, 'sessions'],
      queryFn: () => backendApi.sessions(audience()),
      enabled: !!identity(),
    })),
  )
  const deals = useQuery(
    computed(() => ({
      queryKey: [...scope.value, 'deals'],
      queryFn: () => backendApi.deals(audience()),
      enabled: !!identity(),
    })),
  )
  const visibleSessions = computed(() =>
    (sessions.data.value ?? []).filter(
      (item) =>
        identity()?.role === 'supervisor' ||
        (identity()?.role === 'user'
          ? item.id_user === identity()?.id
          : item.id_employee === identity()?.id || item.id_employee === null),
    ),
  )
  const visibleDeals = computed(() =>
    (deals.data.value ?? []).filter(
      (item) =>
        identity()?.role === 'supervisor' ||
        (identity()?.role === 'user'
          ? item.id_user === identity()?.id
          : item.id_employee === identity()?.id),
    ),
  )
  return { scope, sessions, deals, visibleSessions, visibleDeals }
}

export function useDocumentVisible() {
  const visible = shallowRef(
    typeof document === 'undefined' || document.visibilityState === 'visible',
  )
  const update = () => {
    visible.value = document.visibilityState === 'visible'
  }
  onMounted(() => document.addEventListener('visibilitychange', update))
  onUnmounted(() => document.removeEventListener('visibilitychange', update))
  return visible
}
