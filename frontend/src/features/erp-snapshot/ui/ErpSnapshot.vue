<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { useErpSnapshot } from '../model/use-erp-snapshot'
const props = defineProps<{ buildingId: number }>()
const erp = useErpSnapshot(() => props.buildingId)
</script>
<template>
  <section class="rounded-xl border border-ink/10 bg-sheet p-5">
    <h2 class="text-lg font-semibold">Производственная сводка</h2>
    <p class="mt-1 text-sm text-muted">Имитация ERP: поставки, остатки материалов и график производства ЖБИ.</p>
    <ApiState :pending="erp.snapshot.isPending.value" :error="erp.snapshot.error.value" @retry="erp.snapshot.refetch()">
      <div class="mt-4 grid gap-4 sm:grid-cols-3">
        <div class="border-l-2 border-blueprint px-3"><p class="text-sm text-muted">События</p><p class="mt-1 text-2xl font-semibold">{{ erp.snapshot.data.value?.events.length ?? 0 }}</p></div>
        <div class="border-l-2 border-accent px-3"><p class="text-sm text-muted">Дефицитные позиции</p><p class="mt-1 text-2xl font-semibold">{{ erp.shortages.value.length }}</p></div>
        <div class="border-l-2 border-ink/30 px-3"><p class="text-sm text-muted">Производственные задачи</p><p class="mt-1 text-2xl font-semibold">{{ erp.snapshot.data.value?.production_schedules.length ?? 0 }}</p></div>
      </div>
      <div class="mt-5 divide-y divide-ink/10">
        <article v-for="item in erp.snapshot.data.value?.events ?? []" :key="item.id" class="py-3"><p class="font-semibold">{{ item.title }}</p><p class="mt-1 text-sm text-muted">{{ item.details }} · риск {{ { low: 'низкий', medium: 'средний', high: 'высокий' }[item.severity] }}</p></article>
      </div>
    </ApiState>
    <details class="mt-4 border-t border-ink/10 pt-4"><summary class="cursor-pointer font-semibold">Внести ERP-данные</summary>
      <form class="mt-4 grid gap-3 sm:grid-cols-2" @submit.prevent="erp.save.mutate()">
        <label class="text-sm">Тип данных<select v-model="erp.mode.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="event">Событие</option><option value="stock">Остаток материала</option><option value="schedule">Производственный график</option></select></label>
        <template v-if="erp.mode.value === 'event'"><label class="text-sm">Заголовок<input v-model="erp.event.title" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label><label class="text-sm sm:col-span-2">Описание<textarea v-model="erp.event.details" required rows="2" class="mt-2 w-full rounded-lg border border-ink/20 p-3" /></label><label class="text-sm">Риск<select v-model="erp.event.severity" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option></select></label><label class="flex items-center gap-2 self-end pb-3 text-sm"><input v-model="erp.event.affects_delivery" type="checkbox" /> Влияет на срок сдачи</label></template>
        <template v-else-if="erp.mode.value === 'stock'"><label class="text-sm">Материал<input v-model="erp.stock.material_name" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label><label class="text-sm">Единица<input v-model="erp.stock.unit" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label><label class="text-sm">Остаток<input v-model.number="erp.stock.quantity" type="number" min="0" step="0.001" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label><label class="text-sm">Минимум<input v-model.number="erp.stock.minimum_quantity" type="number" min="0" step="0.001" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label></template>
        <template v-else><label class="text-sm">Изделие<input v-model="erp.schedule.product_name" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label><label class="text-sm">Плановая дата<input v-model="erp.schedule.planned_date" type="date" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label><label class="text-sm">План, шт.<input v-model.number="erp.schedule.planned_quantity" type="number" min="0" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label><label class="text-sm">Выпущено, шт.<input v-model.number="erp.schedule.produced_quantity" type="number" min="0" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label></template>
        <div class="sm:col-span-2"><button :disabled="erp.save.isPending.value" class="rounded-lg bg-blueprint px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Сохранить</button><p v-if="erp.save.error.value" role="alert" class="mt-3 text-sm text-risk">{{ erp.save.error.value.message }}</p></div>
      </form>
    </details>
  </section>
</template>
