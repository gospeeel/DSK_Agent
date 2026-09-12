<script setup lang="ts">
import { Inbox } from '@lucide/vue'

defineProps<{ title: string; text: string }>()
</script>

<template>
  <div
    class="grid min-h-48 place-items-center rounded-xl border border-dashed border-blueprint/25 bg-blueprint/3 px-6 text-center"
  >
    <div>
      <Inbox :size="28" class="mx-auto mb-3 text-blueprint/55" aria-hidden="true" />
      <p class="font-semibold text-ink">{{ title }}</p>
      <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{{ text }}</p>
    </div>
  </div>
</template>
