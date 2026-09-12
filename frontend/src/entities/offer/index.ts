export { offerKeys, offerQueries } from './api/offer.queries'
export {
  calculateDiscountAmount,
  getOfferApprovalState,
  MANAGER_DISCOUNT_LIMIT,
} from './lib/offer-policy'
export type { CreateOfferInput, Offer } from '@/shared/api'
