<script setup lang="ts">
import { computed } from 'vue'

import type { Apartment, ApartmentCatalog } from '@/entities/apartment'
import { getApartmentContext } from '@/entities/apartment'
import { formatCurrency } from '@/shared/lib/format'

const props = defineProps<{
  apartment?: Apartment
  catalog: ApartmentCatalog
}>()

const emit = defineEmits<{
  choose: [apartment: Apartment]
}>()

const context = computed(() =>
  props.apartment ? getApartmentContext(props.catalog, props.apartment) : undefined,
)
</script>

<template>
  <aside class="bg-sheet p-5 lg:overflow-y-auto lg:border-l lg:border-ink/10 lg:p-6">
    <div v-if="apartment">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {{ context?.building?.name }} · {{ context?.floor?.label }}
          </p>
          <h3 class="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Квартира № {{ apartment.number }}
          </h3>
        </div>
        <span
          class="rounded-md px-2 py-1 text-xs font-semibold"
          :class="apartment.status === 'available' ? 'bg-safe/10 text-safe' : 'bg-ink/8 text-muted'"
        >
          {{ apartment.status === 'available' ? 'В продаже' : 'Недоступна' }}
        </span>
      </div>

      <p class="mt-5 text-3xl font-semibold tabular-nums">{{ formatCurrency(apartment.price) }}</p>
      <p class="mt-1 text-sm text-muted">
        {{ formatCurrency(Math.round(apartment.price / apartment.area)) }} за м²
      </p>

      <dl class="mt-6 divide-y divide-ink/10 border-y border-ink/10 text-sm">
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-muted">Планировка</dt>
          <dd class="font-semibold">{{ apartment.rooms }} комн. · {{ apartment.area }} м²</dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-muted">Отделка</dt>
          <dd class="font-semibold">{{ apartment.finish }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-muted">Срок</dt>
          <dd class="font-semibold">{{ apartment.completion }}</dd>
        </div>
      </dl>

      <div class="mt-5 rounded-lg border border-safe/20 bg-safe/6 px-4 py-3">
        <p class="text-sm font-semibold">Совпадение с запросом · {{ apartment.matchScore }}%</p>
        <ul class="mt-2 space-y-1 text-sm text-muted">
          <li v-for="reason in apartment.matchReasons" :key="reason">— {{ reason }}</li>
        </ul>
      </div>

      <div
        v-if="apartment.riskText"
        class="mt-3 rounded-lg border border-signal/30 bg-signal/8 px-4 py-3"
      >
        <p class="text-sm font-semibold">Есть строительный риск</p>
        <p class="mt-1 text-sm leading-5 text-muted">{{ apartment.riskText }}</p>
      </div>

      <div class="mt-6 grid gap-2">
        <button
          class="h-12 rounded-lg bg-signal px-4 font-semibold text-ink hover:bg-[#f0b14f] disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          :disabled="apartment.status !== 'available'"
          data-testid="confirm-apartment"
          @click="emit('choose', apartment)"
        >
          Выбрать для КП
        </button>
      </div>
    </div>
    <p v-else class="text-sm text-muted">Выберите доступную квартиру на плане.</p>
  </aside>
</template>
