<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft, Bot, Mail, MessageSquareText, Phone, Sparkles } from '@lucide/vue'

import { clientQueries } from '@/entities/client'
import type { Apartment } from '@/entities/apartment'
import { OfferComposer } from '@/features/generate-offer'
import { ApartmentSelectorDialog } from '@/features/select-apartment'
import { LoadingRows, StatusBadge } from '@/shared/ui'

const props = defineProps<{ clientId: string }>()
const showComposer = shallowRef(false)
const showApartmentSelector = shallowRef(false)
const selectedApartment = shallowRef<Apartment | null>(null)
const clientQuery = useQuery(computed(() => clientQueries.detail(props.clientId)))

const applyApartment = (apartment: Apartment) => {
  selectedApartment.value = apartment
  showApartmentSelector.value = false
}
</script>

<template>
  <div class="mx-auto max-w-[1520px]">
    <RouterLink
      to="/clients"
      class="mb-5 inline-flex items-center gap-2 text-sm font-medium text-blueprint hover:underline"
      ><ArrowLeft :size="16" /> К списку клиентов</RouterLink
    >
    <LoadingRows v-if="clientQuery.isPending.value" :rows="6" />
    <div
      v-else-if="clientQuery.isError.value || !clientQuery.data.value"
      class="rounded-2xl border border-risk/20 bg-sheet p-6 text-risk"
    >
      Карточка клиента не найдена.
    </div>
    <template v-else>
      <header
        class="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-ink/10 bg-sheet p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div class="flex items-center gap-4">
          <span
            class="grid size-12 place-items-center rounded-full bg-blueprint text-sm font-bold text-white"
            >{{ clientQuery.data.value.initials }}</span
          >
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-2xl font-semibold tracking-[-0.03em]">
                {{ clientQuery.data.value.name }}
              </h2>
              <StatusBadge tone="blue" :label="clientQuery.data.value.stage" />
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ clientQuery.data.value.property }} · {{ clientQuery.data.value.project }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <a
            :href="`tel:${clientQuery.data.value.phone}`"
            class="grid size-10 place-items-center rounded-lg border border-ink/12 bg-white text-blueprint"
            aria-label="Позвонить"
            ><Phone :size="18" /></a
          ><a
            :href="`mailto:${clientQuery.data.value.email}`"
            class="grid size-10 place-items-center rounded-lg border border-ink/12 bg-white text-blueprint"
            aria-label="Написать письмо"
            ><Mail :size="18" /></a
          ><button
            class="h-10 rounded-lg bg-blueprint px-4 text-sm font-semibold text-white"
            type="button"
            @click="showComposer = !showComposer"
          >
            {{ showComposer ? 'Скрыть расчёт' : 'Создать КП' }}
          </button>
        </div>
      </header>

      <OfferComposer
        v-if="showComposer"
        class="mb-5"
        :client="clientQuery.data.value"
        :apartment="selectedApartment"
        @choose-apartment="showApartmentSelector = true"
      />

      <ApartmentSelectorDialog
        :open="showApartmentSelector"
        :initial-apartment-id="selectedApartment?.id ?? clientQuery.data.value.apartmentId"
        @close="showApartmentSelector = false"
        @select="applyApartment"
      />

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div class="space-y-5">
          <section class="rounded-2xl border border-ink/10 bg-sheet p-5 sm:p-6">
            <div class="flex items-center gap-2">
              <Sparkles :size="18" class="text-[#9a650f]" />
              <h2 class="text-lg font-semibold">AI-анализ клиента</h2>
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-3">
              <!-- <div>
                <p class="text-xs font-medium text-muted">Вероятность сделки</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums">
                  {{ clientQuery.data.value.probability }}%
                </p>
              </div> -->
              <div>
                <p class="text-xs font-medium text-muted">Бюджет</p>
                <p class="mt-1 font-semibold">{{ clientQuery.data.value.budget }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-muted">Следующий шаг</p>
                <p class="mt-1 font-semibold">{{ clientQuery.data.value.nextAction }}</p>
              </div>
            </div>
            <div class="mt-5 rounded-xl bg-blueprint p-4 text-white">
              <p class="text-sm font-semibold">Рекомендация</p>
              <p class="mt-1 text-sm leading-6 text-white/72">
                Сначала подтвердите реалистичный срок, затем покажите резервный вариант. Для этого
                клиента уверенность в дате важнее дополнительной скидки.
              </p>
            </div>
          </section>

          <section class="rounded-2xl border border-ink/10 bg-sheet p-5 sm:p-6">
            <div class="flex items-center gap-2">
              <MessageSquareText :size="18" class="text-blueprint" />
              <h2 class="text-lg font-semibold">История общения</h2>
            </div>
            <div v-if="clientQuery.data.value.conversation.length" class="mt-5 space-y-4">
              <article
                v-for="entry in clientQuery.data.value.conversation"
                :key="entry.id"
                class="flex gap-3"
              >
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-full"
                  :class="
                    entry.author === 'ai'
                      ? 'bg-signal/20 text-[#7a4b08]'
                      : 'bg-blueprint-soft text-blueprint'
                  "
                  ><Bot v-if="entry.author === 'ai'" :size="17" /><span
                    v-else
                    class="text-xs font-bold"
                    >{{ entry.authorName.slice(0, 1) }}</span
                  ></span
                >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold">{{ entry.authorName }}</p>
                    <time class="text-xs text-muted">{{ entry.occurredAt }}</time>
                  </div>
                  <p class="mt-1 text-sm leading-6 text-muted">{{ entry.text }}</p>
                </div>
              </article>
            </div>
            <p v-else class="mt-5 text-sm text-muted">История общения пока пуста.</p>
          </section>
        </div>

        <aside class="space-y-5">
          <section class="rounded-2xl border border-ink/10 bg-sheet p-5">
            <h2 class="font-semibold">Потребности</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              <StatusBadge
                v-for="item in clientQuery.data.value.preferences"
                :key="item"
                tone="neutral"
                :label="item"
              />
            </div>
          </section>
          <section class="rounded-2xl border border-risk/18 bg-sheet p-5">
            <h2 class="font-semibold">Риски сделки</h2>
            <div v-if="clientQuery.data.value.risks.length" class="mt-4 space-y-3">
              <article
                v-for="risk in clientQuery.data.value.risks"
                :key="risk.id"
                class="rounded-xl bg-risk/6 p-4"
              >
                <StatusBadge :tone="risk.level" label="Требует внимания" />
                <p class="mt-3 text-sm font-semibold">{{ risk.title }}</p>
                <p class="mt-1 text-sm leading-6 text-muted">{{ risk.detail }}</p>
              </article>
            </div>
            <p v-else class="mt-3 text-sm text-safe">Критичных рисков не обнаружено.</p>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
