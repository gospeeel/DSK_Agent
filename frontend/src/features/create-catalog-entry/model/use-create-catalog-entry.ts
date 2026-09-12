import { reactive } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiApartment, ApiBuilding, ApiProgress } from '@/shared/api/backend-contracts'

export type CatalogEntryKind = 'complex' | 'building' | 'apartment' | 'progress'

export function useCreateCatalogEntry() {
  const queryClient = useQueryClient()
  const complex = reactive({ name: '', address: '', description: '' })
  const building = reactive<Omit<ApiBuilding, 'id' | 'residential_complex_id'>>({
    address: '',
    district: '',
    latitude: 51.67,
    longitude: 39.2,
    floors_count: 17,
    planned_date: null as string | null,
    actual_date: null as string | null,
    status: 'construction',
    type_wall_material: 'panel',
    readiness_percent: null,
    forecast_date: null,
    delivery_shift_days: null,
  })
  const apartment = reactive<Omit<ApiApartment, 'id' | 'building_id'>>({
    number: '',
    rooms: 1,
    floor: 1,
    area: 40,
    price: 5_000_000,
    type_finishing: 'rough',
    status: 'free',
  })
  const progress = reactive<Omit<ApiProgress, 'id' | 'building_id'>>({
    stage_name: 'excavation',
    planned_start_date: null as string | null,
    actual_start_date: null as string | null,
    planned_end_date: null as string | null,
    actual_end_date: null as string | null,
    status: 'not_started',
    completion_percentage: 0 as number | null,
    delay_reason: '',
    risk_level: 'low',
    delay_days: 0 as number | null,
  })
  const create = useMutation<unknown, Error, { kind: CatalogEntryKind; complexId: number | null; buildingId: number | null }>({
    mutationFn: ({ kind, complexId, buildingId }: { kind: CatalogEntryKind; complexId: number | null; buildingId: number | null }) => {
      if (kind === 'complex') return backendApi.createComplex({ ...complex })
      if (kind === 'building') {
        if (!complexId) throw new Error('Сначала выберите жилой комплекс')
        return backendApi.createBuilding({ residential_complex_id: complexId, ...building })
      }
      if (!buildingId) throw new Error('Сначала выберите корпус')
      if (kind === 'apartment') return backendApi.createApartment({ building_id: buildingId, ...apartment })
      return backendApi.createProgress({ building_id: buildingId, ...progress })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backend'] }),
  })

  return { complex, building, apartment, progress, create }
}
