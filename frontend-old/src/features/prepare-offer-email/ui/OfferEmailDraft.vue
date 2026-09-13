<script setup lang="ts">
import type { Offer } from '@/entities/offer'
import { useOfferEmail } from '../model/use-offer-email'
const props = defineProps<{ offer: Offer }>()
defineEmits<{ close: [] }>()
const { clientQuery, recipient, subject, body, mailto, copy, copyStatus } = useOfferEmail(
  () => props.offer,
)
</script>

<template>
  <section
    class="mb-5 scroll-mt-24 rounded-xl border border-ink/15 bg-sheet p-5"
    aria-label="Подготовленное письмо"
  >
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-lg font-semibold">Письмо по {{ offer.id }}</h2>
      <button
        type="button"
        class="rounded px-3 py-2 text-sm text-blueprint"
        @click="$emit('close')"
      >
        Закрыть
      </button>
    </div>
    <p class="mt-2 text-sm text-muted">
      Письмо ещё не отправлено. Проверьте текст и отправьте его из своей почты. Статус КП здесь не
      изменится.
    </p>
    <p v-if="clientQuery.isPending.value" class="mt-4 text-sm">Загружаем адрес клиента…</p>
    <p v-else-if="clientQuery.isError.value || !recipient" class="mt-4 text-sm text-risk">
      Адрес клиента недоступен. Проверьте его в карточке клиента.
    </p>
    <template v-else>
      <p class="mt-4 break-all text-sm"><strong>Кому:</strong> {{ recipient }}</p>
      <p class="mt-2 text-sm"><strong>Тема:</strong> {{ subject }}</p>
      <textarea
        aria-label="Текст письма"
        :value="body"
        readonly
        rows="10"
        class="mt-3 w-full rounded-lg border border-ink/15 bg-white p-4 text-sm leading-6"
      />
      <div class="mt-3 flex flex-wrap gap-3">
        <a :href="mailto" class="rounded-lg bg-blueprint px-4 py-3 text-sm font-semibold text-white"
          >Открыть в почте</a
        >
        <button
          type="button"
          class="rounded-lg border border-ink/15 px-4 py-3 text-sm"
          @click="copy"
        >
          Копировать письмо
        </button>
      </div>
      <p class="mt-2 text-xs text-muted">
        Откроется настроенное почтовое приложение. PDF можно отдельно выгрузить из реестра и
        приложить к письму.
      </p>
      <p v-if="copyStatus" role="status" class="mt-3 text-sm">{{ copyStatus }}</p>
    </template>
  </section>
</template>
