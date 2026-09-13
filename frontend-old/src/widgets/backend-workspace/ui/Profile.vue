<script setup lang="ts">
defineOptions({ name: 'BackendProfile' })
import ApiState from '@/shared/ui/ApiState.vue'
import { useProfile } from '../model/profile'
const { form, query, update } = useProfile()
</script>
<template>
  <section class="max-w-xl rounded-xl border border-ink/10 bg-sheet p-6">
    <ApiState :pending="query.isPending.value" :error="query.error.value" @retry="query.refetch()"
      ><form @submit.prevent="update.mutate()">
        <label class="block text-sm"
          >Имя<input
            v-model="form.name"
            required
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label
        ><label class="mt-4 block text-sm"
          >Электронная почта<input
            v-model="form.email"
            required
            type="email"
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label
        ><button
          :disabled="update.isPending.value"
          class="mt-5 rounded-lg bg-blueprint px-4 py-3 text-sm text-white"
        >
          Сохранить профиль
        </button>
        <p v-if="update.isSuccess.value" role="status" class="mt-3 text-sm">Профиль сохранён.</p>
        <p v-if="update.error.value" role="alert" class="mt-3 text-sm text-risk">
          {{ update.error.value.message }}
        </p>
      </form></ApiState
    >
  </section>
</template>
