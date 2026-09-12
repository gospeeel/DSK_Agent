import { describe, expect, it } from 'vitest'

import { mockApartmentCatalog } from './mock-apartments'

describe('mock apartment floor plans', () => {
  it('uses all seven stable layout variants', () => {
    const layouts = new Set(mockApartmentCatalog.floors.map((floor) => floor.layoutId))

    expect(layouts.size).toBe(7)
    for (const floor of mockApartmentCatalog.floors) {
      const plan = mockApartmentCatalog.plans.find((item) => item.floorId === floor.id)
      expect(plan?.layoutId, floor.id).toBe(floor.layoutId)
    }
  })

  it('keeps apartment room count consistent with the rendered plan', () => {
    for (const plan of mockApartmentCatalog.plans) {
      for (const region of plan.regions) {
        const apartment = mockApartmentCatalog.apartments.find(
          (item) => item.id === region.apartmentId,
        )
        const livingRoomCount = region.rooms.filter((room) => room.label === 'Жилая комната').length

        expect(apartment, region.apartmentId).toBeDefined()
        expect(apartment?.rooms, region.apartmentId).toBe(livingRoomCount)
      }
    }
  })
})
