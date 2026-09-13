<script setup lang="ts">
import type { ApiOffer, ApiRole } from '@/shared/api/backend-contracts'
import { formatCurrency } from '@/shared/lib/format'
import { StatusBadge } from '@/shared/ui'

defineProps<{
  offers: ApiOffer[]
  role?: ApiRole
  decisionReason: string
  pending: boolean
}>()
const emit = defineEmits<{
  requestApproval: [id: number]
  approve: [id: number]
  reject: [id: number]
  download: [id: number]
  send: [id: number]
  'update:decisionReason': [value: string]
}>()
const status = {
  draft: 'Черновик',
  pending_approval: 'На согласовании',
  approved: 'Согласовано',
  rejected: 'Отклонено',
}
const tone = (value: ApiOffer['status']) =>
  value === 'approved' ? 'stable' : value === 'rejected' ? 'critical' : 'warning'
</script>

<template>
  <section class="rounded-xl border border-ink/10 bg-sheet">
    <header class="border-b border-ink/10 px-5 py-4 sm:px-6">
      <h2 class="text-xl font-semibold">Реестр предложений</h2>
      <p class="mt-1 text-sm text-muted">Версии, согласование и готовые документы</p>
    </header>
    <p v-if="!offers.length" class="px-5 py-8 text-sm text-muted">Предложений пока нет.</p>
    <article
      v-for="offer in offers"
      :key="offer.id"
      class="grid gap-4 border-b border-ink/10 px-5 py-5 last:border-0 sm:grid-cols-[1fr_auto] sm:px-6"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class="font-semibold">
            КП по сделке № {{ offer.deal_id }} · версия {{ offer.version }}
          </h3>
          <StatusBadge :tone="tone(offer.status)" :label="status[offer.status]" />
        </div>
        <p class="mt-2 text-sm tabular-nums">
          {{ formatCurrency(offer.final_price) }} · скидка {{ offer.discount_percent }}%
        </p>
        <p v-if="offer.parking_unit_id || offer.storage_unit_id" class="mt-1 text-sm text-muted">
          <span v-if="offer.parking_unit_id">
            Парковка № {{ offer.parking_number || offer.parking_unit_id }} ·
            {{ formatCurrency(offer.parking_price) }}
          </span>
          <span v-if="offer.parking_unit_id && offer.storage_unit_id"> · </span>
          <span v-if="offer.storage_unit_id">
            Кладовая № {{ offer.storage_number || offer.storage_unit_id }} ·
            {{ formatCurrency(offer.storage_price) }}
          </span>
        </p>
        <p class="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted">
          {{ offer.generated_text }}
        </p>
        <p v-if="offer.rejection_reason" class="mt-3 text-sm text-risk">
          Причина отклонения: {{ offer.rejection_reason }}
        </p>
      </div>
      <div class="flex flex-wrap items-start gap-2 sm:max-w-64 sm:justify-end">
        <button
          v-if="offer.status === 'draft'"
          class="rounded-lg border border-ink/20 px-3 py-2 text-sm"
          :disabled="pending"
          @click="emit('requestApproval', offer.id)"
        >
          Отправить на согласование
        </button>
        <template v-if="role === 'supervisor' && offer.status === 'pending_approval'">
          <button
            class="rounded-lg bg-blueprint px-3 py-2 text-sm text-white"
            :disabled="pending"
            @click="emit('approve', offer.id)"
          >
            Согласовать
          </button>
          <input
            :value="decisionReason"
            aria-label="Причина отклонения"
            placeholder="Причина отклонения"
            class="h-10 min-w-0 rounded-lg border border-ink/20 px-3 text-sm"
            @input="emit('update:decisionReason', ($event.target as HTMLInputElement).value)"
          />
          <button
            class="rounded-lg border border-risk/30 px-3 py-2 text-sm text-risk"
            :disabled="pending || !decisionReason.trim()"
            @click="emit('reject', offer.id)"
          >
            Отклонить
          </button>
        </template>
        <button
          v-if="offer.status === 'approved'"
          class="rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold text-blueprint"
          :disabled="pending"
          @click="emit('download', offer.id)"
        >
          Скачать PDF
        </button>
        <button
          v-if="offer.status === 'approved' && role !== 'user'"
          class="rounded-lg bg-blueprint px-3 py-2 text-sm font-semibold text-white"
          :disabled="pending"
          @click="emit('send', offer.id)"
        >
          Отправить клиенту
        </button>
      </div>
    </article>
  </section>
</template>
