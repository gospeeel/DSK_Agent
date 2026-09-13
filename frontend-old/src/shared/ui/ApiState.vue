<script setup lang="ts">
defineProps<{ pending?: boolean; error?: Error | null; empty?: boolean; emptyText?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <p v-if="pending" role="status" class="py-6 text-sm text-muted">Загружаем данные…</p>
  <div v-else-if="error" role="alert" class="py-5 text-sm text-risk">
    <p>{{ error.message }}</p>
    <button class="mt-3 rounded border border-risk/25 px-3 py-2" @click="$emit('retry')">
      Повторить
    </button>
  </div>
  <p v-else-if="empty" class="py-6 text-sm text-muted">{{ emptyText ?? 'Данных пока нет.' }}</p>
  <slot v-else />
</template>
