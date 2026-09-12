<script setup lang="ts">
import { Search } from '@lucide/vue'

const query = defineModel<string>('query', { required: true })
const stage = defineModel<string>('stage', { required: true })

const stages = ['Все сделки', 'Новый', 'Подбор', 'Переговоры', 'Бронь', 'Оформление']
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row">
    <label class="relative flex-1">
      <span class="sr-only">Поиск клиентов</span>
      <Search
        class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
        :size="18"
        aria-hidden="true"
      />
      <input
        v-model="query"
        class="h-11 w-full rounded-lg border border-ink/12 bg-white pr-4 pl-11 text-sm text-ink placeholder:text-muted/70 focus:border-blueprint"
        type="search"
        placeholder="Имя, телефон, квартира или объект"
      />
    </label>
    <label>
      <span class="sr-only">Этап сделки</span>
      <select
        v-model="stage"
        class="h-11 min-w-44 rounded-lg border border-ink/12 bg-white px-3 text-sm text-ink focus:border-blueprint"
      >
        <option v-for="item in stages" :key="item">{{ item }}</option>
      </select>
    </label>
  </div>
</template>
