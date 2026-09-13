<script setup lang="ts">
import { reactive, shallowRef, watch } from 'vue'
import type { ApiAncillaryUnit } from '@/shared/api/backend-contracts'

const props = defineProps<{ unit: ApiAncillaryUnit; pending: boolean }>()
const emit = defineEmits<{ save: [unit: ApiAncillaryUnit] }>()
const open = shallowRef(false)
const form = reactive({ number: '', kind: 'parking' as ApiAncillaryUnit['kind'], area: null as number | null, price: 0, status: 'free' as ApiAncillaryUnit['status'] })
const reset = () => Object.assign(form, { number: props.unit.number, kind: props.unit.kind, area: props.unit.area ?? null, price: props.unit.price, status: props.unit.status })
watch(() => props.unit, () => { reset(); open.value = false }, { immediate: true })
const submit = () => emit('save', { ...props.unit, number: form.number.trim(), kind: form.kind, area: form.area, price: form.price, status: form.status })
</script>

<template>
  <button v-if="!open" class="mt-3 rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-sheet" @click="open = true">Редактировать</button>
  <form v-else class="mt-3 grid gap-3 border-t border-ink/10 pt-3 sm:col-span-4" @submit.prevent="submit">
    <fieldset :disabled="pending" class="contents">
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="text-sm">Тип<select v-model="form.kind" class="mt-1 h-10 w-full rounded-lg border border-ink/20 bg-sheet px-3"><option value="parking">Парковка</option><option value="storage">Кладовая</option></select></label>
      <label class="text-sm">Номер<input v-model="form.number" required class="mt-1 h-10 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm">Площадь, м²<input v-model.number="form.area" type="number" min="0" step="0.1" class="mt-1 h-10 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm">Цена, ₽<input v-model.number="form.price" required type="number" min="0" step="1000" class="mt-1 h-10 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm sm:col-span-2">Статус<select v-model="form.status" class="mt-1 h-10 w-full rounded-lg border border-ink/20 bg-sheet px-3"><option value="free">Свободна</option><option value="booked">Бронь</option><option value="sold">Продана</option></select></label>
    </div>
    <div class="flex gap-2"><button :disabled="pending" class="rounded-lg bg-blueprint px-3 py-2 text-sm font-semibold text-white disabled:opacity-55">{{ pending ? 'Сохраняем…' : 'Сохранить' }}</button><button type="button" :disabled="pending" class="rounded-lg border border-ink/20 px-3 py-2 text-sm" @click="reset(); open = false">Отмена</button></div>
    </fieldset>
  </form>
</template>
