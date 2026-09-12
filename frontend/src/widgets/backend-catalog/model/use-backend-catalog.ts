import { computed, shallowRef, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useSessionStore } from '@/features/auth-session'
import { backendApi } from '@/shared/api/backend-api'
import type { Apartment } from '@/entities/apartment'
import { localFloorPlan } from '@/entities/apartment'

export function useBackendCatalog(objectId: () => string | undefined) {
  const session = useSessionStore()
  const queryClient = useQueryClient()
  const scope = computed(() => ['backend', session.audience, session.user?.id, 'catalog'])
  const complexId = shallowRef<number | null>(null)
  const selectedBuilding = shallowRef<number | null>(null)
  const floor = shallowRef<number | null>(null)
  const selectedId = shallowRef('')
  const zoom = shallowRef(1)
  const requestText = shallowRef('')
  const view = shallowRef<'list' | 'plan'>('list')
  const buildingId = computed(() => (objectId() ? Number(objectId()) : selectedBuilding.value))
  const complexes = useQuery(
    computed(() => ({
      queryKey: [...scope.value, 'complexes'],
      queryFn: () => backendApi.complexes(session.audience),
    })),
  )
  watch(
    () => complexes.data.value,
    (items) => {
      if (items && !items.some((i) => i.id === complexId.value))
        complexId.value = items[0]?.id ?? null
    },
    { immediate: true },
  )
  const buildings = useQuery(
    computed(() => ({
      queryKey: [...scope.value, 'buildings', complexId.value],
      enabled: complexId.value !== null && !objectId(),
      queryFn: () => backendApi.buildings(session.audience, complexId.value!),
    })),
  )
  watch(
    () => buildings.data.value,
    (items) => {
      if (items && !items.some((i) => i.id === selectedBuilding.value))
        selectedBuilding.value = items[0]?.id ?? null
    },
    { immediate: true },
  )
  const building = useQuery(
    computed(() => ({
      queryKey: [...scope.value, 'building', buildingId.value],
      enabled: buildingId.value !== null,
      queryFn: () => backendApi.building(session.audience, buildingId.value!),
    })),
  )
  const units = useQuery(
    computed(() => ({
      queryKey: [...scope.value, 'apartments', buildingId.value],
      enabled: buildingId.value !== null,
      queryFn: () => backendApi.apartments(session.audience, buildingId.value!),
    })),
  )
  const progress = useQuery(
    computed(() => ({
      queryKey: [...scope.value, 'progress', buildingId.value],
      enabled: buildingId.value !== null,
      queryFn: () => backendApi.progress(session.audience, buildingId.value!),
    })),
  )
  const floors = computed(() =>
    [...new Set((units.data.value ?? []).map((u) => u.floor))].sort((a, b) => a - b),
  )
  watch(
    floors,
    (values) => {
      if (!values.includes(floor.value!)) floor.value = values[0] ?? null
    },
    { immediate: true },
  )
  const apartments = computed<Apartment[]>(() =>
    (units.data.value ?? [])
      .filter((u) => u.floor === floor.value)
      .map((u) => ({
        id: String(u.id),
        number: u.number,
        buildingId: String(u.building_id),
        projectId: String(building.data.value?.residential_complex_id ?? ''),
        floorId: `${u.building_id}:${u.floor}`,
        rooms: u.rooms,
        area: u.area,
        price: u.price,
        status: ({ free: 'available', booked: 'reserved', sold: 'sold' } as const)[u.status],
        finish: { rough: 'Без отделки', white_box: 'White box', turnkey: 'Чистовая' }[
          u.type_finishing
        ],
        completion: '',
        matchScore: 0,
        matchReasons: [],
        riskLevel: 'none',
      })),
  )
  const selected = computed(() => apartments.value.find((a) => a.id === selectedId.value))
  watch(
    apartments,
    (items) => {
      if (!items.some((i) => i.id === selectedId.value)) selectedId.value = ''
      requestText.value = ''
    },
    { immediate: true },
  )
  const plan = computed(() =>
    buildingId.value !== null && floor.value !== null
      ? localFloorPlan(buildingId.value, floor.value, apartments.value)
      : null,
  )
  const createRequest = useMutation({
    mutationFn: () => {
      if (
        session.isStaff ||
        !selected.value ||
        selected.value.status !== 'available' ||
        !requestText.value.trim()
      )
        throw new Error('Выберите доступную квартиру и введите сообщение')
      return backendApi.createSession({
        id_apartment: Number(selected.value.id),
        message: requestText.value.trim(),
      })
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['backend', session.audience, session.user?.id, 'sessions'],
      }),
  })
  watch([selectedId, buildingId], () => {
    createRequest.reset()
    requestText.value = ''
  })
  watch(complexId, () => {
    selectedBuilding.value = null
    selectedId.value = ''
  })
  const counts = computed(() => ({
    free: units.data.value?.filter((u) => u.status === 'free').length ?? 0,
    booked: units.data.value?.filter((u) => u.status === 'booked').length ?? 0,
    sold: units.data.value?.filter((u) => u.status === 'sold').length ?? 0,
  }))
  return {
    session,
    complexes,
    buildings,
    building,
    units,
    progress,
    complexId,
    selectedBuilding,
    buildingId,
    floor,
    floors,
    apartments,
    selectedId,
    selected,
    plan,
    zoom,
    view,
    requestText,
    createRequest,
    counts,
  }
}
