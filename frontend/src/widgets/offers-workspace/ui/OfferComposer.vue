<script setup lang="ts">
import type { ApiAncillaryUnit, ApiDeal, ApiOfferCalculation } from '@/shared/api/backend-contracts'
import { formatCurrency } from '@/shared/lib/format'

defineProps<{
  deals: ApiDeal[]
  selectedDealId: number | null
  discount: string
  parkingUnits: ApiAncillaryUnit[]
  storageUnits: ApiAncillaryUnit[]
  parkingUnitId: number | null
  storageUnitId: number | null
  ancillaryPending: boolean
  calculation?: ApiOfferCalculation
  pending: boolean
  error?: Error | null
}>()
const emit = defineEmits<{
  'update:selectedDealId': [value: number]
  'update:discount': [value: string]
  'update:parkingUnitId': [value: number | null]
  'update:storageUnitId': [value: number | null]
  calculate: []
  generate: []
}>()
</script>

<template>
  <section class="rounded-xl border border-ink/10 bg-sheet p-5 sm:p-6">
    <h2 class="text-xl font-semibold">Новое коммерческое предложение</h2>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
      Цена и допустимая скидка проверяются сервером. AI использует данные выбранной сделки и
      переписку клиента.
    </p>
    <div class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
      <label class="text-sm">
        Сделка
        <select
          :value="selectedDealId ?? ''"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"
          @change="
            emit('update:selectedDealId', Number(($event.target as HTMLSelectElement).value))
          "
        >
          <option value="" disabled>Выберите сделку</option>
          <option v-for="deal in deals" :key="deal.id" :value="deal.id">
            № {{ deal.id }} · {{ deal.user_name || `Клиент ${deal.id_user}` }} ·
            {{ formatCurrency(deal.base_price) }}
          </option>
        </select>
      </label>
      <label class="text-sm">
        Скидка, %
        <input
          :value="discount"
          inputmode="decimal"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3 tabular-nums"
          @input="emit('update:discount', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <label class="text-sm">
        Машино-место
        <select
          :value="parkingUnitId ?? ''"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3 disabled:opacity-60"
          :disabled="ancillaryPending || !selectedDealId"
          @change="
            emit(
              'update:parkingUnitId',
              ($event.target as HTMLSelectElement).value
                ? Number(($event.target as HTMLSelectElement).value)
                : null,
            )
          "
        >
          <option value="">Без парковки</option>
          <option v-for="unit in parkingUnits" :key="unit.id" :value="unit.id">
            № {{ unit.number }} · {{ formatCurrency(unit.price) }}
          </option>
        </select>
      </label>
      <label class="text-sm">
        Кладовая
        <select
          :value="storageUnitId ?? ''"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3 disabled:opacity-60"
          :disabled="ancillaryPending || !selectedDealId"
          @change="
            emit(
              'update:storageUnitId',
              ($event.target as HTMLSelectElement).value
                ? Number(($event.target as HTMLSelectElement).value)
                : null,
            )
          "
        >
          <option value="">Без кладовой</option>
          <option v-for="unit in storageUnits" :key="unit.id" :value="unit.id">
            № {{ unit.number }} · {{ formatCurrency(unit.price) }}
          </option>
        </select>
      </label>
    </div>
    <div
      v-if="calculation"
      class="mt-5 grid gap-3 border-y border-ink/10 py-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <p class="text-xs text-muted">Цена квартиры</p>
        <p class="mt-1 font-semibold tabular-nums">
          {{ formatCurrency(calculation.apartment_price) }}
        </p>
      </div>
      <div v-if="calculation.parking_unit_id || calculation.storage_unit_id">
        <p class="text-xs text-muted">Дополнительные объекты</p>
        <p class="mt-1 font-semibold tabular-nums">
          {{ formatCurrency(calculation.parking_price + calculation.storage_price) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted">Итоговая цена</p>
        <p class="mt-1 font-semibold tabular-nums">{{ formatCurrency(calculation.final_price) }}</p>
      </div>
      <div>
        <p class="text-xs text-muted">Решение</p>
        <p class="mt-1 font-semibold">
          {{ calculation.requires_approval ? 'Нужно согласование' : 'В пределах лимита' }}
        </p>
      </div>
    </div>
    <div class="mt-5 flex flex-wrap gap-3">
      <button
        type="button"
        class="rounded-lg border border-ink/20 px-4 py-3 text-sm font-semibold text-blueprint disabled:opacity-50"
        :disabled="pending || !selectedDealId"
        @click="emit('calculate')"
      >
        Проверить расчёт
      </button>
      <button
        type="button"
        class="rounded-lg bg-blueprint px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        :disabled="pending || !selectedDealId || !calculation"
        @click="emit('generate')"
      >
        {{ pending ? 'Формируем…' : 'Сформировать с AI' }}
      </button>
    </div>
    <p v-if="error" role="alert" class="mt-4 text-sm text-risk">{{ error.message }}</p>
  </section>
</template>
