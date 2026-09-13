import { computed, reactive } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

import type { Client } from '@/entities/client'
import { getApartmentLabel, type Apartment } from '@/entities/apartment'
import { calculateDiscountAmount, getOfferApprovalState, offerKeys } from '@/entities/offer'
import { salesApi } from '@/shared/api'

export function useGenerateOffer(client: Client) {
  const queryClient = useQueryClient()
  const form = reactive({
    apartmentId: client.apartmentId ?? '',
    property: client.property,
    amount: 9_460_000,
    discount: 2,
    extras: ['Чистовая отделка'] as string[],
  })

  const discountAmount = computed(() => calculateDiscountAmount(form.amount, form.discount))
  const finalAmount = computed(() => form.amount - discountAmount.value)
  const approvalState = computed(() => getOfferApprovalState(form.discount))
  const mutation = useMutation({
    mutationFn: () =>
      salesApi.createOffer({
        clientId: client.id,
        apartmentId: form.apartmentId,
        property: form.property,
        amount: form.amount,
        discount: form.discount,
        extras: [...form.extras],
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: offerKeys.all }),
  })

  const toggleExtra = (extra: string) => {
    form.extras = form.extras.includes(extra)
      ? form.extras.filter((item) => item !== extra)
      : [...form.extras, extra]
  }

  const selectApartment = (apartment: Apartment) => {
    form.apartmentId = apartment.id
    form.property = getApartmentLabel(apartment)
    form.amount = apartment.price
  }

  return {
    form,
    discountAmount,
    finalAmount,
    approvalState,
    mutation,
    toggleExtra,
    selectApartment,
  }
}
