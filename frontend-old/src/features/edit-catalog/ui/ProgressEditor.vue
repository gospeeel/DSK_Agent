<script setup lang="ts">
import type { ApiProgress, ApiRole } from '@/shared/api/backend-contracts'
import { useProgressEditor } from '../model/use-progress-editor'
const props = defineProps<{ progress: ApiProgress; role?: ApiRole }>()
const editor = useProgressEditor(() => props.progress, () => props.role)
</script>

<template>
  <div v-if="role === 'supervisor'" class="mt-3">
    <button v-if="!editor.open.value" class="rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-paper" @click="editor.start">Изменить этап</button>
    <form v-else class="grid gap-3 rounded-xl bg-paper p-4 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="editor.save.mutate()">
      <fieldset :disabled="editor.save.isPending.value" class="contents">
      <label class="text-sm font-medium">Состояние<select v-model="editor.form.status" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3"><option value="not_started">Не начат</option><option value="in_progress">В работе</option><option value="completed">Завершён</option><option value="delayed">Задержан</option></select></label>
      <label class="text-sm font-medium">Готовность, %<input v-model.number="editor.form.completionPercentage" type="number" min="0" max="100" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Плановое начало<input v-model="editor.form.plannedStartDate" type="date" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Плановое окончание<input v-model="editor.form.plannedEndDate" type="date" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Фактическое начало<input v-model="editor.form.actualStartDate" type="date" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Фактическое окончание<input v-model="editor.form.actualEndDate" type="date" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Уровень риска<select v-model="editor.form.riskLevel" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3"><option :value="null">Не указан</option><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option></select></label>
      <label class="text-sm font-medium">Задержка, дней<input v-model.number="editor.form.delayDays" type="number" min="0" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium sm:col-span-2 lg:col-span-4">Причина задержки<textarea v-model="editor.form.delayReason" rows="2" class="mt-2 w-full rounded-lg border border-ink/20 bg-sheet p-3" /></label>
      <div class="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4"><button class="rounded-lg bg-blueprint px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-55">{{ editor.save.isPending.value ? 'Сохраняем…' : 'Сохранить этап' }}</button><button type="button" class="rounded-lg border border-ink/20 px-4 py-2.5 text-sm" @click="editor.open.value = false">Отмена</button></div>
      </fieldset>
      <p v-if="editor.save.error.value" role="alert" class="text-sm text-risk sm:col-span-2 lg:col-span-4">{{ editor.save.error.value.message }}</p>
    </form>
    <p v-if="editor.save.isSuccess.value && !editor.open.value" role="status" class="mt-2 text-sm text-safe">Этап строительства сохранён.</p>
  </div>
</template>
