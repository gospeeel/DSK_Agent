import { reactive, shallowRef, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiBuilding, ApiRole } from '@/shared/api/backend-contracts'

export function useBuildingEditor(building: () => ApiBuilding, role: () => ApiRole | undefined) {
  const open = shallowRef(false)
  const form = reactive({
    address: '',
    district: '',
    status: 'construction' as ApiBuilding['status'],
    readinessPercent: null as number | null,
    forecastDate: null as string | null,
    deliveryShiftDays: null as number | null,
  })
  const queryClient = useQueryClient()
  const reset = () =>
    Object.assign(form, {
      address: building().address,
      district: building().district,
      status: building().status,
      readinessPercent: building().readiness_percent ?? null,
      forecastDate: building().forecast_date?.slice(0, 10) ?? null,
      deliveryShiftDays: building().delivery_shift_days ?? null,
    })
  watch(
    () => building().id,
    () => {
      reset()
      open.value = false
    },
    { immediate: true },
  )
  const save = useMutation({
    mutationFn: () => {
      if (role() !== 'supervisor') throw new Error('Редактирование доступно только руководителю')
      if (!form.address.trim()) throw new Error('Укажите адрес')
      return backendApi.updateBuilding({
        ...building(),
        address: form.address.trim(),
        district: form.district.trim(),
        status: form.status,
        readiness_percent: form.readinessPercent,
        forecast_date: form.forecastDate ? new Date(`${form.forecastDate}T00:00:00`).toISOString() : null,
        delivery_shift_days: form.deliveryShiftDays,
      })
    },
    onSuccess: async () => {
      open.value = false
      await queryClient.invalidateQueries({
        queryKey: ['backend'],
        predicate: (query) => query.queryKey.includes('catalog'),
      })
    },
  })
  const start = () => {
    reset()
    save.reset()
    open.value = true
  }
  return { open, form, save, start }
}
