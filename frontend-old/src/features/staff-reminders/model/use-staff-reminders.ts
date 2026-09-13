import { computed, shallowRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { backendApi } from '@/shared/api/backend-api'

export function useStaffReminders() {
  const session = useSessionStore()
  const queryClient = useQueryClient()
  const key = computed(() => ['backend', 'staff-reminders', session.user?.id ?? 0] as const)
  const reminders = useQuery({ queryKey: key, queryFn: backendApi.reminders })
  const employees = useQuery(
    computed(() => ({
      queryKey: ['backend', 'staff-reminder-employees'],
      queryFn: async () => (await backendApi.users()).filter((item) => item.role !== 'user'),
      enabled: session.user?.role === 'supervisor',
    })),
  )
  const title = shallowRef('')
  const dueAt = shallowRef('')
  const assignedTo = shallowRef(session.user?.id ?? 0)
  const create = useMutation({
    mutationFn: () => backendApi.createReminder({ assigned_to: assignedTo.value, title: title.value.trim(), due_at: new Date(dueAt.value).toISOString() }),
    onSuccess: () => { title.value = ''; dueAt.value = ''; void queryClient.invalidateQueries({ queryKey: key.value }) },
  })
  const complete = useMutation({ mutationFn: backendApi.completeReminder, onSuccess: () => queryClient.invalidateQueries({ queryKey: key.value }) })
  const open = computed(() => (reminders.data.value ?? []).filter((item) => !item.completed_at))
  return { session, reminders, employees, title, dueAt, assignedTo, create, complete, open }
}
