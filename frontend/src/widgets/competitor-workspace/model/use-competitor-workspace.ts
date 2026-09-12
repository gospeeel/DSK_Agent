import { computed, reactive, shallowRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { usePlatformData } from '@/entities/platform'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiCompetitor } from '@/shared/api/backend-contracts'

export function useCompetitorWorkspace() {
  const session = useSessionStore()
  const queryClient = useQueryClient()
  const { visibleDeals } = usePlatformData(
    () => session.user,
    () => session.audience,
  )
  const selectedDealId = shallowRef<number | null>(null)
  const selectedDeal = computed(
    () => visibleDeals.value.find((deal) => deal.id === selectedDealId.value) ?? null,
  )
  const apartment = useQuery(
    computed(() => ({
      queryKey: ['backend', 'staff', 'apartment', selectedDeal.value?.id_apartment ?? 0],
      queryFn: () => backendApi.apartment('staff', selectedDeal.value!.id_apartment),
      enabled: !!selectedDeal.value,
    })),
  )
  const ownPricePerSqm = computed(() => {
    const value = apartment.data.value
    return value?.area ? Math.round(value.price / value.area) : null
  })
  const competitors = useQuery({
    queryKey: ['backend', 'staff', 'competitors'],
    queryFn: backendApi.competitors,
  })
  const form = reactive({
    project_name: '',
    district: '',
    price_per_sqm: '',
    source_url: '',
    observed_at: '',
    advantages: '',
    disadvantages: '',
    rooms: '',
    area: '',
  })
  const editingId = shallowRef<number | null>(null)
  const payload = () => ({
    project_name: form.project_name.trim(),
    district: form.district.trim(),
    price_per_sqm: form.price_per_sqm ? Number(form.price_per_sqm) : null,
    source_url: form.source_url.trim() || null,
    observed_at: form.observed_at ? new Date(form.observed_at).toISOString() : null,
    advantages: form.advantages.trim() || null,
    disadvantages: form.disadvantages.trim() || null,
    rooms: form.rooms ? Number(form.rooms) : null,
    area: form.area ? Number(form.area) : null,
  })
  const resetForm = () => {
    editingId.value = null
    Object.assign(form, { project_name: '', district: '', price_per_sqm: '', source_url: '', observed_at: '', advantages: '', disadvantages: '', rooms: '', area: '' })
  }
  const create = useMutation({
    mutationFn: () => editingId.value ? backendApi.updateCompetitor(editingId.value, payload()) : backendApi.createCompetitor(payload()),
    onSuccess: async () => {
      resetForm()
      await queryClient.invalidateQueries({ queryKey: ['backend', 'staff', 'competitors'] })
    },
  })
  const edit = (item: ApiCompetitor) => {
    editingId.value = item.id
    Object.assign(form, {
      project_name: item.project_name,
      district: item.district,
      price_per_sqm: item.price_per_sqm?.toString() ?? '',
      source_url: item.source_url ?? '',
      observed_at: item.observed_at?.slice(0, 10) ?? '',
      advantages: item.advantages ?? '',
      disadvantages: item.disadvantages ?? '',
      rooms: item.rooms?.toString() ?? '',
      area: item.area?.toString() ?? '',
    })
  }
  const priceDelta = (competitorPrice?: number | null) => {
    if (!competitorPrice || !ownPricePerSqm.value) return null
    return Math.round(((ownPricePerSqm.value - competitorPrice) / competitorPrice) * 100)
  }
  return {
    session,
    visibleDeals,
    selectedDealId,
    apartment,
    ownPricePerSqm,
    competitors,
    form,
    create,
    editingId,
    edit,
    resetForm,
    priceDelta,
  }
}
