import { computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { useDocumentVisible } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'

export function useNotifications() {
  const session = useSessionStore()
  const queryClient = useQueryClient()
  const documentVisible = useDocumentVisible()
  const queryKey = computed(
    () => ['backend', 'user', session.user?.id ?? 0, 'notifications'] as const,
  )
  const notifications = useQuery(
    computed(() => ({
      queryKey: queryKey.value,
      queryFn: () => backendApi.notifications(),
      enabled: session.user?.role === 'user',
      refetchInterval: documentVisible.value ? 30_000 : false,
    })),
  )
  const unreadCount = computed(
    () => notifications.data.value?.filter((item) => !item.is_read).length ?? 0,
  )
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKey.value })
  const markRead = useMutation({ mutationFn: backendApi.markNotificationRead, onSuccess: refresh })
  const markAllRead = useMutation({
    mutationFn: backendApi.markAllNotificationsRead,
    onSuccess: refresh,
  })
  return { notifications, unreadCount, markRead, markAllRead }
}
