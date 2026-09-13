import { reactive, shallowRef, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiProgress, ApiRole } from '@/shared/api/backend-contracts'

const inputDate = (value: string | null) => value?.slice(0, 10) ?? ''
const apiDate = (value: string) => value ? new Date(`${value}T00:00:00`).toISOString() : null

export function useProgressEditor(progress: () => ApiProgress, role: () => ApiRole | undefined) {
  const open = shallowRef(false)
  const form = reactive({ status: 'not_started' as ApiProgress['status'], completionPercentage: null as number | null, plannedStartDate: '', actualStartDate: '', plannedEndDate: '', actualEndDate: '', delayReason: '', delayDays: null as number | null, riskLevel: null as ApiProgress['risk_level'] })
  const queryClient = useQueryClient()
  const reset = () => Object.assign(form, { status: progress().status, completionPercentage: progress().completion_percentage, plannedStartDate: inputDate(progress().planned_start_date), actualStartDate: inputDate(progress().actual_start_date), plannedEndDate: inputDate(progress().planned_end_date), actualEndDate: inputDate(progress().actual_end_date), delayReason: progress().delay_reason, delayDays: progress().delay_days ?? null, riskLevel: progress().risk_level ?? null })
  watch(() => progress().id, () => { reset(); open.value = false }, { immediate: true })
  const save = useMutation({
    mutationFn: () => {
      if (role() !== 'supervisor') throw new Error('Редактирование доступно только руководителю')
      if (form.completionPercentage !== null && (form.completionPercentage < 0 || form.completionPercentage > 100)) throw new Error('Готовность должна быть от 0 до 100%')
      return backendApi.updateProgress({ ...progress(), status: form.status, completion_percentage: form.completionPercentage, planned_start_date: apiDate(form.plannedStartDate), actual_start_date: apiDate(form.actualStartDate), planned_end_date: apiDate(form.plannedEndDate), actual_end_date: apiDate(form.actualEndDate), delay_reason: form.delayReason.trim(), delay_days: form.delayDays, risk_level: form.riskLevel })
    },
    onSuccess: async () => {
      open.value = false
      await queryClient.invalidateQueries({ queryKey: ['backend'], predicate: (query) => query.queryKey.includes('catalog') })
    },
  })
  const start = () => { reset(); save.reset(); open.value = true }
  return { open, form, save, start }
}
