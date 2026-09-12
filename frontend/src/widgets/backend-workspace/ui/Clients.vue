<script setup lang="ts">
defineOptions({ name: 'BackendClients' })
import ApiState from '@/shared/ui/ApiState.vue'
import { useClients } from '../model/clients'
const { search, filtered, pending, error, retry } = useClients()
</script>
<template>
  <section class="rounded-xl border border-ink/10 bg-sheet p-5">
    <label class="block text-sm"
      >Поиск клиента<input
        v-model="search"
        placeholder="Имя или электронная почта"
        class="mt-2 h-11 w-full max-w-lg rounded-lg border border-ink/20 px-3" /></label
    ><ApiState
      :pending="pending && !error"
      :error="error"
      :empty="!filtered.length"
      empty-text="Клиенты не найдены. Гостевые заявки доступны в обращениях."
      @retry="retry"
      ><article
        v-for="client in filtered"
        :key="client.id"
        class="border-b border-ink/10 py-4 last:border-0"
      >
        <RouterLink
          :to="`/clients/${client.id}`"
          class="font-semibold text-blueprint hover:underline"
          >{{ client.name }}</RouterLink
        >
        <p class="mt-1 break-all text-sm text-muted">{{ client.email }}</p>
      </article></ApiState
    >
  </section>
</template>
