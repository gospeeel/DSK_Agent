import { afterEach, expect, it, vi } from 'vitest'
import { backendApi } from './backend-api'
import type { ApiAncillaryUnit, ApiApartment, ApiComplex, ApiProgress } from './backend-contracts'

afterEach(() => vi.unstubAllGlobals())

it('sends supervisor staff creation to the staff API', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{"id":18,"name":"Анна","email":"anna@dsk.demo","role":"manager"}'))
  vi.stubGlobal('fetch', fetch)
  await backendApi.createStaff({ name: 'Анна', email: 'anna@dsk.demo', password: 'Demo123!', role: 'manager' })
  expect(fetch).toHaveBeenCalledWith('/staff-api/api/auth/register', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ name: 'Анна', email: 'anna@dsk.demo', password: 'Demo123!', role: 'manager' }),
  }))
})

it.each([
  ['complexes/2', { id: 2, name: 'ЖК', address: 'Адрес', description: '' } satisfies ApiComplex, backendApi.updateComplex],
  ['apartments/3', { id: 3, building_id: 2, number: '10', rooms: 2, floor: 4, area: 61.2, price: 7_000_000, type_finishing: 'rough', status: 'free' } satisfies ApiApartment, backendApi.updateApartment],
  ['progress/4', { id: 4, building_id: 2, stage_name: 'frame', planned_start_date: null, actual_start_date: null, planned_end_date: null, actual_end_date: null, status: 'in_progress', completion_percentage: 65, delay_reason: '' } satisfies ApiProgress, backendApi.updateProgress],
  ['ancillary-units/5', { id: 5, building_id: 2, kind: 'parking', number: 'P-5', area: 13, price: 900_000, status: 'booked', created_at: '', updated_at: '' } satisfies ApiAncillaryUnit, backendApi.updateAncillaryUnit],
] as const)('updates %s with PUT and the complete entity', async (path, entity, update) => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(entity)))
  vi.stubGlobal('fetch', fetch)
  await (update as (value: never) => Promise<unknown>)(entity as never)
  expect(fetch).toHaveBeenCalledWith(`/staff-api/api/${path}`, expect.objectContaining({
    method: 'PUT',
    body: JSON.stringify(entity),
  }))
})
