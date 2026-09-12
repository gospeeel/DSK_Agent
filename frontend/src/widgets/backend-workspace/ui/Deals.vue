<script setup lang="ts">
defineOptions({ name: 'BackendDeals' })
import ApiState from '@/shared/ui/ApiState.vue'
import { formatCurrency } from '@/shared/lib/format'
import { useDealsWorkspace } from '../model/deals'
const workspace = useDealsWorkspace()
const statuses = {
  pending: 'Ожидает оформления',
  contract: 'Договор',
  completed: 'Завершена',
  cancelled: 'Отменена',
}
</script>
<template>
  <div class="space-y-5">
    <section v-if="workspace.session.isStaff" class="rounded-xl border border-ink/10 bg-sheet p-5">
      <h2 class="text-lg font-semibold">Открыть сделку из обращения</h2>
      <p class="mt-1 text-sm text-muted">
        Цена квартиры проверяется на сервере. Сделка связывается с исходной перепиской.
      </p>
      <form class="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem_auto] md:items-end" @submit.prevent="workspace.create.mutate()">
        <label class="text-sm">Обращение
          <select v-model="workspace.selectedSessionId.value" required class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3">
            <option :value="null" disabled>Выберите клиента и квартиру</option>
            <option v-for="item in workspace.eligibleSessions.value" :key="item.id" :value="item.id">
              № {{ item.id }} · {{ item.user_name || item.guest_name || `Клиент ${item.id_user}` }} · квартира {{ item.id_apartment }}
            </option>
          </select>
        </label>
        <label class="text-sm">Скидка, %
          <input v-model.number="workspace.discount.value" type="number" min="0" max="100" step="0.1" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" />
        </label>
        <button :disabled="workspace.create.isPending.value" class="h-11 rounded-lg bg-blueprint px-5 text-sm font-semibold text-white disabled:opacity-50">
          Открыть сделку
        </button>
      </form>
      <p v-if="workspace.create.error.value" role="alert" class="mt-3 text-sm text-risk">{{ workspace.create.error.value.message }}</p>
    </section>
    <section class="rounded-xl border border-ink/10 bg-sheet p-5">
    <ApiState
      :pending="workspace.deals.isPending.value"
      :error="workspace.deals.error.value"
      :empty="!workspace.visibleDeals.value.length"
      empty-text="Сделок пока нет."
      @retry="workspace.deals.refetch()"
      ><article
        v-for="deal in workspace.visibleDeals.value"
        :key="deal.id"
        class="grid gap-3 border-b border-ink/10 py-5 last:border-0 sm:grid-cols-3"
      >
        <div>
          <h2 class="font-semibold">Сделка № {{ deal.id }}</h2>
          <p class="mt-1 text-sm">
            {{ deal.user_name }} · Квартира {{ deal.apartment_number || `ID ${deal.id_apartment}` }}
          </p>
        </div>
        <div>
          <p class="font-semibold">{{ formatCurrency(deal.total_price) }}</p>
          <p class="mt-1 text-xs text-muted">
            Базовая: {{ formatCurrency(deal.base_price) }} · скидка {{ deal.percent_discount }}%
          </p>
        </div>
        <div class="text-sm">
          <p>{{ statuses[deal.status] }}</p>
          <div v-if="workspace.session.isStaff && workspace.allowedTransitions(deal).length" class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="status in workspace.allowedTransitions(deal)"
              :key="status"
              :disabled="workspace.update.isPending.value"
              class="rounded-lg border border-ink/20 px-3 py-2 text-xs font-semibold disabled:opacity-50"
              @click="workspace.update.mutate({ id: deal.id, status })"
            >
              {{ status === 'contract' ? 'К договору' : status === 'completed' ? 'Завершить' : 'Отменить' }}
            </button>
          </div>
        </div>
      </article></ApiState
    >
    <p v-if="workspace.update.error.value" role="alert" class="mt-3 text-sm text-risk">{{ workspace.update.error.value.message }}</p>
    </section>
  </div>
</template>
