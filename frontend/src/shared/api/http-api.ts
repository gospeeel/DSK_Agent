import type { SalesApi } from './contracts'
// Legacy demo screens are not routed in the connected workspace.
// Do not issue invented /clients, /tasks, /offers or aggregate-catalog requests.
const unavailable = async (): Promise<never> => {
  throw new Error('Этот сценарий требует нового контракта API. См. FRONTEND_MIGRATION_STATUS.md')
}
export const httpSalesApi: SalesApi = {
  getClients: unavailable,
  getClient: unavailable,
  getTasks: unavailable,
  completeTask: unavailable,
  getConstructionEvents: unavailable,
  getConstructionObjects: unavailable,
  getApartmentCatalog: unavailable,
  getOffers: unavailable,
  createOffer: unavailable,
}
