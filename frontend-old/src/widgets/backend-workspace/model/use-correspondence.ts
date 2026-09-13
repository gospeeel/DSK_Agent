import { computed, shallowRef, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { useDocumentVisible, usePlatformData } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'

export function useCorrespondence() {
  const session = useSessionStore()
  const data = usePlatformData(
    () => session.user,
    () => session.audience,
  )
  const queryClient = useQueryClient()
  const selectedId = shallowRef<number | null>(null)
  const text = shallowRef('')
  const reason = shallowRef('')
  const visible = useDocumentVisible()
  const selected = computed(() =>
    data.visibleSessions.value.find((item) => item.id === selectedId.value),
  )
  const canWrite = computed(
    () =>
      !!selected.value &&
      selected.value.status !== 'close' &&
      (session.user?.role === 'user' ||
        selected.value.id_employee === session.user?.id ||
        session.user?.role === 'supervisor'),
  )
  watch(
    () => data.visibleSessions.value,
    (items) => {
      if (!items.some((item) => item.id === selectedId.value))
        selectedId.value = items[0]?.id ?? null
    },
    { immediate: true },
  )
  const messages = useQuery(
    computed(() => ({
      queryKey: [...data.scope.value, 'messages', selected.value?.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        backendApi.messages(session.audience, selected.value!.id, signal),
      enabled: !!selected.value,
      refetchInterval: visible.value ? 5000 : false,
    })),
  )
  const send = useMutation({
    mutationFn: async () => {
      if (!canWrite.value || !selected.value || !text.value.trim())
        throw new Error('Выберите открытое обращение и введите сообщение')
      return backendApi.sendMessage(session.audience, selected.value.id, text.value.trim())
    },
    onSuccess: async () => {
      text.value = ''
      await queryClient.invalidateQueries({ queryKey: [...data.scope.value, 'messages'] })
    },
  })
  const action = useMutation({
    mutationFn: (kind: 'take' | 'close' | 'reject') => {
      if (!selected.value || !session.isStaff) throw new Error('Обращение недоступно')
      if (kind === 'take' ? selected.value.id_employee !== null : !canWrite.value)
        throw new Error('Недостаточно прав')
      if (kind === 'reject' && !reason.value.trim()) throw new Error('Укажите причину отказа')
      return backendApi.sessionAction(selected.value.id, kind, reason.value.trim())
    },
    onSuccess: async () => {
      reason.value = ''
      await queryClient.invalidateQueries({ queryKey: [...data.scope.value, 'sessions'] })
    },
  })
  watch(selectedId, () => {
    text.value = ''
    reason.value = ''
    send.reset()
    action.reset()
  })
  return { session, ...data, selectedId, selected, text, reason, messages, canWrite, send, action }
}
