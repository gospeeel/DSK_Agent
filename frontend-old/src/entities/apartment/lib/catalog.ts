import type { Apartment, ApartmentCatalog } from '@/shared/api'

export const getApartmentLabel = (apartment: Apartment) =>
  `${apartment.rooms}-комн. · ${apartment.area.toLocaleString('ru-RU')} м² · № ${apartment.number}`

export const getAvailableApartments = (catalog: ApartmentCatalog, floorId: string) =>
  catalog.apartments.filter((apartment) => apartment.floorId === floorId)

export const getApartmentContext = (catalog: ApartmentCatalog, apartment: Apartment) => ({
  project: catalog.projects.find((item) => item.id === apartment.projectId),
  building: catalog.buildings.find((item) => item.id === apartment.buildingId),
  floor: catalog.floors.find((item) => item.id === apartment.floorId),
})
