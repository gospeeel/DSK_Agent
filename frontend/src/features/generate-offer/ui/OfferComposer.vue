<script setup lang="ts">
import { watch } from 'vue'
import { Check, FilePlus2, Send } from '@lucide/vue'

import type { Apartment } from '@/entities/apartment'
import type { Client } from '@/entities/client'
import { formatCurrency } from '@/shared/lib/format'
import { StatusBadge } from '@/shared/ui'
import { useGenerateOffer } from '../model/use-generate-offer'

const props = defineProps<{ client: Client; apartment?: Apartment | null }>()
const emit = defineEmits<{ chooseApartment: [] }>()
const composer = useGenerateOffer(props.client)
const extras = ['Чистовая отделка', 'Паркинг', 'Кладовая']

watch(
  () => props.apartment,
  (apartment) => apartment && composer.selectApartment(apartment),
)
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-blueprint/20 bg-sheet">
    <header class="flex items-center justify-between gap-4 bg-blueprint px-5 py-4 text-white">
      <div class="flex items-center gap-3">
        <FilePlus2 :size="20" class="text-signal" />
        <div>
          <h2 class="font-semibold">Новое коммерческое предложение</h2>
          <p class="mt-0.5 text-xs text-white/60">Расчёт на демонстрационных данных</p>
        </div>
      </div>
      <StatusBadge
        :tone="composer.approvalState.value === 'requires-approval' ? 'warning' : 'stable'"
        :label="
          composer.approvalState.value === 'requires-approval' ? 'Нужно согласование' : 'В лимите'
        "
      />
    </header>

    <form
      class="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]"
      @submit.prevent="composer.mutation.mutate()"
    >
      <div class="space-y-4">
        <div>
          <span class="mb-1.5 block text-xs font-semibold text-muted">Квартира</span>
          <button
            class="group flex w-full items-center justify-between gap-4 rounded-xl border border-blueprint/20 bg-white p-3 text-left transition-colors hover:border-blueprint/45 hover:bg-blueprint-soft/35"
            type="button"
            data-testid="open-apartment-selector"
            @click="emit('chooseApartment')"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="grid size-10 shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-blueprint p-2"
                aria-hidden="true"
              >
                <i class="border border-white/70" /><i class="border border-white/70" />
                <i class="col-span-2 border border-white/70" />
              </span>
              <span class="min-w-0">
                <strong class="block truncate text-sm">{{ composer.form.property }}</strong>
                <small class="mt-0.5 block text-muted">Открыть интерактивный план этажа</small>
              </span>
            </span>
            <span class="shrink-0 text-sm font-semibold text-blueprint group-hover:underline">
              Изменить
            </span>
          </button>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="mb-1.5 block text-xs font-semibold text-muted">Базовая стоимость</span
            ><input
              v-model.number="composer.form.amount"
              class="h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm tabular-nums"
              type="number"
              min="0"
          /></label>
          <label
            ><span class="mb-1.5 block text-xs font-semibold text-muted">Скидка, %</span
            ><input
              v-model.number="composer.form.discount"
              class="h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm tabular-nums"
              type="number"
              min="0"
              max="10"
              step="0.5"
          /></label>
        </div>
        <fieldset>
          <legend class="mb-2 text-xs font-semibold text-muted">Дополнительные услуги</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="extra in extras"
              :key="extra"
              class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
              :class="
                composer.form.extras.includes(extra)
                  ? 'border-blueprint bg-blueprint text-white'
                  : 'border-ink/12 bg-white text-ink hover:border-blueprint/35'
              "
              type="button"
              @click="composer.toggleExtra(extra)"
            >
              <Check v-if="composer.form.extras.includes(extra)" :size="14" />{{ extra }}
            </button>
          </div>
        </fieldset>
      </div>

      <aside class="rounded-xl bg-paper p-4">
        <p class="text-xs font-semibold text-muted">Итог для клиента</p>
        <p class="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
          {{ formatCurrency(composer.finalAmount.value) }}
        </p>
        <div class="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Скидка</span
            ><span class="font-medium tabular-nums"
              >−{{ formatCurrency(composer.discountAmount.value) }}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Услуги</span
            ><span class="font-medium">{{ composer.form.extras.length }}</span>
          </div>
        </div>
        <button
          class="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-signal font-semibold text-ink transition-colors hover:bg-[#f0b14f] disabled:cursor-wait disabled:opacity-60"
          type="submit"
          :disabled="composer.mutation.isPending.value"
        >
          <Send :size="17" />{{
            composer.mutation.isPending.value
              ? 'Формируем…'
              : composer.approvalState.value === 'requires-approval'
                ? 'Отправить на согласование'
                : 'Создать черновик'
          }}
        </button>
        <p v-if="composer.mutation.isSuccess.value" class="mt-3 text-sm font-medium text-safe">
          Предложение {{ composer.mutation.data.value?.id }} создано.
        </p>
        <p v-if="composer.mutation.isError.value" class="mt-3 text-sm font-medium text-risk">
          Не удалось создать предложение. Проверьте данные и повторите.
        </p>
      </aside>
    </form>
  </section>
</template>
