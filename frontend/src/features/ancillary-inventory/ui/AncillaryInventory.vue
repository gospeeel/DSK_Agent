<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { formatCurrency } from '@/shared/lib/format'
import type { ApiAudience } from '@/shared/api/backend-contracts'
import { useAncillaryInventory } from '../model/use-ancillary-inventory'

const props = defineProps<{ buildingId: number; audience: ApiAudience; canCreate: boolean }>()
const inventory = useAncillaryInventory(() => props.buildingId, () => props.audience)
</script>

<template>
  <section class="rounded-xl border border-ink/10 bg-sheet p-5">
    <h2 class="text-lg font-semibold">Парковки и кладовые</h2>
    <p class="mt-1 text-sm text-muted">Самостоятельные позиции каталога с актуальной ценой и статусом.</p>
    <ApiState :pending="inventory.units.isPending.value" :error="inventory.units.error.value" :empty="!inventory.available.value.length" empty-text="Свободных парковок и кладовых пока нет." @retry="inventory.units.refetch()">
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <article v-for="unit in inventory.available.value" :key="unit.id" class="border-l-2 border-accent bg-paper px-4 py-3">
          <p class="font-semibold">{{ unit.kind === 'parking' ? 'Машино-место' : 'Кладовая' }} № {{ unit.number }}</p>
          <p class="mt-1 text-sm text-muted">{{ unit.area ? `${unit.area} м² · ` : '' }}{{ formatCurrency(unit.price) }}</p>
        </article>
      </div>
    </ApiState>
    <details v-if="canCreate" class="mt-5 border-t border-ink/10 pt-4">
      <summary class="cursor-pointer font-semibold">Добавить позицию</summary>
    <form class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="inventory.create.mutate()">
      <label class="text-sm">Тип<select v-model="inventory.draft.kind" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="parking">Парковка</option><option value="storage">Кладовая</option></select></label>
      <label class="text-sm">Номер<input v-model="inventory.draft.number" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="text-sm">Площадь, м²<input v-model.number="inventory.draft.area" type="number" min="0" step="0.1" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="text-sm">Цена, ₽<input v-model.number="inventory.draft.price" type="number" min="0" step="1000" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <div class="sm:col-span-2 lg:col-span-4"><button :disabled="inventory.create.isPending.value" class="rounded-lg bg-blueprint px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Добавить позицию</button><p v-if="inventory.create.error.value" role="alert" class="mt-3 text-sm text-risk">{{ inventory.create.error.value.message }}</p></div>
    </form></details>
  </section>
</template>
