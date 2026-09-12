import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import type { ApartmentCatalog } from '@/entities/apartment'

export const useApartmentSelectionStore = defineStore('apartment-selection', () => {
  const projectId = shallowRef('')
  const buildingId = shallowRef('')
  const floorId = shallowRef('')
  const selectedApartmentId = shallowRef('')
  const mobileView = shallowRef<'plan' | 'list'>('plan')

  const selectFloorDefaults = (catalog: ApartmentCatalog, nextFloorId: string) => {
    floorId.value = nextFloorId
    selectedApartmentId.value =
      catalog.apartments.find(
        (apartment) => apartment.floorId === nextFloorId && apartment.status === 'available',
      )?.id ?? ''
  }

  const initialize = (catalog: ApartmentCatalog, initialApartmentId?: string) => {
    mobileView.value = 'plan'
    const apartment =
      catalog.apartments.find((item) => item.id === initialApartmentId) ??
      catalog.apartments.find((item) => item.status === 'available')
    if (!apartment) return
    projectId.value = apartment.projectId
    buildingId.value = apartment.buildingId
    floorId.value = apartment.floorId
    selectedApartmentId.value = apartment.id
  }

  const selectProject = (catalog: ApartmentCatalog, nextProjectId: string) => {
    projectId.value = nextProjectId
    buildingId.value =
      catalog.buildings.find((building) => building.projectId === nextProjectId)?.id ?? ''
    const nextFloorId =
      catalog.floors.find((floor) => floor.buildingId === buildingId.value)?.id ?? ''
    selectFloorDefaults(catalog, nextFloorId)
  }

  const selectBuilding = (catalog: ApartmentCatalog, nextBuildingId: string) => {
    buildingId.value = nextBuildingId
    const nextFloorId =
      catalog.floors.find((floor) => floor.buildingId === nextBuildingId)?.id ?? ''
    selectFloorDefaults(catalog, nextFloorId)
  }

  const selectFloor = (catalog: ApartmentCatalog, nextFloorId: string) => {
    selectFloorDefaults(catalog, nextFloorId)
  }

  return {
    projectId,
    buildingId,
    floorId,
    selectedApartmentId,
    mobileView,
    initialize,
    selectProject,
    selectBuilding,
    selectFloor,
  }
})
