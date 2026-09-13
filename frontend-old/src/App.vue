<script setup lang="ts">
import { RouterView } from 'vue-router'

import { useSessionStore } from '@/features/auth-session'
import { AppShell } from '@/widgets/app-shell'

const session = useSessionStore()
</script>

<template>
  <AppShell v-if="session.isAuthenticated">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
