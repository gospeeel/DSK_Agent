<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { DskMark } from '@/shared/ui'
import type { ApiAudience } from '@/shared/api/backend-contracts'
import { useSessionStore } from '../model/session.store'
const session = useSessionStore()
const router = useRouter()
const audience = shallowRef<ApiAudience>('staff')
const registering = shallowRef(false)
const email = shallowRef('')
const password = shallowRef('')
const name = shallowRef('')
const submit = async () => {
  const ok =
    registering.value && audience.value === 'user'
      ? await session.register(name.value.trim(), email.value.trim(), password.value)
      : await session.signIn(audience.value, email.value.trim(), password.value)
  if (ok) {
    password.value = ''
    await router.replace('/')
  }
}
</script>
<template>
  <main class="grid min-h-screen place-items-center bg-paper p-5">
    <form
      class="w-full max-w-md rounded-2xl border border-ink/10 bg-sheet p-7"
      @submit.prevent="submit"
    >
      <DskMark variant="full" class="mb-6" />
      <h1 class="text-2xl font-semibold">
        {{ registering && audience === 'user' ? 'Регистрация клиента' : 'Вход в портал' }}
      </h1>
      <label class="mt-5 block text-sm"
        >Кабинет<select
          v-model="audience"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"
          :disabled="session.busy"
        >
          <option value="staff">Сотрудник ДСК</option>
          <option value="user">Клиент</option>
        </select></label
      >
      <label v-if="registering && audience === 'user'" class="mt-4 block text-sm"
        >Имя<input
          v-model="name"
          required
          autocomplete="name"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
      /></label>
      <label class="mt-4 block text-sm"
        >Электронная почта<input
          v-model="email"
          required
          type="email"
          autocomplete="username"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
      /></label>
      <label class="mt-4 block text-sm"
        >Пароль<input
          v-model="password"
          required
          type="password"
          :autocomplete="registering ? 'new-password' : 'current-password'"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
      /></label>
      <p v-if="session.error" role="alert" class="mt-4 text-sm text-risk">{{ session.error }}</p>
      <button
        :disabled="session.busy"
        class="mt-6 h-11 w-full rounded-lg bg-blueprint font-semibold text-white disabled:opacity-50"
      >
        {{
          session.busy
            ? 'Подождите…'
            : registering && audience === 'user'
              ? 'Создать аккаунт'
              : 'Войти'
        }}
      </button>
      <button
        v-if="audience === 'user'"
        type="button"
        class="mt-3 w-full rounded py-2 text-sm text-blueprint"
        @click="registering = !registering"
      >
        {{ registering ? 'Уже есть аккаунт' : 'Зарегистрироваться' }}
      </button>
    </form>
  </main>
</template>
