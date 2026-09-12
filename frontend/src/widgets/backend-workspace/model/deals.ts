import { computed, shallowRef } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { usePlatformData } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiDeal } from '@/shared/api/backend-contracts'

export function useDealsWorkspace() {
  const session = useSessionStore()
  const queryClient = useQueryClient()
  const data = usePlatformData(
    () => session.user,
    () => session.audience,
  )
  const selectedSessionId = shallowRef<number | null>(null)
  const discount = shallowRef(0)
  const eligibleSessions = computed(() =>
    data.visibleSessions.value.filter(
      (item) => item.id_user !== null && item.id_apartment !== null && item.status !== 'close',
    ),
  )
  const selectedSession = computed(
    () => eligibleSessions.value.find((item) => item.id === selectedSessionId.value) ?? null,
  )
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ['backend', session.audience, session.user?.id ?? 0, 'deals'],
    })
  const create = useMutation({
    mutationFn: () => {
      const source = selectedSession.value
      if (!source?.id_user || !source.id_apartment) {
        throw new Error('Выберите обращение с клиентом и квартирой')
      }
      return backendApi.createDeal({
        id_user: source.id_user,
        id_apartment: source.id_apartment,
        id_chat_session: source.id,
        percent_discount: discount.value,
      })
    },
    onSuccess: () => {
      selectedSessionId.value = null
      discount.value = 0
      void invalidate()
    },
  })
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApiDeal['status'] }) =>
      backendApi.updateDeal(id, status),
    onSuccess: invalidate,
  })
  const allowedTransitions = (deal: ApiDeal): ApiDeal['status'][] => {
    if (deal.status === 'pending') return ['contract', 'cancelled']
    if (deal.status === 'contract') return ['completed', 'cancelled']
    return []
  }

  return {
    session,
    ...data,
    eligibleSessions,
    selectedSessionId,
    discount,
    create,
    update,
    allowedTransitions,
  }
}
