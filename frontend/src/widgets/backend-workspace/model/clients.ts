import { computed, shallowRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { usePlatformData } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'

export function useClients() {
  const session = useSessionStore()
  const data = usePlatformData(
    () => session.user,
    () => session.audience,
  )
  const search = shallowRef('')
  const ids = computed(() =>
    [
      ...new Set(
        [
          ...data.visibleSessions.value
            .filter((s) => s.id_employee === session.user?.id)
            .map((s) => s.id_user),
          ...data.visibleDeals.value.map((d) => d.id_user),
        ].filter((id): id is number => id !== null),
      ),
    ].sort((a, b) => a - b),
  )
  const users = useQuery(
    computed(() => ({
      queryKey: [...data.scope.value, 'clients', ids.value],
      enabled: session.isStaff && data.sessions.isSuccess.value && data.deals.isSuccess.value,
      queryFn: async () =>
        session.user?.role === 'supervisor'
          ? (await backendApi.users()).filter((u) => u.role === 'user')
          : Promise.all(ids.value.map((id) => backendApi.user(id))),
    })),
  )
  const filtered = computed(() =>
    (users.data.value ?? []).filter((u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(search.value.toLowerCase()),
    ),
  )
  const pending = computed(
    () => data.sessions.isPending.value || data.deals.isPending.value || users.isPending.value,
  )
  const error = computed(
    () => data.sessions.error.value || data.deals.error.value || users.error.value,
  )
  const retry = () => {
    void data.sessions.refetch()
    void data.deals.refetch()
    void users.refetch()
  }

  return { search, filtered, pending, error, retry }
}
