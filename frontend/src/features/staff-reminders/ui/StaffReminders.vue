<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { useStaffReminders } from '../model/use-staff-reminders'
const reminders = useStaffReminders()
</script>
<template>
  <section class="rounded-xl border border-ink/10 bg-sheet p-5">
    <div class="flex flex-wrap items-baseline justify-between gap-3"><h2 class="text-lg font-semibold">Напоминания</h2><span class="text-sm text-muted">{{ reminders.open.value.length }} активных</span></div>
    <ApiState :pending="reminders.reminders.isPending.value" :error="reminders.reminders.error.value" :empty="!reminders.open.value.length" empty-text="Активных напоминаний нет." @retry="reminders.reminders.refetch()">
      <div class="mt-3 divide-y divide-ink/10"><article v-for="item in reminders.open.value" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 py-3"><div><p class="font-semibold">{{ item.title }}</p><p class="mt-1 text-sm text-muted">До {{ new Date(item.due_at).toLocaleString('ru-RU') }}</p></div><button :disabled="reminders.complete.isPending.value" class="rounded-lg border border-ink/20 px-3 py-2 text-sm" @click="reminders.complete.mutate(item.id)">Выполнено</button></article></div>
    </ApiState>
    <form class="mt-4 grid gap-3 border-t border-ink/10 pt-4 sm:grid-cols-[1fr_13rem_auto] sm:items-end" @submit.prevent="reminders.create.mutate()">
      <label class="text-sm">Что напомнить<input v-model="reminders.title.value" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="text-sm">Срок<input v-model="reminders.dueAt.value" required type="datetime-local" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <button :disabled="reminders.create.isPending.value" class="h-11 rounded-lg bg-blueprint px-4 text-sm font-semibold text-white disabled:opacity-50">Добавить</button>
      <label v-if="reminders.session.user?.role === 'supervisor'" class="text-sm sm:col-span-2">Исполнитель<select v-model="reminders.assignedTo.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option v-for="employee in reminders.employees.data.value" :key="employee.id" :value="employee.id">{{ employee.name }}</option></select></label>
      <p v-if="reminders.create.error.value || reminders.complete.error.value" role="alert" class="text-sm text-risk sm:col-span-3">{{ reminders.create.error.value?.message || reminders.complete.error.value?.message }}</p>
    </form>
  </section>
</template>
