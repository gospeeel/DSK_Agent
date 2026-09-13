<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { formatCurrency } from '@/shared/lib/format'
import type { ApiAudience } from '@/shared/api/backend-contracts'
import { useAncillaryInventory } from '../model/use-ancillary-inventory'
import AncillaryUnitEditor from './AncillaryUnitEditor.vue'

const props = defineProps<{ buildingId: number; audience: ApiAudience; canCreate: boolean; canEdit?: boolean }>()
const inventory = useAncillaryInventory(() => props.buildingId, () => props.audience)
</script>

<template>
  <section class="rounded-xl border border-ink/10 bg-sheet p-5">
    <h2 class="text-lg font-semibold">Парковки и кладовые</h2>
    <p class="mt-1 text-sm text-muted">Самостоятельные позиции каталога с актуальной ценой и статусом.</p>
    <ApiState :pending="inventory.units.isPending.value" :error="inventory.units.error.value" :empty="!inventory.units.data.value?.length" empty-text="Парковки и кладовые пока не добавлены." @retry="inventory.units.refetch()">
      <div class="mt-4 space-y-3 sm:space-y-0 sm:divide-y sm:divide-ink/10 sm:border-y sm:border-ink/10">
        <article v-for="unit in inventory.units.data.value" :key="unit.id" class="rounded-xl bg-paper px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-5 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-4">
          <div><p class="font-semibold">{{ unit.kind === 'parking' ? 'Машино-место' : 'Кладовая' }} № {{ unit.number }}</p><p class="mt-1 text-sm text-muted">{{ unit.area ? `${unit.area} м²` : 'Площадь не указана' }}</p></div>
          <p class="mt-2 text-sm font-semibold tabular-nums sm:mt-0">{{ formatCurrency(unit.price) }}</p>
          <p class="mt-2 text-xs font-semibold sm:mt-0" :class="unit.status === 'free' ? 'text-safe' : 'text-muted'">{{ { free: 'Свободна', booked: 'Бронь', sold: 'Продана' }[unit.status] }}</p>
          <AncillaryUnitEditor v-if="canEdit" :unit="unit" :pending="inventory.update.isPending.value" @save="inventory.update.mutate($event)" />
        </article>
      </div>
      <p v-if="inventory.update.error.value" role="alert" class="mt-3 text-sm text-risk">{{ inventory.update.error.value.message }}</p>
      <p v-if="inventory.update.isSuccess.value" role="status" class="mt-3 text-sm text-safe">Позиция каталога сохранена.</p>
    </ApiState>
    <details v-if="canCreate" class="mt-5 border-t border-ink/10 pt-4">
      <summary class="cursor-pointer font-semibold">Добавить позицию</summary>
    <form class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="inventory.create.mutate()">
      <fieldset :disabled="inventory.create.isPending.value" class="contents">
      <label class="text-sm">Тип<select v-model="inventory.draft.kind" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="parking">Парковка</option><option value="storage">Кладовая</option></select></label>
      <label class="text-sm">Номер<input v-model="inventory.draft.number" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="text-sm">Площадь, м²<input v-model.number="inventory.draft.area" type="number" min="0" step="0.1" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="text-sm">Цена, ₽<input v-model.number="inventory.draft.price" type="number" min="0" step="1000" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <div class="sm:col-span-2 lg:col-span-4"><button class="rounded-lg bg-blueprint px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{{ inventory.create.isPending.value ? 'Добавляем…' : 'Добавить позицию' }}</button></div>
      </fieldset>
      <p v-if="inventory.create.error.value" role="alert" class="text-sm text-risk sm:col-span-2 lg:col-span-4">{{ inventory.create.error.value.message }}</p>
      <p v-if="inventory.create.isSuccess.value" role="status" class="text-sm text-safe sm:col-span-2 lg:col-span-4">Позиция добавлена в каталог.</p>
    </form></details>
  </section>
</template>
