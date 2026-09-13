<script setup lang="ts">
import { ConstructionWorkspace } from '@/widgets/construction-workspace'
defineProps<{ objectId: string }>()
</script>
<template><ConstructionWorkspace :object-id="objectId" /></template>
