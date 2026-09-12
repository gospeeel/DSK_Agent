import { describe, expect, it } from 'vitest'

import { calculateDiscountAmount, getOfferApprovalState } from './offer-policy'

describe('offer policy', () => {
  it('requires approval above the manager limit', () => {
    expect(getOfferApprovalState(3)).toBe('within-limit')
    expect(getOfferApprovalState(3.5)).toBe('requires-approval')
  })

  it('calculates the discount in rubles', () => {
    expect(calculateDiscountAmount(10_000_000, 2.5)).toBe(250_000)
  })
})
