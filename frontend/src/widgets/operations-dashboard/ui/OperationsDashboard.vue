<script setup lang="ts">
import { ArrowUpRight, BriefcaseBusiness, CircleAlert, UserRoundCheck } from '@lucide/vue'

import { EmptyState, LoadingRows } from '@/shared/ui'
import DecisionQueue from './DecisionQueue.vue'
import ImpactChain from './ImpactChain.vue'
import { useOperationsDashboard } from '../model/use-operations-dashboard'

const dashboard = useOperationsDashboard()
</script>

<template>
  <div class="mx-auto max-w-[1520px]">
    <header class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2
          class="max-w-3xl text-2xl leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[30px]"
        >
          Что изменилось — и кому нужно ответить
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Сводка по актуальным данным · последнее обновление сегодня в 10:24
        </p>
      </div>
      <RouterLink
        to="/clients"
        class="inline-flex items-center gap-2 self-start text-sm font-semibold text-blueprint underline decoration-blueprint/25 underline-offset-4"
        >Все клиенты <ArrowUpRight :size="16"
      /></RouterLink>
    </header>

    <LoadingRows v-if="dashboard.isPending.value" :rows="5" />
    <div
      v-else-if="dashboard.hasError.value"
      class="rounded-2xl border border-risk/25 bg-risk/8 p-5 text-sm text-risk"
    >
      Не удалось загрузить сводку. Обновите страницу или повторите позже.
    </div>
    <template v-else>
      <div class="mb-5 grid gap-3 sm:grid-cols-3">
        <div
          class="flex items-center justify-between rounded-xl border border-ink/10 bg-sheet px-5 py-4"
        >
          <div>
            <p class="text-xs font-medium text-muted">Активные сделки</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums">
              {{ dashboard.activeDeals.value }}
            </p>
          </div>
          <BriefcaseBusiness :size="22" class="text-blueprint" />
        </div>
        <div
          class="flex items-center justify-between rounded-xl border border-risk/18 bg-sheet px-5 py-4"
        >
          <div>
            <p class="text-xs font-medium text-muted">Срочные действия</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-risk">
              {{ dashboard.criticalTasks.value }}
            </p>
          </div>
          <CircleAlert :size="22" class="text-risk" />
        </div>
        <div
          class="flex items-center justify-between rounded-xl border border-signal/25 bg-sheet px-5 py-4"
        >
          <div>
            <p class="text-xs font-medium text-muted">Затронуты изменениями</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums">
              {{ dashboard.affectedClients.value }}
            </p>
          </div>
          <UserRoundCheck :size="22" class="text-[#8a590e]" />
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div class="space-y-5">
          <ImpactChain
            v-if="dashboard.eventsQuery.data.value?.[0]"
            :event="dashboard.eventsQuery.data.value[0]"
          />
          <EmptyState
            v-else
            title="Новых событий нет"
            text="Когда ERP зафиксирует изменение, здесь появится его влияние на клиентов и рекомендуемое действие."
          />
          <section class="rounded-2xl border border-ink/10 bg-sheet p-5 sm:p-6">
            <h2 class="text-lg font-semibold tracking-[-0.02em]">Темп воронки</h2>
            <p class="mt-1 text-sm text-muted">Активные сделки по этапам</p>
            <div class="mt-6 space-y-4">
              <div
                v-for="item in [
                  { label: 'Подбор', value: 18, width: 72 },
                  { label: 'Переговоры', value: 11, width: 52 },
                  { label: 'Бронь', value: 7, width: 34 },
                  { label: 'Оформление', value: 4, width: 22 },
                ]"
                :key="item.label"
              >
                <div class="mb-1.5 flex justify-between text-sm">
                  <span>{{ item.label }}</span
                  ><span class="font-semibold tabular-nums">{{ item.value }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-blueprint/9">
                  <div
                    class="h-full rounded-full bg-blueprint"
                    :style="{ width: `${item.width}%` }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-7 border-t border-ink/10 pt-5">
              <p class="text-sm font-semibold">AI заметил узкое место</p>
              <p class="mt-1 text-sm leading-6 text-muted">
                Два клиента ждут уточнения сроков дольше одного рабочего дня.
              </p>
            </div>
          </section>
        </div>
        <DecisionQueue :tasks="dashboard.activeTasks.value" />
      </div>
    </template>
  </div>
</template>
