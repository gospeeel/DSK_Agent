<script setup lang="ts">
import { shallowRef } from 'vue'
import { useCreateCatalogEntry, type CatalogEntryKind } from '../model/use-create-catalog-entry'

const props = defineProps<{ complexId: number | null; buildingId: number | null }>()
const kind = shallowRef<CatalogEntryKind>('apartment')
const form = useCreateCatalogEntry()
</script>

<template>
  <details class="mt-5 rounded-xl border border-ink/15 bg-paper p-4">
    <summary class="cursor-pointer font-semibold">Добавить данные в каталог</summary>
    <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="form.create.mutate({ kind, complexId: props.complexId, buildingId: props.buildingId })">
      <label class="text-sm">Тип записи
        <select v-model="kind" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3">
          <option value="complex">Жилой комплекс</option>
          <option value="building">Корпус</option>
          <option value="apartment">Квартира</option>
          <option value="progress">Этап строительства</option>
        </select>
      </label>
      <template v-if="kind === 'complex'">
        <label class="text-sm">Название<input v-model="form.complex.name" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Адрес<input v-model="form.complex.address" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm sm:col-span-2">Описание<textarea v-model="form.complex.description" rows="3" class="mt-2 w-full rounded-lg border border-ink/20 p-3" /></label>
      </template>
      <template v-else-if="kind === 'building'">
        <label class="text-sm">Адрес корпуса<input v-model="form.building.address" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Район<input v-model="form.building.district" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Этажей<input v-model.number="form.building.floors_count" type="number" min="1" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Плановая сдача<input v-model="form.building.planned_date" type="date" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      </template>
      <template v-else-if="kind === 'apartment'">
        <label class="text-sm">Номер<input v-model="form.apartment.number" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Комнат<input v-model.number="form.apartment.rooms" type="number" min="0" max="8" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Этаж<input v-model.number="form.apartment.floor" type="number" min="1" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Площадь, м²<input v-model.number="form.apartment.area" type="number" min="1" step="0.1" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Цена, ₽<input v-model.number="form.apartment.price" type="number" min="1" step="1000" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Отделка<select v-model="form.apartment.type_finishing" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="rough">Без отделки</option><option value="white_box">White box</option><option value="turnkey">Чистовая</option></select></label>
      </template>
      <template v-else>
        <label class="text-sm">Этап<select v-model="form.progress.stage_name" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="excavation">Котлован</option><option value="foundation">Фундамент</option><option value="frame">Каркас</option><option value="roofing">Кровля</option><option value="finishing">Отделка</option></select></label>
        <label class="text-sm">Готовность, %<input v-model.number="form.progress.completion_percentage" type="number" min="0" max="100" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Плановое завершение<input v-model="form.progress.planned_end_date" type="date" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Статус<select v-model="form.progress.status" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="not_started">Не начат</option><option value="in_progress">В работе</option><option value="completed">Завершён</option><option value="delayed">Задержан</option></select></label>
        <label class="text-sm sm:col-span-2">Причина задержки<textarea v-model="form.progress.delay_reason" rows="2" class="mt-2 w-full rounded-lg border border-ink/20 p-3" /></label>
      </template>
      <div class="sm:col-span-2">
        <button :disabled="form.create.isPending.value" class="rounded-lg bg-blueprint px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Сохранить запись</button>
        <p v-if="form.create.error.value" role="alert" class="mt-3 text-sm text-risk">{{ form.create.error.value.message }}</p>
        <p v-if="form.create.isSuccess.value" role="status" class="mt-3 text-sm">Запись сохранена в backend.</p>
      </div>
    </form>
  </details>
</template>
