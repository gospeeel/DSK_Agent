<script setup lang="ts">
defineOptions({ name: 'BackendOverview' })
import { useSessionStore } from '@/features/auth-session'
import { usePlatformData } from '@/entities/platform'
import ApiState from '@/shared/ui/ApiState.vue'
import { StaffReminders } from '@/features/staff-reminders'
const session = useSessionStore()
const { sessions, visibleSessions, deals, visibleDeals } = usePlatformData(
  () => session.user,
  () => session.audience,
)
</script>
<template>
  <div class="space-y-5"><section class="rounded-xl border border-ink/10 bg-sheet p-6">
    <h2 class="text-2xl font-semibold">{{ session.user?.name }}</h2>
    <p class="mt-2 text-sm text-muted">{{ session.roleLabel }}</p>
    <div class="mt-6 grid gap-6 sm:grid-cols-2">
      <div>
        <h3 class="font-semibold">Обращения</h3>
        <ApiState
          :pending="sessions.isPending.value"
          :error="sessions.error.value"
          @retry="sessions.refetch()"
          ><p class="mt-2 text-sm">
            Всего: {{ visibleSessions.length }} · открыто:
            {{ visibleSessions.filter((s) => s.status !== 'close').length }}
          </p>
          <RouterLink
            to="/conversations"
            class="mt-3 inline-block text-sm font-semibold text-blueprint underline"
            >Открыть переписку</RouterLink
          ></ApiState
        >
      </div>
      <div>
        <h3 class="font-semibold">Сделки</h3>
        <ApiState
          :pending="deals.isPending.value"
          :error="deals.error.value"
          @retry="deals.refetch()"
          ><p class="mt-2 text-sm">{{ visibleDeals.length }} в доступном списке</p>
          <RouterLink
            to="/deals"
            class="mt-3 inline-block text-sm font-semibold text-blueprint underline"
            >Открыть сделки</RouterLink
          ></ApiState
        >
      </div>
    </div>
  </section><StaffReminders v-if="session.isStaff" /></div>
</template>
