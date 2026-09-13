import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { usePlatformData } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'

export function useClientDetails(clientId: () => string) {
  const session = useSessionStore()
  const data = usePlatformData(
    () => session.user,
    () => session.audience,
  )
  const allowed = computed(
    () =>
      session.user?.role === 'supervisor' ||
      data.visibleDeals.value.some((d) => d.id_user === Number(clientId())) ||
      data.visibleSessions.value.some(
        (s) => s.id_user === Number(clientId()) && s.id_employee === session.user?.id,
      ),
  )
  const client = useQuery(
    computed(() => ({
      queryKey: [...data.scope.value, 'client', clientId()],
      enabled: allowed.value,
      queryFn: () => backendApi.user(Number(clientId())),
    })),
  )

  return { allowed, client }
}
