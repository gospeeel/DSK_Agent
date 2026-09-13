import { computed, shallowRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { clientQueries } from '@/entities/client'
import type { Offer } from '@/entities/offer'
import { formatCurrency } from '@/shared/lib/format'

export function useOfferEmail(offer: () => Offer) {
  const clientQuery = useQuery(computed(() => clientQueries.detail(offer().clientId)))
  const recipient = computed(() => clientQuery.data.value?.email ?? '')
  const subject = computed(() => `Коммерческое предложение ${offer().id} · ДСК`)
  const body = computed(() =>
    [
      `Здравствуйте, ${offer().clientName}!`,
      '',
      `Ваше предложение ${offer().id}: ${offer().property}.`,
      `Стоимость: ${formatCurrency(offer().amount)}. Скидка: ${offer().discount}%.`,
      `Дополнительные услуги: ${offer().extras.join(', ') || 'не выбраны'}.`,
      '',
      'Демонстрационное предложение. Условия требуют подтверждения менеджером.',
      '',
      'Отдел продаж АО СЗ «ДСК»',
    ].join('\n'),
  )
  const mailto = computed(
    () =>
      `mailto:${encodeURIComponent(recipient.value)}?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(body.value)}`,
  )
  const copyStatus = shallowRef('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Кому: ${recipient.value}\nТема: ${subject.value}\n\n${body.value}`,
      )
      copyStatus.value = 'Текст письма скопирован.'
    } catch {
      copyStatus.value = 'Копирование недоступно. Выделите текст письма и скопируйте вручную.'
    }
  }
  return { clientQuery, recipient, subject, body, mailto, copy, copyStatus }
}
