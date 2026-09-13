<script setup lang="ts">
import { useStaffManagement } from '../model/use-staff-management'

const { staff, employees, form, create } = useStaffManagement()
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
    <section class="overflow-hidden rounded-xl border border-ink/10 bg-sheet">
      <div class="border-b border-ink/10 px-5 py-4">
        <h2 class="text-lg font-semibold">Сотрудники отдела</h2>
        <p class="mt-1 text-sm text-muted">Руководители видят весь отдел, менеджеры — свои сделки и клиентов.</p>
      </div>
      <div v-if="staff.isPending.value" class="space-y-3 p-5" aria-label="Загрузка сотрудников">
        <div v-for="item in 3" :key="item" class="h-14 animate-pulse rounded-lg bg-paper" />
      </div>
      <div v-else-if="staff.error.value" class="p-5">
        <p role="alert" class="text-sm text-risk">{{ staff.error.value.message }}</p>
        <button class="mt-3 rounded-lg border border-ink/20 px-4 py-2 text-sm" @click="staff.refetch()">Повторить</button>
      </div>
      <div v-else-if="!employees.length" class="p-5 text-sm text-muted">Сотрудники ещё не добавлены.</div>
      <div v-else class="divide-y divide-ink/10">
        <article v-for="employee in employees" :key="employee.id" class="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ employee.name }}</p>
            <p class="mt-1 truncate text-sm text-muted">{{ employee.email }}</p>
          </div>
          <span class="mt-2 w-fit rounded-full bg-blueprint-soft px-3 py-1 text-xs font-semibold text-blueprint sm:mt-0">
            {{ employee.role === 'supervisor' ? 'Руководитель' : 'Менеджер' }}
          </span>
        </article>
      </div>
    </section>

    <section class="h-fit rounded-xl border border-ink/10 bg-sheet p-5 xl:sticky xl:top-28">
      <h2 class="text-lg font-semibold">Новый сотрудник</h2>
      <p class="mt-1 text-sm text-muted">После создания сотрудник сможет войти по указанной почте и паролю.</p>
      <form class="mt-5 space-y-4" @submit.prevent="create.mutate()">
        <label class="block text-sm font-medium">Имя и фамилия
          <input v-model="form.name" required autocomplete="name" :disabled="create.isPending.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/15" />
        </label>
        <label class="block text-sm font-medium">Рабочая почта
          <input v-model="form.email" required type="email" autocomplete="email" :disabled="create.isPending.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/15" />
        </label>
        <label class="block text-sm font-medium">Роль
          <select v-model="form.role" :disabled="create.isPending.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/15">
            <option value="manager">Менеджер продаж</option>
            <option value="supervisor">Руководитель отдела</option>
          </select>
        </label>
        <label class="block text-sm font-medium">Временный пароль
          <input v-model="form.password" required type="password" minlength="8" autocomplete="new-password" :disabled="create.isPending.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-sheet px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/15" />
        </label>
        <button :disabled="create.isPending.value" class="h-11 w-full rounded-lg bg-blueprint px-4 text-sm font-semibold text-white transition-colors hover:bg-blueprint/90 disabled:cursor-wait disabled:opacity-55">
          {{ create.isPending.value ? 'Создаём…' : 'Создать сотрудника' }}
        </button>
        <p v-if="create.error.value" role="alert" class="text-sm text-risk">{{ create.error.value.message }}</p>
        <p v-if="create.isSuccess.value" role="status" class="text-sm text-safe">Сотрудник создан и добавлен в отдел.</p>
      </form>
    </section>
  </div>
</template>
