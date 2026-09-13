<script setup lang="ts">
import {
  Overview,
  Correspondence,
  Deals,
  Clients,
  ClientDetails,
  AiAssistant,
  Profile,
} from '@/widgets/backend-workspace'
import { OffersWorkspace } from '@/widgets/offers-workspace'
import { CompetitorWorkspace } from '@/widgets/competitor-workspace'
import { TeamWorkspace } from '@/widgets/team-workspace'
defineProps<{ screen: string; clientId?: string }>()
</script>
<template>
  <Overview v-if="screen === 'overview'" /><Correspondence
    v-else-if="screen === 'conversations'"
  /><Deals v-else-if="screen === 'deals'" /><Clients
    v-else-if="screen === 'clients'"
  /><ClientDetails v-else-if="screen === 'client'" :client-id="clientId ?? ''" /><AiAssistant
    v-else-if="screen === 'ai'"
  /><Profile v-else-if="screen === 'profile'" /><CompetitorWorkspace
    v-else-if="screen === 'competitors'"
  /><TeamWorkspace v-else-if="screen === 'team'" /><OffersWorkspace v-else />
</template>
