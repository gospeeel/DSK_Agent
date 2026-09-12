<script setup lang="ts">
import { BackendCatalog } from '@/widgets/backend-catalog'
defineProps<{ objectId?: string }>()
</script>
<template><BackendCatalog :object-id="objectId" /></template>
