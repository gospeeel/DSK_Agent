import { computed, shallowRef, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiDiscountPolicy } from '@/shared/api/backend-contracts'

export function useDiscountPolicies(buildingId: () => number) {
  const queryClient = useQueryClient()
  const role = shallowRef<ApiDiscountPolicy['role']>('manager')
  const maximum = shallowRef('5')
  const validFrom = shallowRef(new Date().toISOString().slice(0, 10))
  const key = computed(() => ['backend', 'discount-policies', buildingId()] as const)
  const policies = useQuery(
    computed(() => ({
      queryKey: key.value,
      queryFn: () => backendApi.discountPolicies(buildingId()),
      enabled: buildingId() > 0,
    })),
  )
  const create = useMutation({
    mutationFn: () =>
      backendApi.createDiscountPolicy({
        building_id: buildingId(),
        role: role.value,
        max_discount_percent: maximum.value,
        valid_from: new Date(`${validFrom.value}T00:00:00`).toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key.value }),
  })
  watch(role, () => create.reset())
  return { policies, role, maximum, validFrom, create }
}
