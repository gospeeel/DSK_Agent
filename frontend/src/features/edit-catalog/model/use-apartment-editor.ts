import { reactive, shallowRef, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiApartment, ApiRole } from '@/shared/api/backend-contracts'

export function useApartmentEditor(apartment: () => ApiApartment, role: () => ApiRole | undefined) {
  const open = shallowRef(false)
  const form = reactive({ number: '', rooms: 1, floor: 1, area: 0, price: 0, typeFinishing: 'rough' as ApiApartment['type_finishing'], status: 'free' as ApiApartment['status'] })
  const queryClient = useQueryClient()
  const reset = () => Object.assign(form, { number: apartment().number, rooms: apartment().rooms, floor: apartment().floor, area: apartment().area, price: apartment().price, typeFinishing: apartment().type_finishing, status: apartment().status })
  watch(() => apartment().id, () => { reset(); open.value = false }, { immediate: true })
  const save = useMutation({
    mutationFn: () => {
      if (role() !== 'supervisor') throw new Error('Редактирование доступно только руководителю')
      if (!form.number.trim() || form.rooms < 1 || form.floor < 1 || form.area <= 0 || form.price <= 0) throw new Error('Проверьте номер, этаж, площадь и цену квартиры')
      return backendApi.updateApartment({ ...apartment(), number: form.number.trim(), rooms: form.rooms, floor: form.floor, area: form.area, price: form.price, type_finishing: form.typeFinishing, status: form.status })
    },
    onSuccess: async () => {
      open.value = false
      await queryClient.invalidateQueries({ queryKey: ['backend'], predicate: (query) => query.queryKey.includes('catalog') })
    },
  })
  const start = () => { reset(); save.reset(); open.value = true }
  return { open, form, save, start }
}
