import { describe, expect, it } from 'vitest'

import type { Client } from '@/shared/api'
import { filterClients } from './filter-clients'

const client = {
  id: '1',
  name: 'Анна Смирнова',
  phone: '+7 900',
  property: '№ 184',
  project: 'Северный',
  stage: 'Переговоры',
} as Client

describe('filterClients', () => {
  it('searches across client fields without case sensitivity', () => {
    expect(filterClients([client], 'АННА', 'Все сделки')).toEqual([client])
    expect(filterClients([client], '184', 'Все сделки')).toEqual([client])
  })

  it('filters by deal stage', () => {
    expect(filterClients([client], '', 'Переговоры')).toEqual([client])
    expect(filterClients([client], '', 'Бронь')).toEqual([])
  })
})
