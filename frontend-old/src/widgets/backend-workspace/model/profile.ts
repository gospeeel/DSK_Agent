import { reactive, watch } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { backendApi } from '@/shared/api/backend-api'

export function useProfile() {
  const session = useSessionStore()
  const form = reactive({ name: '', email: '' })
  const query = useQuery({
    queryKey: ['backend', 'user', session.user?.id, 'profile'],
    queryFn: backendApi.me,
  })
  watch(
    () => query.data.value,
    (user) => {
      if (user) {
        form.name = user.name
        form.email = user.email
      }
    },
    { immediate: true },
  )
  const update = useMutation({
    mutationFn: () => backendApi.updateMe({ name: form.name.trim(), email: form.email.trim() }),
    onSuccess: async (user) => {
      session.user = user
      await query.refetch()
    },
  })

  return { form, query, update }
}
