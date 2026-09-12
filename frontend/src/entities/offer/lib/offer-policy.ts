export const MANAGER_DISCOUNT_LIMIT = 3

export function getOfferApprovalState(discount: number) {
  return discount > MANAGER_DISCOUNT_LIMIT
    ? ('requires-approval' as const)
    : ('within-limit' as const)
}

export function calculateDiscountAmount(amount: number, discount: number) {
  return Math.round((amount * discount) / 100)
}
