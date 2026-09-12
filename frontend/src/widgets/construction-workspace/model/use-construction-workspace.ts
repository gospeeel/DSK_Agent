import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { constructionQueries } from '@/entities/construction'
import { apartmentQueries } from '@/entities/apartment'

export function useConstructionWorkspace(objectId: () => string) {
  const objects = useQuery(constructionQueries.objects())
  const eventsQuery = useQuery(constructionQueries.events())
  const catalogQuery = useQuery(apartmentQueries.catalog())
  const object = computed(() => objects.data.value?.find((item) => item.id === objectId()))
  const project = computed(() =>
    catalogQuery.data.value?.projects.find((item) => item.id === object.value?.projectId),
  )
  const events = computed(
    () => eventsQuery.data.value?.filter((item) => item.objectId === objectId()) ?? [],
  )
  const floors = computed(() => {
    const catalog = catalogQuery.data.value
    if (!catalog || !object.value?.buildingId) return []
    return catalog.floors
      .filter((floor) => floor.buildingId === object.value?.buildingId)
      .map((floor) => {
        const apartments = catalog.apartments.filter((item) => item.floorId === floor.id)
        const available = apartments.filter((item) => item.status === 'available')
        return {
          ...floor,
          available: available.length,
          total: apartments.length,
          minPrice: available.length ? Math.min(...available.map((item) => item.price)) : null,
        }
      })
  })
  return { objects, object, project, eventsQuery, events, catalogQuery, floors }
}
