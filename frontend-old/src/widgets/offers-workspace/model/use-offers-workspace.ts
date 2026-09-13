import { computed, shallowRef, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { usePlatformData } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'

export function useOffersWorkspace() {
  const session = useSessionStore()
  const queryClient = useQueryClient()
  const { deals, visibleDeals } = usePlatformData(
    () => session.user,
    () => session.audience,
  )
  const offersKey = computed(
    () => ['backend', session.audience, session.user?.id ?? 0, 'offers'] as const,
  )
  const offers = useQuery(
    computed(() => ({
      queryKey: offersKey.value,
      queryFn: () => backendApi.offers(session.audience),
      enabled: !!session.user,
    })),
  )
  const selectedDealId = shallowRef<number | null>(null)
  const discount = shallowRef('0')
  const parkingUnitId = shallowRef<number | null>(null)
  const storageUnitId = shallowRef<number | null>(null)
  const selectedDeal = computed(
    () => visibleDeals.value.find((deal) => deal.id === selectedDealId.value) ?? null,
  )
  const selectedApartment = useQuery(
    computed(() => ({
      queryKey: ['backend', 'staff', 'apartment', selectedDeal.value?.id_apartment ?? 0],
      queryFn: () => backendApi.apartment('staff', selectedDeal.value!.id_apartment),
      enabled: session.isStaff && !!selectedDeal.value,
    })),
  )
  const ancillaryUnits = useQuery(
    computed(() => ({
      queryKey: [
        'backend',
        'staff',
        'ancillary-units',
        selectedApartment.data.value?.building_id ?? 0,
      ],
      queryFn: () => backendApi.ancillaryUnits('staff', selectedApartment.data.value!.building_id),
      enabled: session.isStaff && !!selectedApartment.data.value?.building_id,
    })),
  )
  const availableParking = computed(() =>
    (ancillaryUnits.data.value ?? []).filter(
      (unit) => unit.kind === 'parking' && unit.status === 'free',
    ),
  )
  const availableStorage = computed(() =>
    (ancillaryUnits.data.value ?? []).filter(
      (unit) => unit.kind === 'storage' && unit.status === 'free',
    ),
  )
  const refresh = () => queryClient.invalidateQueries({ queryKey: offersKey.value })
  const calculation = useMutation({
    mutationFn: () => {
      if (!selectedDealId.value) throw new Error('Выберите сделку')
      return backendApi.calculateOffer(
        selectedDealId.value,
        discount.value,
        parkingUnitId.value ?? undefined,
        storageUnitId.value ?? undefined,
      )
    },
  })
  const generate = useMutation({
    mutationFn: () => {
      const deal = selectedDeal.value
      if (!deal?.id_chat_session) {
        throw new Error('Для сделки нужна связанная переписка с клиентом')
      }
      return backendApi.ai('staff', {
        session_id: deal.id_chat_session,
        deal_id: deal.id,
        parking_unit_id: parkingUnitId.value ?? undefined,
        storage_unit_id: storageUnitId.value ?? undefined,
        message: `Сформируй коммерческое предложение со скидкой ${discount.value}% на основании актуальных данных сделки.`,
      })
    },
    onSuccess: refresh,
  })
  watch(selectedDealId, () => {
    parkingUnitId.value = null
    storageUnitId.value = null
  })
  watch([selectedDealId, discount, parkingUnitId, storageUnitId], () => calculation.reset())
  const requestApproval = useMutation({
    mutationFn: backendApi.requestOfferApproval,
    onSuccess: refresh,
  })
  const decisionReason = shallowRef('')
  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: 'approve' | 'reject' }) =>
      backendApi.decideOffer(id, decision, decisionReason.value),
    onSuccess: () => {
      decisionReason.value = ''
      void refresh()
    },
  })
  const download = useMutation({
    mutationFn: async (id: number) => ({
      id,
      blob: await backendApi.offerPdf(session.audience, id),
    }),
    onSuccess: ({ id, blob }) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `dsk-offer-${id}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    },
  })
  const send = useMutation({ mutationFn: backendApi.sendOffer })
  return {
    session,
    deals,
    visibleDeals,
    offers,
    selectedDealId,
    selectedDeal,
    selectedApartment,
    ancillaryUnits,
    availableParking,
    availableStorage,
    parkingUnitId,
    storageUnitId,
    discount,
    calculation,
    generate,
    requestApproval,
    decisionReason,
    decide,
    download,
    send,
  }
}
