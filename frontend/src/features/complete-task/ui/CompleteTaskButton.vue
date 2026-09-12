<script setup lang="ts">
import { CircleAlert, Check } from '@lucide/vue'

import { useCompleteTask } from '../model/use-complete-task'

const props = defineProps<{ taskId: string }>()
const mutation = useCompleteTask()

const complete = () => mutation.mutate(props.taskId)
</script>

<template>
  <div class="shrink-0">
    <button
      class="grid size-9 place-items-center rounded-lg border bg-white transition-colors disabled:cursor-wait disabled:opacity-50"
      :class="
        mutation.isError.value
          ? 'border-risk/35 text-risk'
          : 'border-ink/12 text-muted hover:border-safe/40 hover:bg-safe/8 hover:text-safe'
      "
      type="button"
      :disabled="mutation.isPending.value"
      :aria-label="
        mutation.isError.value
          ? 'Не удалось завершить задачу. Повторить'
          : 'Отметить задачу выполненной'
      "
      @click="complete"
    >
      <CircleAlert v-if="mutation.isError.value" :size="17" aria-hidden="true" />
      <Check v-else :size="17" aria-hidden="true" />
    </button>
    <button
      v-if="mutation.isError.value"
      class="mt-1 max-w-20 text-left text-[10px] leading-3 font-medium text-risk underline underline-offset-2"
      type="button"
      @click="complete"
    >
      Не сохранено. Повторить
    </button>
  </div>
</template>
