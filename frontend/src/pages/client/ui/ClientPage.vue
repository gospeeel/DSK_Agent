<script setup lang="ts">
import { ClientWorkspace } from '@/widgets/client-workspace'

defineProps<{ clientId: string }>()
</script>

<template><ClientWorkspace :client-id="clientId" /></template>
