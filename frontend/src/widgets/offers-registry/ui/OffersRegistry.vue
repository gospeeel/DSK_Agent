<script setup lang="ts">
import { nextTick, shallowRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Download, FilePlus2, Send } from '@lucide/vue'

import { offerQueries, type Offer } from '@/entities/offer'
import { OfferEmailDraft } from '@/features/prepare-offer-email'
import { formatCurrency } from '@/shared/lib/format'
import { EmptyState, LoadingRows, StatusBadge } from '@/shared/ui'

const offersQuery = useQuery(offerQueries.list())
const emailOffer = shallowRef<Offer | null>(null)
const printOffer = shallowRef<Offer | null>(null)
const statusTone = (status: string) =>
  status === 'Принято'
    ? ('stable' as const)
    : status === 'Согласование'
      ? ('warning' as const)
      : status === 'Отправлено'
        ? ('blue' as const)
        : ('neutral' as const)

const exportOffer = async (offer: Offer) => {
  printOffer.value = offer
  await nextTick()
  window.print()
}
const sendOffer = (offer: Offer) => {
  emailOffer.value = offer
  nextTick(() =>
    document
      .querySelector('[aria-label="Подготовленное письмо"]')
      ?.scrollIntoView({ block: 'start' }),
  )
}
</script>

<template>
  <div class="mx-auto max-w-[1520px]">
    <div class="mb-4 flex justify-end sm:mb-6">
      <RouterLink
        to="/clients/c-101"
        class="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-blueprint px-4 text-sm font-semibold text-white"
        ><FilePlus2 :size="17" /> Создать предложение</RouterLink
      >
    </div>
    <OfferEmailDraft
      v-if="emailOffer"
      :key="emailOffer.id"
      :offer="emailOffer"
      @close="emailOffer = null"
    />
    <section class="rounded-2xl border border-ink/10 bg-sheet">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-5">
        <p class="text-sm font-semibold">Реестр КП</p>
        <p class="text-xs text-muted">Финансовые значения демонстрационные</p>
      </div>
      <LoadingRows v-if="offersQuery.isPending.value" class="p-5" />
      <div v-else-if="offersQuery.isError.value" class="p-5 text-sm text-risk">
        Не удалось загрузить предложения.
      </div>
      <EmptyState
        v-else-if="!offersQuery.data.value?.length"
        class="m-5"
        title="Предложений пока нет"
        text="Создайте первое предложение из карточки клиента — оно появится в этом реестре."
      />
      <div v-else class="divide-y divide-ink/8">
        <article
          v-for="offer in offersQuery.data.value"
          :key="offer.id"
          class="grid gap-4 p-5 transition-colors hover:bg-blueprint/3 md:grid-cols-[100px_minmax(220px,1fr)_minmax(190px,0.8fr)_150px_140px_auto] md:items-center"
        >
          <div>
            <p class="font-semibold text-blueprint">{{ offer.id }}</p>
            <p class="mt-1 text-xs text-muted">{{ offer.updatedAt }}</p>
          </div>
          <div>
            <RouterLink
              :to="`/clients/${offer.clientId}`"
              class="text-sm font-semibold hover:underline"
              >{{ offer.clientName }}</RouterLink
            >
            <p class="mt-1 text-xs text-muted">{{ offer.property }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold tabular-nums">{{ formatCurrency(offer.amount) }}</p>
            <p class="mt-1 text-xs text-muted">Скидка {{ offer.discount }}%</p>
          </div>
          <StatusBadge :tone="statusTone(offer.status)" :label="offer.status" />
          <p class="text-xs text-muted">
            {{ offer.extras.length ? offer.extras.join(', ') : 'Без доп. услуг' }}
          </p>
          <div class="flex gap-2 md:justify-end">
            <button
              class="grid size-9 place-items-center rounded-lg border border-ink/12 bg-white text-blueprint"
              type="button"
              aria-label="Экспортировать PDF"
              @click="exportOffer(offer)"
            >
              <Download :size="17" /></button
            ><button
              class="grid size-9 place-items-center rounded-lg border border-ink/12 bg-white text-blueprint disabled:opacity-35"
              type="button"
              :disabled="offer.status === 'Согласование'"
              aria-label="Подготовить письмо"
              title="Подготовить письмо"
              @click="sendOffer(offer)"
            >
              <Send :size="17" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="printOffer" class="print-offer-sheet hidden" aria-hidden="true">
      <header class="border-b-2 border-blueprint pb-5">
        <p class="text-sm font-semibold text-blueprint">АО СЗ «ДСК»</p>
        <h2 class="mt-3 text-3xl font-semibold">Коммерческое предложение {{ printOffer.id }}</h2>
        <p class="mt-2 text-muted">Демонстрационная версия · {{ printOffer.updatedAt }}</p>
      </header>
      <dl class="mt-8 grid grid-cols-2 gap-6">
        <div>
          <dt class="text-sm text-muted">Клиент</dt>
          <dd class="mt-1 text-lg font-semibold">{{ printOffer.clientName }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Объект</dt>
          <dd class="mt-1 text-lg font-semibold">{{ printOffer.property }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Стоимость</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums">
            {{ formatCurrency(printOffer.amount) }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Скидка</dt>
          <dd class="mt-1 text-lg font-semibold">{{ printOffer.discount }}%</dd>
        </div>
        <div class="col-span-2">
          <dt class="text-sm text-muted">Дополнительные услуги</dt>
          <dd class="mt-1 text-lg font-semibold">
            {{ printOffer.extras.length ? printOffer.extras.join(', ') : 'Не выбраны' }}
          </dd>
        </div>
      </dl>
      <p class="mt-12 border-t border-ink/20 pt-4 text-xs text-muted">
        Финансовые значения используются только для демонстрации интерфейса и требуют подтверждения
        по утверждённой модели компании.
      </p>
    </section>
  </div>
</template>
