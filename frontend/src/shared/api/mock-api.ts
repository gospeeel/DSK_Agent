import type { CreateOfferInput, SalesApi } from './contracts'
import {
  mockClients,
  mockConstructionEvents,
  mockObjects,
  mockOffers,
  mockTasks,
} from './mock-data'
import { mockApartmentCatalog } from './mock-apartments'

const pause = (duration = 260) => new Promise((resolve) => window.setTimeout(resolve, duration))

export const mockSalesApi: SalesApi = {
  async getClients() {
    await pause()
    return structuredClone(mockClients)
  },
  async getClient(id) {
    await pause()
    return structuredClone(mockClients.find((client) => client.id === id) ?? null)
  },
  async getTasks() {
    await pause()
    return structuredClone(mockTasks)
  },
  async completeTask(id) {
    await pause(180)
    const task = mockTasks.find((item) => item.id === id)
    if (!task) throw new Error('Задача не найдена')
    task.completed = true
    return structuredClone(task)
  },
  async getConstructionEvents() {
    await pause()
    return structuredClone(mockConstructionEvents)
  },
  async getConstructionObjects() {
    await pause()
    return structuredClone(mockObjects)
  },
  async getApartmentCatalog() {
    await pause()
    return structuredClone(mockApartmentCatalog)
  },
  async getOffers() {
    await pause()
    return structuredClone(mockOffers)
  },
  async createOffer(input: CreateOfferInput) {
    await pause(320)
    const client = mockClients.find((item) => item.id === input.clientId)
    if (!client) throw new Error('Клиент не найден')
    const offer = {
      id: `КП-${2050 + mockOffers.length}`,
      clientId: input.clientId,
      clientName: client.name,
      apartmentId: input.apartmentId,
      property: input.property,
      amount: input.amount,
      discount: input.discount,
      status: input.discount > 3 ? ('Согласование' as const) : ('Черновик' as const),
      updatedAt: 'Только что',
      extras: input.extras,
    }
    mockOffers.unshift(offer)
    return structuredClone(offer)
  },
}
