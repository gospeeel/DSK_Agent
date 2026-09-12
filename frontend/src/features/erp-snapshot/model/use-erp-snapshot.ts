import { computed, reactive, shallowRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiErpEvent, ApiProductionSchedule } from '@/shared/api/backend-contracts'

export function useErpSnapshot(buildingId: () => number) {
  const queryClient = useQueryClient()
  const key = computed(() => ['backend', 'erp', buildingId()] as const)
  const snapshot = useQuery(computed(() => ({ queryKey: key.value, queryFn: () => backendApi.erpSnapshot(buildingId()) })))
  const mode = shallowRef<'event' | 'stock' | 'schedule'>('event')
  const event = reactive<Omit<ApiErpEvent, 'id' | 'building_id' | 'occurred_at'>>({ kind: 'supply', title: '', details: '', severity: 'low', affects_delivery: false, delay_days: null })
  const stock = reactive({ material_name: '', quantity: 0, unit: 'шт.', minimum_quantity: 0 })
  const schedule = reactive<Omit<ApiProductionSchedule, 'id' | 'building_id' | 'updated_at'>>({ product_name: '', planned_quantity: 0, produced_quantity: 0, planned_date: new Date().toISOString().slice(0, 10), status: 'planned' })
  const save = useMutation<unknown, Error>({
    mutationFn: () => {
      const building_id = buildingId()
      if (mode.value === 'event') return backendApi.createErpEvent({ building_id, ...event })
      if (mode.value === 'stock') return backendApi.upsertMaterialStock({ building_id, ...stock })
      return backendApi.createProductionSchedule({ building_id, ...schedule, planned_date: new Date(`${schedule.planned_date}T00:00:00`).toISOString() })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key.value }),
  })
  const shortages = computed(() => snapshot.data.value?.material_stocks.filter((item) => item.quantity < item.minimum_quantity) ?? [])
  return { snapshot, shortages, mode, event, stock, schedule, save }
}
