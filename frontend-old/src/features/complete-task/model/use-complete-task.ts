import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { taskKeys } from '@/entities/task'
import { salesApi } from '@/shared/api'

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => salesApi.completeTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  })
}
