<script setup lang="ts">
import type { ApiBuilding, ApiRole } from '@/shared/api/backend-contracts'
import { useBuildingEditor } from '../model/use-building-editor'
const props = defineProps<{ building: ApiBuilding; role?: ApiRole }>()
const { open, form, save, start } = useBuildingEditor(
  () => props.building,
  () => props.role,
)
</script>
<template>
  <div v-if="role === 'supervisor'" class="mt-5 border-t border-ink/10 pt-4">
    <button v-if="!open" class="rounded-lg border border-ink/20 px-4 py-2 text-sm" @click="start">
      Редактировать объект
    </button>
    <form v-else class="max-w-xl space-y-4" @submit.prevent="save.mutate()">
      <label class="block text-sm"
        >Адрес<input
          v-model="form.address"
          required
          :disabled="save.isPending.value"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
      /></label>
      <label class="block text-sm"
        >Район<input
          v-model="form.district"
          :disabled="save.isPending.value"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
      /></label>
      <label class="block text-sm"
        >Состояние объекта<select
          v-model="form.status"
          :disabled="save.isPending.value"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
        >
          <option value="design">Проектирование</option>
          <option value="construction">Строительство</option>
          <option value="completed">Завершён</option>
          <option value="suspended">Приостановлен</option>
        </select></label
      >
      <label class="block text-sm">Общая готовность, %<input v-model.number="form.readinessPercent" type="number" min="0" max="100" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="block text-sm">Прогнозная дата сдачи<input v-model="form.forecastDate" type="date" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="block text-sm">Сдвиг, дней<input v-model.number="form.deliveryShiftDays" type="number" min="0" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <div class="flex gap-3">
        <button
          :disabled="save.isPending.value"
          class="rounded-lg bg-blueprint px-4 py-3 text-sm text-white"
        >
          Сохранить объект</button
        ><button
          type="button"
          :disabled="save.isPending.value"
          class="rounded-lg border border-ink/20 px-4 py-3 text-sm"
          @click="open = false"
        >
          Отмена
        </button>
      </div>
    </form>
    <p v-if="save.error.value" role="alert" class="mt-3 text-sm text-risk">
      {{ save.error.value.message }}
    </p>
    <p v-if="save.isSuccess.value" role="status" class="mt-3 text-sm">Объект сохранён.</p>
  </div>
</template>
