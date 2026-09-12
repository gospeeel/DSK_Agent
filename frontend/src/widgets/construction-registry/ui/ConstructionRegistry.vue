<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { Building2, CalendarClock, CircleParking } from '@lucide/vue'

import { constructionQueries } from '@/entities/construction'
import { EmptyState, LoadingRows, StatusBadge } from '@/shared/ui'

const objectsQuery = useQuery(constructionQueries.objects())
const statusLabel = { critical: 'Отклонение', warning: 'Наблюдение', stable: 'По плану' } as const
</script>

<template>
  <div class="mx-auto max-w-[1520px]">
    <LoadingRows v-if="objectsQuery.isPending.value" :rows="5" />
    <div
      v-else-if="objectsQuery.isError.value"
      class="rounded-2xl border border-risk/20 bg-sheet p-5 text-sm text-risk"
    >
      Не удалось загрузить объекты.
    </div>
    <EmptyState
      v-else-if="!objectsQuery.data.value?.length"
      title="Объекты не загружены"
      text="После синхронизации с ERP здесь появятся этапы готовности, прогнозы сдачи и остатки."
    />
    <div v-else class="grid gap-4 lg:grid-cols-2">
      <article
        v-for="object in objectsQuery.data.value"
        :key="object.id"
        class="rounded-2xl border border-ink/10 bg-sheet p-5 sm:p-6"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <span
              class="grid size-10 place-items-center rounded-lg bg-blueprint-soft text-blueprint"
              ><CircleParking v-if="object.type === 'Паркинг'" :size="20" /><Building2
                v-else
                :size="20"
            /></span>
            <div>
              <h3 class="font-semibold">
                <RouterLink :to="`/construction/${object.id}`" class="hover:underline">{{
                  object.name
                }}</RouterLink>
              </h3>
              <p class="mt-0.5 text-xs text-muted">{{ object.type }} · {{ object.currentStage }}</p>
            </div>
          </div>
          <StatusBadge :tone="object.level" :label="statusLabel[object.level]" />
        </div>
        <div class="mt-6">
          <div class="mb-2 flex items-end justify-between">
            <span class="text-xs font-medium text-muted">Общая готовность</span
            ><span class="text-xl font-semibold tabular-nums">{{ object.readiness }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-blueprint/9">
            <div
              class="h-full rounded-full"
              :class="
                object.level === 'critical'
                  ? 'bg-risk'
                  : object.level === 'warning'
                    ? 'bg-signal'
                    : 'bg-safe'
              "
              :style="{ width: `${object.readiness}%` }"
            />
          </div>
        </div>
        <div
          class="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/8 bg-ink/8 sm:grid-cols-4"
        >
          <div class="bg-paper p-3">
            <p class="text-[11px] text-muted">План</p>
            <p class="mt-1 text-sm font-semibold">{{ object.plannedDelivery }}</p>
          </div>
          <div class="bg-paper p-3">
            <p class="text-[11px] text-muted">Прогноз</p>
            <p
              class="mt-1 text-sm font-semibold"
              :class="object.plannedDelivery !== object.forecastDelivery ? 'text-risk' : ''"
            >
              {{ object.forecastDelivery }}
            </p>
          </div>
          <div class="bg-paper p-3">
            <p class="text-[11px] text-muted">В продаже</p>
            <p class="mt-1 text-sm font-semibold tabular-nums">{{ object.availableUnits }}</p>
          </div>
          <div class="bg-paper p-3">
            <p class="text-[11px] text-muted">В резерве</p>
            <p class="mt-1 text-sm font-semibold tabular-nums">{{ object.reservedUnits }}</p>
          </div>
        </div>
        <div
          v-if="object.level !== 'stable'"
          class="mt-4 flex items-start gap-2 border-t border-ink/8 pt-4 text-sm"
        >
          <CalendarClock
            :size="17"
            class="mt-0.5 shrink-0"
            :class="object.level === 'critical' ? 'text-risk' : 'text-[#8a590e]'"
          />
          <p class="leading-5 text-muted">
            {{
              object.level === 'critical'
                ? 'Прогноз отличается от плановой даты — проверьте затронутые сделки.'
                : 'Есть фактор риска без изменения итогового прогноза.'
            }}
          </p>
        </div>
        <RouterLink
          :to="`/construction/${object.id}`"
          class="mt-5 inline-flex rounded-lg border border-blueprint/20 px-4 py-2 text-sm font-semibold text-blueprint hover:bg-blueprint-soft"
          >Открыть объект</RouterLink
        >
      </article>
    </div>
  </div>
</template>
