<script setup lang="ts">
import type { ApiComplex, ApiRole } from '@/shared/api/backend-contracts'
import { useComplexEditor } from '../model/use-complex-editor'
const props = defineProps<{ complex: ApiComplex; role?: ApiRole }>()
const editor = useComplexEditor(() => props.complex, () => props.role)
</script>

<template>
  <div v-if="role === 'supervisor'" class="mt-4">
    <button v-if="!editor.open.value" class="rounded-lg border border-ink/20 px-4 py-2 text-sm hover:bg-paper" @click="editor.start">Редактировать ЖК</button>
    <form v-else class="grid max-w-3xl gap-4 rounded-xl bg-paper p-4 sm:grid-cols-2" @submit.prevent="editor.save.mutate()">
      <label class="text-sm font-medium">Название<input v-model="editor.form.name" required :disabled="editor.save.isPending.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium">Адрес<input v-model="editor.form.address" required :disabled="editor.save.isPending.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3" /></label>
      <label class="text-sm font-medium sm:col-span-2">Описание<textarea v-model="editor.form.description" rows="3" :disabled="editor.save.isPending.value" class="mt-2 w-full rounded-lg border border-ink/20 bg-sheet p-3" /></label>
      <div class="flex flex-wrap gap-3 sm:col-span-2">
        <button :disabled="editor.save.isPending.value" class="rounded-lg bg-blueprint px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-55">{{ editor.save.isPending.value ? 'Сохраняем…' : 'Сохранить ЖК' }}</button>
        <button type="button" :disabled="editor.save.isPending.value" class="rounded-lg border border-ink/20 px-4 py-2.5 text-sm" @click="editor.open.value = false">Отмена</button>
      </div>
      <p v-if="editor.save.error.value" role="alert" class="text-sm text-risk sm:col-span-2">{{ editor.save.error.value.message }}</p>
    </form>
    <p v-if="editor.save.isSuccess.value && !editor.open.value" role="status" class="mt-2 text-sm text-safe">Данные ЖК сохранены.</p>
  </div>
</template>
