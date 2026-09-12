<script setup lang="ts">
import { ArrowRight, Building2, CircleAlert, Sparkles, UserRound } from '@lucide/vue'

import type { ConstructionEvent } from '@/entities/construction'
import { pluralizeClients } from '@/shared/lib/format'
import { StatusBadge } from '@/shared/ui'

defineProps<{ event: ConstructionEvent }>()
</script>

<template>
  <article
    class="overflow-hidden rounded-2xl bg-blueprint text-white shadow-[0_18px_45px_rgba(23,63,95,0.16)]"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-4 border-b border-white/12 px-5 py-4 sm:px-6"
    >
      <div class="flex items-center gap-3">
        <CircleAlert :size="19" class="text-signal" aria-hidden="true" />
        <p class="text-sm font-semibold">Событие требует решения</p>
      </div>
      <StatusBadge tone="warning-inverse" :label="`Обнаружено ${event.detectedAt}`" />
    </div>

    <div class="grid gap-px bg-white/12 lg:grid-cols-[1.15fr_1fr_0.8fr_1fr]">
      <div class="bg-blueprint px-5 py-5 sm:px-6">
        <div class="flex items-center gap-2 text-xs font-medium text-white/55">
          <Building2 :size="15" /> {{ event.object }}
        </div>
        <p class="mt-3 text-lg leading-6 font-semibold tracking-[-0.02em]">{{ event.title }}</p>
        <p class="mt-2 text-sm leading-5 text-white/62">{{ event.project }}</p>
      </div>
      <div class="relative bg-blueprint px-5 py-5 sm:px-6">
        <ArrowRight
          class="absolute top-1/2 -left-3 z-10 hidden -translate-y-1/2 rounded-full bg-signal p-1 text-ink lg:block"
          :size="24"
        />
        <p class="text-xs font-medium text-white/55">Влияние на продажи</p>
        <p class="mt-3 text-sm leading-6 text-white/88">{{ event.impact }}</p>
      </div>
      <div class="relative bg-blueprint px-5 py-5 sm:px-6">
        <ArrowRight
          class="absolute top-1/2 -left-3 z-10 hidden -translate-y-1/2 rounded-full bg-signal p-1 text-ink lg:block"
          :size="24"
        />
        <div class="flex items-center gap-2 text-xs font-medium text-white/55">
          <UserRound :size="15" /> Затронуты
        </div>
        <p class="mt-3 text-2xl font-semibold tabular-nums">
          {{ pluralizeClients(event.affectedClients) }}
        </p>
        <RouterLink
          to="/clients"
          class="mt-3 inline-block text-sm font-medium text-signal underline decoration-signal/40 underline-offset-4"
          >Открыть список</RouterLink
        >
      </div>
      <div class="relative bg-white px-5 py-5 text-ink sm:px-6">
        <ArrowRight
          class="absolute top-1/2 -left-3 z-10 hidden -translate-y-1/2 rounded-full bg-signal p-1 text-ink lg:block"
          :size="24"
        />
        <div class="flex items-center gap-2 text-xs font-semibold text-blueprint">
          <Sparkles :size="15" /> Рекомендация AI
        </div>
        <p class="mt-3 text-sm leading-6">
          Проверить клиентов со сроком въезда до сентября и подготовить резервные варианты.
        </p>
        <RouterLink
          to="/clients/c-101"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-signal px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-[#f0b14f]"
          >Начать с Анны <ArrowRight :size="15"
        /></RouterLink>
      </div>
    </div>
  </article>
</template>
