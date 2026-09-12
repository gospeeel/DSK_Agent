<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { useDiscountPolicies } from '../model/use-discount-policies'

const props = defineProps<{ buildingId: number }>()
const manager = useDiscountPolicies(() => props.buildingId)
const roleName = { manager: 'Менеджер', supervisor: 'Руководитель' }
</script>

<template>
  <details class="mt-5 rounded-xl border border-ink/15 bg-paper p-4">
    <summary class="cursor-pointer font-semibold">Матрица скидок корпуса</summary>
    <ApiState :pending="manager.policies.isPending.value" :error="manager.policies.error.value" @retry="manager.policies.refetch()">
      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[32rem] text-left text-sm">
          <thead class="text-muted"><tr><th class="pb-2">Роль</th><th class="pb-2">Лимит</th><th class="pb-2">Версия</th><th class="pb-2">Действует с</th></tr></thead>
          <tbody><tr v-for="policy in manager.policies.data.value" :key="policy.id" class="border-t border-ink/10"><td class="py-3">{{ roleName[policy.role] }}</td><td>{{ policy.max_discount_percent }}%</td><td>№ {{ policy.version }}</td><td>{{ new Date(policy.valid_from).toLocaleDateString('ru-RU') }}</td></tr></tbody>
        </table>
      </div>
    </ApiState>
    <form class="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_11rem_auto] sm:items-end" @submit.prevent="manager.create.mutate()">
      <label class="text-sm">Роль<select v-model="manager.role.value" class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"><option value="manager">Менеджер</option><option value="supervisor">Руководитель</option></select></label>
      <label class="text-sm">Лимит, %<input v-model="manager.maximum.value" required inputmode="decimal" pattern="\d+([.,]\d{1,2})?" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <label class="text-sm">Действует с<input v-model="manager.validFrom.value" type="date" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
      <button :disabled="manager.create.isPending.value" class="h-11 rounded-lg bg-blueprint px-4 text-sm font-semibold text-white disabled:opacity-50">Новая версия</button>
    </form>
    <p v-if="manager.create.error.value" role="alert" class="mt-3 text-sm text-risk">{{ manager.create.error.value.message }}</p>
  </details>
</template>
