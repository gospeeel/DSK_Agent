import { reactive, shallowRef, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiComplex, ApiRole } from '@/shared/api/backend-contracts'

export function useComplexEditor(complex: () => ApiComplex, role: () => ApiRole | undefined) {
  const open = shallowRef(false)
  const form = reactive({ name: '', address: '', description: '' })
  const queryClient = useQueryClient()
  const reset = () => Object.assign(form, {
    name: complex().name,
    address: complex().address,
    description: complex().description,
  })
  watch(() => complex().id, () => { reset(); open.value = false }, { immediate: true })
  const save = useMutation({
    mutationFn: () => {
      if (role() !== 'supervisor') throw new Error('Редактирование доступно только руководителю')
      if (!form.name.trim() || !form.address.trim()) throw new Error('Укажите название и адрес ЖК')
      return backendApi.updateComplex({ ...complex(), name: form.name.trim(), address: form.address.trim(), description: form.description.trim() })
    },
    onSuccess: async () => {
      open.value = false
      await queryClient.invalidateQueries({ queryKey: ['backend'], predicate: (query) => query.queryKey.includes('catalog') })
    },
  })
  const start = () => { reset(); save.reset(); open.value = true }
  return { open, form, save, start }
}
