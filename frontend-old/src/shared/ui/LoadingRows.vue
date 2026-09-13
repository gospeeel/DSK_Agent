<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <div class="animate-pulse space-y-3" aria-label="Загрузка данных" role="status">
    <div v-for="row in rows" :key="row" class="h-16 rounded-xl bg-blueprint/7" />
  </div>
</template>
