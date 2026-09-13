import { expect, it } from 'vitest'
import type { Apartment } from '@/shared/api/contracts'
import { localFloorPlan } from './local-floor-plan'
const apartments: Apartment[] = [2, 1, 2, 3, 1, 3].map((rooms, i) => ({
  id: String(100 + i),
  number: `10${i}А`,
  rooms,
  area: 50 + i,
  price: 7_000_000,
  status: 'available',
  buildingId: '7',
  projectId: '1',
  floorId: '7:10',
  completion: '',
  finish: 'Без отделки',
  matchScore: 0,
  matchReasons: [],
  riskLevel: 'none',
}))
it('keeps the same geometry after reopening and changes in API ordering', () => {
  expect(localFloorPlan(7, 10, apartments)).not.toBeNull()
  expect(localFloorPlan(7, 10, [...apartments].reverse())).toEqual(
    localFloorPlan(7, 10, apartments),
  )
})
it('uses only actual apartment IDs and never invents room areas', () => {
  const plan = localFloorPlan(7, 10, apartments)!
  expect(plan.regions.map((r) => r.apartmentId).sort()).toEqual(apartments.map((a) => a.id).sort())
  expect(plan.regions.every((r) => r.rooms.every((room) => room.area === undefined))).toBe(true)
})
it('falls back to a list for incompatible inventory', () => {
  expect(localFloorPlan(7, 10, apartments.slice(0, 1))).toBeNull()
  expect(localFloorPlan(7, 10, [])).toBeNull()
})
