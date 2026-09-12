import type { Client } from '@/shared/api'

export function filterClients(clients: Client[], query: string, stage: string): Client[] {
  const normalized = query.trim().toLocaleLowerCase('ru')
  return clients.filter((client) => {
    const matchesQuery =
      !normalized ||
      [client.name, client.phone, client.property, client.project].some((value) =>
        value.toLocaleLowerCase('ru').includes(normalized),
      )
    const matchesStage = stage === 'Все сделки' || client.stage === stage
    return matchesQuery && matchesStage
  })
}
