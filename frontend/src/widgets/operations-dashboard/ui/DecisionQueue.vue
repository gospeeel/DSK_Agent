<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'

import type { WorkTask } from '@/entities/task'
import { CompleteTaskButton } from '@/features/complete-task'
import { EmptyState, StatusBadge } from '@/shared/ui'

defineProps<{ tasks: WorkTask[] }>()

const toneLabel = { critical: 'Срочно', warning: 'Сегодня', stable: 'В плане' } as const
</script>

<template>
  <section class="rounded-2xl border border-ink/10 bg-sheet">
    <header class="flex items-end justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
      <div>
        <h2 class="text-lg font-semibold tracking-[-0.02em]">Очередь решений</h2>
        <p class="mt-1 text-sm text-muted">По приоритету и сроку</p>
      </div>
      <span class="text-sm font-semibold tabular-nums text-blueprint">{{ tasks.length }}</span>
    </header>
    <EmptyState
      v-if="!tasks.length"
      class="m-4 min-h-40"
      title="Очередь разобрана"
      text="Новые решения появятся после обновления данных по сделкам и строительству."
    />
    <div v-else class="divide-y divide-ink/8">
      <article
        v-for="task in tasks"
        :key="task.id"
        class="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-blueprint/3 sm:px-6"
      >
        <CompleteTaskButton :task-id="task.id" />
        <RouterLink :to="task.clientId ? `/clients/${task.clientId}` : '/'" class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-sm font-semibold text-ink">{{ task.title }}</p>
            <StatusBadge :tone="task.priority" :label="toneLabel[task.priority]" />
          </div>
          <p class="mt-1 truncate text-sm text-muted">{{ task.context }}</p>
        </RouterLink>
        <div class="flex items-center gap-2 text-xs font-medium text-muted">
          <span>{{ task.dueAt }}</span
          ><ChevronRight :size="16" class="transition-transform group-hover:translate-x-0.5" />
        </div>
      </article>
    </div>
  </section>
</template>
