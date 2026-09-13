<script setup lang="ts">
import type { ApiApartment, ApiRole } from '@/shared/api/backend-contracts'
import { useApartmentEditor } from '../model/use-apartment-editor'
const props = defineProps<{ apartment: ApiApartment; role?: ApiRole }>()
const editor = useApartmentEditor(() => props.apartment, () => props.role)
</script>

<template>
  <div v-if="role === 'supervisor'" class="mt-4">
    <button v-if="!editor.open.value" class="rounded-lg border border-ink/20 px-4 py-2 text-sm hover:bg-paper" @click="editor.start">Редактировать квартиру</button>
    <form v-else class="grid gap-4 rounded-xl bg-paper p-4 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="editor.save.mutate()">
      <fieldset :disabled="editor.save.isPending.value" class="contents">
      <label class="text-sm font-medium">Номер<input v-model="editor.form.number" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Комнат<input v-model.number="editor.form.rooms" required type="number" min="1" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Этаж<input v-model.number="editor.form.floor" required type="number" min="1" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Площадь, м²<input v-model.number="editor.form.area" required type="number" min="1" step="0.1" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Цена, ₽<input v-model.number="editor.form.price" required type="number" min="1" step="1000" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Отделка<select v-model="editor.form.typeFinishing" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3"><option value="rough">Без отделки</option><option value="white_box">White box</option><option value="turnkey">Чистовая</option></select></label>
      <label class="text-sm font-medium">Статус<select v-model="editor.form.status" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3"><option value="free">В продаже</option><option value="booked">Бронь</option><option value="sold">Продана</option></select></label>
      <div class="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3">
        <button :disabled="editor.save.isPending.value" class="rounded-lg bg-blueprint px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-55">{{ editor.save.isPending.value ? 'Сохраняем…' : 'Сохранить квартиру' }}</button>
        <button type="button" :disabled="editor.save.isPending.value" class="rounded-lg border border-ink/20 px-4 py-2.5 text-sm" @click="editor.open.value = false">Отмена</button>
      </div>
      </fieldset>
      <p v-if="editor.save.error.value" role="alert" class="text-sm text-risk sm:col-span-2 lg:col-span-3">{{ editor.save.error.value.message }}</p>
    </form>
    <p v-if="editor.save.isSuccess.value && !editor.open.value" role="status" class="mt-2 text-sm text-safe">Квартира сохранена.</p>
  </div>
</template>
