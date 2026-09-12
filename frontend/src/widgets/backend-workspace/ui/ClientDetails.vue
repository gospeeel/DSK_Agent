<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { formatCurrency } from '@/shared/lib/format'
const props = defineProps<{ clientId: string }>()
import { useClientDetails } from '../model/client-details'
const { allowed, client } = useClientDetails(() => props.clientId)
</script>
<template>
  <section class="rounded-xl border border-ink/10 bg-sheet p-6">
    <RouterLink to="/clients" class="text-sm text-blueprint underline">К клиентам</RouterLink>
    <p v-if="!allowed" class="mt-5 text-sm">Клиент недоступен или проверяются права доступа.</p>
    <ApiState
      v-else
      :pending="client.isPending.value"
      :error="client.error.value"
      @retry="client.refetch()"
      ><template v-if="client.data.value"
        ><h2 class="mt-5 text-2xl font-semibold">{{ client.data.value.name }}</h2>
        <p class="mt-2 break-all text-sm">{{ client.data.value.email }}</p>
        <p class="mt-4 text-sm">
          Бюджет:
          {{
            client.data.value.budget_max == null
              ? 'Не указан'
              : formatCurrency(client.data.value.budget_max)
          }}
        </p>
        <h3 class="mt-6 font-semibold">Предпочтения клиента</h3>
        <p
          v-if="!Object.keys(client.data.value.preferences ?? {}).length"
          class="mt-2 text-sm text-muted"
        >
          Предпочтения ещё не сохранены.
        </p>
        <dl v-else class="mt-3 space-y-2 text-sm">
          <div v-for="(value, key) in client.data.value.preferences" :key="key">
            <dt class="text-muted">{{ key }}</dt>
            <dd>{{ Array.isArray(value) ? value.join(', ') : value }}</dd>
          </div>
        </dl>
        <RouterLink
          to="/conversations"
          class="mt-6 inline-block rounded-lg bg-blueprint px-4 py-3 text-sm text-white"
          >Открыть обращения</RouterLink
        ></template
      ></ApiState
    >
  </section>
</template>
