import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { clientQueries } from '@/entities/client'
import { constructionQueries } from '@/entities/construction'
import { taskQueries } from '@/entities/task'

export function useOperationsDashboard() {
  const clientsQuery = useQuery(clientQueries.list())
  const tasksQuery = useQuery(taskQueries.list())
  const eventsQuery = useQuery(constructionQueries.events())

  const activeTasks = computed(() =>
    (tasksQuery.data.value ?? []).filter((task) => !task.completed),
  )
  const criticalTasks = computed(
    () => activeTasks.value.filter((task) => task.priority === 'critical').length,
  )
  const activeDeals = computed(
    () => (clientsQuery.data.value ?? []).filter((client) => client.stage !== 'Новый').length,
  )
  const affectedClients = computed(() =>
    (eventsQuery.data.value ?? []).reduce((sum, event) => sum + event.affectedClients, 0),
  )
  const isPending = computed(
    () => clientsQuery.isPending.value || tasksQuery.isPending.value || eventsQuery.isPending.value,
  )
  const hasError = computed(
    () => clientsQuery.isError.value || tasksQuery.isError.value || eventsQuery.isError.value,
  )

  return {
    clientsQuery,
    tasksQuery,
    eventsQuery,
    activeTasks,
    criticalTasks,
    activeDeals,
    affectedClients,
    isPending,
    hasError,
  }
}
