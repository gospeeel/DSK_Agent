import { computed, shallowRef, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { usePlatformData } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'

export function useAiAssistant() {
  const session = useSessionStore()
  const { scope, sessions, visibleSessions, visibleDeals } = usePlatformData(
    () => session.user,
    () => session.audience,
  )
  const selectedId = shallowRef<number | null>(null)
  const selectedDealId = shallowRef<number | null>(null)
  const question = shallowRef('')
  const selectedText = shallowRef('')
  const copied = shallowRef(false)
  const queryClient = useQueryClient()
  const selected = computed(() => visibleSessions.value.find((s) => s.id === selectedId.value))
  const ask = useMutation({
    mutationFn: async () => {
      if (session.isStaff) throw new Error('Внутренняя помощь менеджеру пока не подключена')
      if (!selected.value || !question.value.trim())
        throw new Error('Выберите обращение и введите вопрос')
      const deal = visibleDeals.value.find((d) => d.id_chat_session === selected.value?.id)
      return backendApi.ai(session.audience, {
        message: question.value.trim(),
        session_id: selected.value.id,
        ...(deal ? { deal_id: deal.id } : {}),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...scope.value, 'messages'] }),
  })
  const analyze = useMutation({
    mutationFn: () => {
      if (!selectedDealId.value) throw new Error('Выберите сделку')
      return backendApi.analyzeDialog(selectedDealId.value)
    },
  })
  const reply = useMutation({
    mutationFn: () => {
      if (!selectedDealId.value) throw new Error('Выберите сделку')
      return backendApi.assistReply(selectedDealId.value, selectedText.value.trim() || undefined)
    },
  })
  const copySuggestedReply = async () => {
    if (!reply.data.value?.suggested_reply) return
    await navigator.clipboard.writeText(reply.data.value.suggested_reply)
    copied.value = true
  }
  watch(selectedId, () => {
    ask.reset()
    question.value = ''
  })

  watch(selectedDealId, () => {
    analyze.reset()
    reply.reset()
    selectedText.value = ''
    copied.value = false
  })

  return {
    session,
    sessions,
    visibleSessions,
    visibleDeals,
    selectedId,
    selectedDealId,
    question,
    selectedText,
    selected,
    ask,
    analyze,
    reply,
    copied,
    copySuggestedReply,
  }
}
