import { computed, reactive } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiAudience, ApiAncillaryUnit } from '@/shared/api/backend-contracts'

export function useAncillaryInventory(buildingId: () => number, audience: () => ApiAudience) {
  const queryClient = useQueryClient()
  const key = computed(() => ['backend', audience(), 'ancillary-units', buildingId()] as const)
  const units = useQuery(computed(() => ({ queryKey: key.value, queryFn: () => backendApi.ancillaryUnits(audience(), buildingId()) })))
  const draft = reactive<Omit<ApiAncillaryUnit, 'id' | 'building_id' | 'created_at' | 'updated_at'>>({
    kind: 'parking',
    number: '',
    area: null,
    price: 0,
    status: 'free',
  })
  const create = useMutation({
    mutationFn: () => backendApi.createAncillaryUnit({ building_id: buildingId(), ...draft }),
    onSuccess: () => {
      draft.number = ''
      draft.area = null
      draft.price = 0
      void queryClient.invalidateQueries({ queryKey: key.value })
    },
  })
  const available = computed(() => (units.data.value ?? []).filter((item) => item.status === 'free'))
  return { units, available, draft, create }
}
