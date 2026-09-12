export type ApiRole = 'user' | 'manager' | 'supervisor'
export type ApiAudience = 'user' | 'staff'
export interface ApiUser {
  id: number
  name: string
  email: string
  role: ApiRole
  budget_max?: number
  preferences?: Record<string, unknown>
}
export interface ApiComplex {
  id: number
  name: string
  address: string
  description: string
}
export interface ApiBuilding {
  id: number
  residential_complex_id: number
  address: string
  district: string
  latitude: number
  longitude: number
  floors_count: number
  planned_date: string | null
  actual_date: string | null
  status: 'design' | 'construction' | 'completed' | 'suspended'
  type_wall_material: 'panel' | 'monolith' | 'brick' | 'block'
  readiness_percent?: number | null
  forecast_date?: string | null
  delivery_shift_days?: number | null
}
export interface ApiApartment {
  id: number
  building_id: number
  number: string
  rooms: number
  floor: number
  area: number
  price: number
  type_finishing: 'rough' | 'white_box' | 'turnkey'
  status: 'free' | 'booked' | 'sold'
}
export interface ApiProgress {
  id: number
  building_id: number
  stage_name: 'excavation' | 'foundation' | 'frame' | 'roofing' | 'finishing'
  planned_start_date: string | null
  actual_start_date: string | null
  planned_end_date: string | null
  actual_end_date: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
  completion_percentage: number | null
  delay_reason: string
  risk_level?: 'low' | 'medium' | 'high' | null
  delay_days?: number | null
}
export interface ApiChatSession {
  id: number
  id_user: number | null
  id_employee: number | null
  id_apartment: number | null
  guest_name?: string
  guest_phone?: string
  guest_email?: string
  user_name?: string
  employee_name?: string
  status: 'open' | 'in_progress' | 'close'
  created_at: string
  updated_at: string
}
export interface ApiMessage {
  id: number
  id_chat_session: number
  id_user: number | null
  sender_type: 'client' | 'manager' | 'ai' | 'system'
  content: string
  is_read: boolean
  sended_at: string
  sender_name?: string
}
export interface ApiDeal {
  id: number
  id_user: number
  id_employee: number
  id_apartment: number
  id_chat_session?: number | null
  base_price: number
  percent_discount: number
  total_price: number
  status: 'pending' | 'contract' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  user_name?: string
  employee_name?: string
  apartment_number?: string
}
export interface ApiAiReply {
  message: string
  agent: 'analytics' | 'negotiation' | 'offer' | 'general'
  intent: string
}
export interface ApiNotification {
  id: number
  user_id: number
  deal_id?: number | null
  type: 'construction_delay' | 'construction_risk' | 'deal_update' | 'general'
  title: string
  message: string
  is_read: boolean
  created_at: string
  read_at?: string | null
}
export interface ApiOffer {
  id: number
  deal_id: number
  version: number
  created_by: number
  base_price: number
  discount_percent: string
  final_price: number
  parking_unit_id?: number | null
  parking_number?: string | null
  parking_price: number
  storage_unit_id?: number | null
  storage_number?: string | null
  storage_price: number
  generated_text: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  approval_required: boolean
  approved_by?: number | null
  approved_at?: string | null
  rejected_by?: number | null
  rejected_at?: string | null
  rejection_reason?: string | null
  created_at: string
  updated_at: string
}
export interface ApiOfferCalculation {
  deal_id: number
  base_price: number
  apartment_price: number
  parking_unit_id?: number | null
  parking_number?: string | null
  parking_price: number
  storage_unit_id?: number | null
  storage_number?: string | null
  storage_price: number
  discount_percent: string
  discount_amount: number
  final_price: number
  max_allowed_discount: string
  requires_approval: boolean
}
export interface ApiOfferDelivery {
  id: number
  offer_id: number
  recipient: string
  channel: 'email'
  status: 'pending' | 'sent' | 'failed'
  error_message?: string | null
  created_at: string
  sent_at?: string | null
}
export interface ApiClientFacts {
  budget_min: number | null
  budget_max: number | null
  rooms: number | null
  floor_min: number | null
  floor_max: number | null
  parking_required: boolean | null
  renovation_required: boolean | null
  preferred_district: string | null
  purchase_timeline: string | null
  important_factors: string[]
  objections: string[]
  summary: string
}
export interface ApiDialogAnalysis {
  deal_id: number
  client_id: number
  analysis: ApiClientFacts
  preferences_updated: boolean
}
export interface ApiReplyAssist {
  deal_id: number
  source: 'last_client_message' | 'selected_text'
  analysis: { intent: string; summary: string }
  suggested_reply: string
}
export interface ApiCompetitor {
  id: number
  project_name: string
  district: string
  price_per_sqm?: number | null
  advantages?: string | null
  disadvantages?: string | null
  source_url?: string | null
  observed_at?: string | null
  updated_at: string
  rooms?: number | null
  area?: number | null
}
export interface ApiDiscountPolicy {
  id: number
  building_id: number
  role: 'manager' | 'supervisor'
  max_discount_percent: string
  version: number
  valid_from: string
  valid_to?: string | null
  created_by: number
  created_at: string
}
export interface ApiAncillaryUnit {
  id: number
  building_id: number
  kind: 'parking' | 'storage'
  number: string
  area?: number | null
  price: number
  status: 'free' | 'booked' | 'sold'
  created_at: string
  updated_at: string
}
export interface ApiErpEvent {
  id: number
  building_id: number
  kind: 'schedule' | 'supply' | 'material' | 'project_change'
  title: string
  details: string
  severity: 'low' | 'medium' | 'high'
  affects_delivery: boolean
  delay_days?: number | null
  occurred_at: string
}
export interface ApiMaterialStock {
  id: number
  building_id: number
  material_name: string
  quantity: number
  unit: string
  minimum_quantity: number
  updated_at: string
}
export interface ApiProductionSchedule {
  id: number
  building_id: number
  product_name: string
  planned_quantity: number
  produced_quantity: number
  planned_date: string
  status: 'planned' | 'in_progress' | 'completed' | 'delayed'
  updated_at: string
}
export interface ApiErpSnapshot {
  events: ApiErpEvent[]
  material_stocks: ApiMaterialStock[]
  production_schedules: ApiProductionSchedule[]
}
export interface ApiReminder {
  id: number
  assigned_to: number
  created_by: number
  deal_id?: number | null
  title: string
  due_at: string
  completed_at?: string | null
  created_at: string
}
export interface NewSession {
  id_apartment?: number
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  message: string
}
