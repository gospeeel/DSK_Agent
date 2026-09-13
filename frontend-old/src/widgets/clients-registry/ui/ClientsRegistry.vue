<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { ChevronRight } from '@lucide/vue'

import { clientQueries, filterClients } from '@/entities/client'
import { ClientFilters } from '@/features/filter-clients'
import { EmptyState, LoadingRows, StatusBadge } from '@/shared/ui'

const query = shallowRef('')
const stage = shallowRef('Все сделки')
const clientsQuery = useQuery(clientQueries.list())
const visibleClients = computed(() =>
  filterClients(clientsQuery.data.value ?? [], query.value, stage.value),
)
const riskTone = (count: number) => (count ? ('warning' as const) : ('stable' as const))
</script>

<template>
  <div class="mx-auto max-w-[1520px]">
    <section class="rounded-2xl border border-ink/10 bg-sheet">
      <div class="border-b border-ink/10 p-4 sm:p-5">
        <ClientFilters v-model:query="query" v-model:stage="stage" />
      </div>
      <LoadingRows v-if="clientsQuery.isPending.value" class="p-5" />
      <div v-else-if="clientsQuery.isError.value" class="p-5 text-sm text-risk">
        Не удалось загрузить клиентов.
      </div>
      <EmptyState
        v-else-if="!visibleClients.length"
        class="m-5"
        title="Клиенты не найдены"
        text="Измените запрос или сбросьте этап сделки — реестр обновится автоматически."
      />
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[780px] border-collapse text-left">
            <thead>
              <tr
                class="border-b border-ink/10 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase"
              >
                <th class="px-5 py-3">Клиент</th>
                <th class="px-4 py-3">Объект</th>
                <th class="px-4 py-3">Этап</th>
                <th class="px-4 py-3">Следующее действие</th>
                <th class="w-12 px-4 py-3"><span class="sr-only">Открыть</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink/8">
              <tr
                v-for="client in visibleClients"
                :key="client.id"
                class="group transition-colors hover:bg-blueprint/3"
              >
                <td class="px-5 py-4">
                  <RouterLink :to="`/clients/${client.id}`" class="flex items-center gap-3"
                    ><span
                      class="grid size-9 place-items-center rounded-full bg-blueprint-soft text-xs font-bold text-blueprint"
                      >{{ client.initials }}</span
                    ><span
                      ><span class="block text-sm font-semibold">{{ client.name }}</span
                      ><span class="mt-0.5 block text-xs text-muted">{{ client.phone }}</span></span
                    ></RouterLink
                  >
                </td>
                <td class="px-4 py-4">
                  <p class="text-sm font-medium">{{ client.property }}</p>
                  <p class="mt-0.5 text-xs text-muted">{{ client.project }}</p>
                </td>
                <td class="px-4 py-4"><StatusBadge tone="blue" :label="client.stage" /></td>
                <td class="px-4 py-4">
                  <p class="text-sm">{{ client.nextAction }}</p>
                  <p class="mt-0.5 text-xs text-muted">{{ client.nextActionAt }}</p>
                </td>
                <td class="px-4 py-4">
                  <RouterLink
                    :to="`/clients/${client.id}`"
                    class="grid size-8 place-items-center rounded-lg text-muted transition-colors group-hover:bg-white group-hover:text-blueprint"
                    :aria-label="`Открыть карточку ${client.name}`"
                    ><ChevronRight :size="17"
                  /></RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="divide-y divide-ink/8 md:hidden">
          <RouterLink
            v-for="client in visibleClients"
            :key="client.id"
            :to="`/clients/${client.id}`"
            class="block p-4 transition-colors hover:bg-blueprint/3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-10 place-items-center rounded-full bg-blueprint-soft text-xs font-bold text-blueprint"
                  >{{ client.initials }}</span
                >
                <div>
                  <p class="font-semibold">{{ client.name }}</p>
                  <p class="mt-0.5 text-xs text-muted">{{ client.property }}</p>
                </div>
              </div>
              <StatusBadge
                :tone="riskTone(client.risks.length)"
                :label="client.risks.length ? `${client.risks.length} риск` : client.stage"
              />
            </div>
            <div class="mt-4 flex items-center justify-between gap-3 text-sm">
              <span class="text-muted">{{ client.nextActionAt }}</span
              ><span class="font-medium text-blueprint">{{ client.nextAction }}</span>
            </div>
          </RouterLink>
        </div>
      </template>
    </section>
  </div>
</template>
