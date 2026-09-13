<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tone?: 'critical' | 'warning' | 'warning-inverse' | 'stable' | 'neutral' | 'blue'
  label: string
}>()

const badgeClasses = computed(() => ({
  'border-risk/25 bg-risk/8 text-risk': props.tone === 'critical',
  'border-signal/35 bg-signal/12 text-[#7a4b08]': props.tone === 'warning',
  'border-signal/55 bg-signal/18 text-[#ffd88a]': props.tone === 'warning-inverse',
  'border-safe/25 bg-safe/8 text-safe': props.tone === 'stable',
  'border-blueprint/20 bg-blueprint-soft/55 text-blueprint': props.tone === 'blue',
  'border-ink/12 bg-ink/5 text-muted': !props.tone || props.tone === 'neutral',
}))
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap"
    :class="badgeClasses"
  >
    {{ label }}
  </span>
</template>
