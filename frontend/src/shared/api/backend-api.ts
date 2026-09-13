import { apiFileRequest, apiId, apiRequest } from './transport'
import type {
  ApiAudience,
  ApiUser,
  ApiComplex,
  ApiBuilding,
  ApiApartment,
  ApiProgress,
  ApiChatSession,
  ApiMessage,
  ApiDeal,
  ApiAiReply,
  ApiNotification,
  ApiOffer,
  ApiOfferCalculation,
  ApiOfferDelivery,
  ApiDialogAnalysis,
  ApiReplyAssist,
  ApiCompetitor,
  ApiDiscountPolicy,
  ApiAncillaryUnit,
  ApiErpEvent,
  ApiErpSnapshot,
  ApiMaterialStock,
  ApiProductionSchedule,
  ApiReminder,
  NewSession,
} from './backend-contracts'
const list = <T>(value: T[] | null): T[] => value ?? []
export const backendApi = {
  profile: (a: ApiAudience) =>
    apiRequest<ApiUser>(a, a === 'staff' ? '/staff/profile' : '/auth/profile', {
      authRequest: true,
    }),
  login: (a: ApiAudience, email: string, password: string) =>
    apiRequest<{ user: ApiUser }>(a, '/auth/login', {
      method: 'POST',
      authRequest: true,
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    apiRequest<ApiUser>('user', '/auth/register', {
      method: 'POST',
      authRequest: true,
      body: JSON.stringify({ name, email, password }),
    }),
  createStaff: (input: {
    name: string
    email: string
    password: string
    role: Extract<ApiUser['role'], 'manager' | 'supervisor'>
  }) =>
    apiRequest<ApiUser>('staff', '/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  logout: (a: ApiAudience) => apiRequest(a, '/auth/logout', { method: 'POST', authRequest: true }),
  users: () => apiRequest<ApiUser[] | null>('staff', '/users').then(list),
  user: (id: number) => apiRequest<ApiUser>('staff', `/users/${apiId(id)}`),
  me: () => apiRequest<ApiUser>('user', '/users/me'),
  updateMe: (input: { name: string; email: string }) =>
    apiRequest<{ user: ApiUser }>('user', '/users/me', {
      method: 'PUT',
      body: JSON.stringify(input),
    }).then((result) => result.user),
  complexes: (a: ApiAudience) => apiRequest<ApiComplex[] | null>(a, '/complexes').then(list),
  buildings: (a: ApiAudience, complexId: number) =>
    apiRequest<ApiBuilding[] | null>(a, `/complexes/${apiId(complexId)}/buildings`).then(list),
  building: (a: ApiAudience, id: number) => apiRequest<ApiBuilding>(a, `/buildings/${apiId(id)}`),
  apartments: (a: ApiAudience, buildingId: number) =>
    apiRequest<ApiApartment[] | null>(a, `/buildings/${apiId(buildingId)}/apartments`).then(list),
  apartment: (a: ApiAudience, id: number) =>
    apiRequest<ApiApartment>(a, `/apartments/${apiId(id)}`),
  progress: (a: ApiAudience, buildingId: number) =>
    apiRequest<ApiProgress[] | null>(a, `/buildings/${apiId(buildingId)}/progress`).then(list),
  createComplex: (input: Omit<ApiComplex, 'id'>) =>
    apiRequest<ApiComplex>('staff', '/complexes', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  createBuilding: (input: Omit<ApiBuilding, 'id'>) =>
    apiRequest<ApiBuilding>('staff', '/buildings', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  createApartment: (input: Omit<ApiApartment, 'id'>) =>
    apiRequest<ApiApartment>('staff', '/apartments', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  createProgress: (input: Omit<ApiProgress, 'id'>) =>
    apiRequest<ApiProgress>('staff', '/progress', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateComplex: (complex: ApiComplex) =>
    apiRequest<ApiComplex>('staff', `/complexes/${apiId(complex.id)}`, {
      method: 'PUT',
      body: JSON.stringify(complex),
    }),
  updateBuilding: (building: ApiBuilding) =>
    apiRequest<ApiBuilding>('staff', `/buildings/${apiId(building.id)}`, {
      method: 'PUT',
      body: JSON.stringify(building),
    }),
  updateApartment: (apartment: ApiApartment) =>
    apiRequest<ApiApartment>('staff', `/apartments/${apiId(apartment.id)}`, {
      method: 'PUT',
      body: JSON.stringify(apartment),
    }),
  updateProgress: (progress: ApiProgress) =>
    apiRequest<ApiProgress>('staff', `/progress/${apiId(progress.id)}`, {
      method: 'PUT',
      body: JSON.stringify(progress),
    }),
  sessions: (a: ApiAudience) => apiRequest<ApiChatSession[] | null>(a, '/chat/sessions').then(list),
  createSession: (input: NewSession) =>
    apiRequest<ApiChatSession>('user', '/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  sessionAction: (id: number, action: 'take' | 'close' | 'reject', reason?: string) =>
    apiRequest('staff', `/chat/sessions/${apiId(id)}/${action}`, {
      method: 'POST',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),
  messages: (a: ApiAudience, id: number, signal?: AbortSignal) =>
    apiRequest<ApiMessage[] | null>(a, `/chat/sessions/${apiId(id)}/messages`, { signal }).then(
      list,
    ),
  sendMessage: (a: ApiAudience, id: number, content: string) =>
    apiRequest<ApiMessage>(a, `/chat/sessions/${apiId(id)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deals: (a: ApiAudience) => apiRequest<ApiDeal[] | null>(a, '/deals').then(list),
  createDeal: (input: {
    id_user: number
    id_apartment: number
    id_chat_session?: number
    percent_discount: number
  }) =>
    apiRequest<ApiDeal>('staff', '/deals', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateDeal: (id: number, status: ApiDeal['status'], percentDiscount?: number) =>
    apiRequest<ApiDeal>('staff', `/deals/${apiId(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        ...(percentDiscount === undefined ? {} : { percent_discount: percentDiscount }),
      }),
    }),
  ai: (
    a: ApiAudience,
    input: {
      message: string
      session_id: number
      deal_id?: number
      parking_unit_id?: number
      storage_unit_id?: number
    },
  ) =>
    apiRequest<ApiAiReply>(a, '/ai/chat', {
      method: 'POST',
      body: JSON.stringify(input),
      timeout: 85_000,
    }),
  notifications: (unreadOnly = false) =>
    apiRequest<ApiNotification[] | null>(
      'user',
      `/notifications${unreadOnly ? '?unread=true' : ''}`,
    ).then(list),
  markNotificationRead: (id: number) =>
    apiRequest<{ success: boolean }>('user', `/notifications/${apiId(id)}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    apiRequest<{ success: boolean }>('user', '/notifications/read-all', { method: 'PUT' }),
  offers: (a: ApiAudience) => apiRequest<ApiOffer[] | null>(a, '/offers').then(list),
  calculateOffer: (
    dealId: number,
    discountPercent: string,
    parkingUnitId?: number,
    storageUnitId?: number,
  ) =>
    apiRequest<ApiOfferCalculation>('staff', '/offers/calculate', {
      method: 'POST',
      body: JSON.stringify({
        deal_id: apiId(dealId),
        discount_percent: discountPercent,
        parking_unit_id: parkingUnitId,
        storage_unit_id: storageUnitId,
      }),
    }),
  createOffer: (input: {
    request_id: string
    deal_id: number
    discount_percent: string
    generated_text: string
    parking_unit_id?: number
    storage_unit_id?: number
  }) =>
    apiRequest<ApiOffer>('staff', '/offers', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  requestOfferApproval: (id: number) =>
    apiRequest<ApiOffer>('staff', `/offers/${apiId(id)}/approval-request`, { method: 'POST' }),
  decideOffer: (id: number, decision: 'approve' | 'reject', reason = '') =>
    apiRequest<ApiOffer>('staff', `/offers/${apiId(id)}/${decision}`, {
      method: 'POST',
      body: decision === 'reject' ? JSON.stringify({ reason }) : undefined,
    }),
  offerPdf: (a: ApiAudience, id: number) => apiFileRequest(a, `/offers/${apiId(id)}/pdf`),
  sendOffer: (id: number) =>
    apiRequest<ApiOfferDelivery>('staff', `/offers/${apiId(id)}/send`, { method: 'POST' }),
  analyzeDialog: (dealId: number) =>
    apiRequest<ApiDialogAnalysis>('staff', '/ai/dialog/analyze', {
      method: 'POST',
      body: JSON.stringify({ deal_id: apiId(dealId) }),
      timeout: 85_000,
    }),
  assistReply: (dealId: number, selectedText?: string) =>
    apiRequest<ApiReplyAssist>('staff', '/ai/dialog/reply-assist', {
      method: 'POST',
      body: JSON.stringify({ deal_id: apiId(dealId), selected_text: selectedText || undefined }),
      timeout: 85_000,
    }),
  competitors: () => apiRequest<ApiCompetitor[] | null>('staff', '/competitors').then(list),
  createCompetitor: (input: Omit<ApiCompetitor, 'id' | 'updated_at'>) =>
    apiRequest<ApiCompetitor>('staff', '/competitors', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateCompetitor: (id: number, input: Omit<ApiCompetitor, 'id' | 'updated_at'>) =>
    apiRequest<ApiCompetitor>('staff', `/competitors/${apiId(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  discountPolicies: (buildingId: number) =>
    apiRequest<ApiDiscountPolicy[] | null>(
      'staff',
      `/buildings/${apiId(buildingId)}/discount-policies`,
    ).then(list),
  createDiscountPolicy: (input: {
    building_id: number
    role: ApiDiscountPolicy['role']
    max_discount_percent: string
    valid_from: string
  }) =>
    apiRequest<ApiDiscountPolicy>('staff', '/discount-policies', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  ancillaryUnits: (a: ApiAudience, buildingId: number) =>
    apiRequest<ApiAncillaryUnit[] | null>(
      a,
      `/buildings/${apiId(buildingId)}/ancillary-units`,
    ).then(list),
  createAncillaryUnit: (input: Omit<ApiAncillaryUnit, 'id' | 'created_at' | 'updated_at'>) =>
    apiRequest<ApiAncillaryUnit>('staff', '/ancillary-units', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateAncillaryUnit: (unit: ApiAncillaryUnit) =>
    apiRequest<ApiAncillaryUnit>('staff', `/ancillary-units/${apiId(unit.id)}`, {
      method: 'PUT',
      body: JSON.stringify(unit),
    }),
  erpSnapshot: (buildingId: number) =>
    apiRequest<ApiErpSnapshot>('staff', `/buildings/${apiId(buildingId)}/erp`),
  createErpEvent: (input: Omit<ApiErpEvent, 'id' | 'occurred_at'>) =>
    apiRequest<ApiErpEvent>('staff', '/erp/events', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  upsertMaterialStock: (input: Omit<ApiMaterialStock, 'id' | 'updated_at'>) =>
    apiRequest<ApiMaterialStock>('staff', '/erp/material-stocks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  createProductionSchedule: (input: Omit<ApiProductionSchedule, 'id' | 'updated_at'>) =>
    apiRequest<ApiProductionSchedule>('staff', '/erp/production-schedules', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  reminders: () => apiRequest<ApiReminder[] | null>('staff', '/reminders').then(list),
  createReminder: (input: {
    assigned_to: number
    deal_id?: number
    title: string
    due_at: string
  }) =>
    apiRequest<ApiReminder>('staff', '/reminders', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  completeReminder: (id: number) =>
    apiRequest<ApiReminder>('staff', `/reminders/${apiId(id)}/complete`, { method: 'PUT' }),
}
