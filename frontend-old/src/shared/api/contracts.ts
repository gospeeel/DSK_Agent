export type RiskLevel = 'critical' | 'warning' | 'stable'
export type DealStage = 'Новый' | 'Подбор' | 'Переговоры' | 'Бронь' | 'Оформление'

export interface ClientRisk {
  id: string
  level: RiskLevel
  title: string
  detail: string
}

export interface ConversationEntry {
  id: string
  author: 'client' | 'manager' | 'ai'
  authorName: string
  text: string
  occurredAt: string
}

export interface Client {
  id: string
  name: string
  initials: string
  phone: string
  email: string
  property: string
  project: string
  apartmentId?: string
  stage: DealStage
  probability: number
  nextAction: string
  nextActionAt: string
  lastContactAt: string
  budget: string
  preferences: string[]
  risks: ClientRisk[]
  conversation: ConversationEntry[]
}

export type ApartmentStatus = 'available' | 'reserved' | 'sold'
export type ApartmentRiskLevel = 'none' | 'warning' | 'critical'

export interface ApartmentProject {
  id: string
  name: string
  address: string
}

export interface ApartmentBuilding {
  id: string
  projectId: string
  name: string
  completion: string
  readiness: number
}

export interface ApartmentFloor {
  id: string
  buildingId: string
  number: number
  label: string
  planId: string
  layoutId: string
}

export interface Apartment {
  id: string
  number: number | string
  projectId: string
  buildingId: string
  floorId: string
  rooms: number
  area: number
  price: number
  status: ApartmentStatus
  finish: string
  completion: string
  matchScore: number
  matchReasons: string[]
  riskLevel: ApartmentRiskLevel
  riskText?: string
}

export interface ApartmentPlanRegion {
  apartmentId: string
  points: string
  labelX: number
  labelY: number
  walls: string[]
  rooms: PlanRoom[]
  openings: PlanOpening[]
  fixtures: PlanFixture[]
}

export interface PlanRoom {
  id: string
  label: string
  area?: number
  x: number
  y: number
}

export interface PlanOpening {
  id: string
  kind: 'door' | 'window'
  x: number
  y: number
  width: number
  rotation: number
  flip?: boolean
}

export interface PlanFixture {
  id: string
  kind: 'bath' | 'toilet' | 'sink' | 'stove' | 'counter' | 'wardrobe'
  x: number
  y: number
  rotation?: number
  scale?: number
}

export interface FloorPlan {
  id: string
  floorId: string
  layoutId: string
  layoutName: string
  viewBox: string
  core: PlanCore
  regions: ApartmentPlanRegion[]
}

export interface PlanCore {
  x: number
  y: number
  width: number
  height: number
  lifts: 2 | 3
}

export interface ApartmentCatalog {
  projects: ApartmentProject[]
  buildings: ApartmentBuilding[]
  floors: ApartmentFloor[]
  apartments: Apartment[]
  plans: FloorPlan[]
}

export interface WorkTask {
  id: string
  kind: 'offer' | 'call' | 'approval' | 'risk'
  title: string
  context: string
  dueAt: string
  clientId?: string
  priority: RiskLevel
  completed: boolean
}

export interface ConstructionEvent {
  id: string
  objectId: string
  project: string
  object: string
  title: string
  impact: string
  affectedClients: number
  detectedAt: string
  level: RiskLevel
}

export interface ConstructionObject {
  id: string
  projectId: string
  buildingId?: string
  name: string
  type: 'Корпус' | 'Паркинг'
  readiness: number
  plannedDelivery: string
  forecastDelivery: string
  availableUnits: number
  reservedUnits: number
  level: RiskLevel
  currentStage: string
}

export interface Offer {
  id: string
  clientId: string
  clientName: string
  apartmentId: string
  property: string
  amount: number
  discount: number
  status: 'Черновик' | 'Отправлено' | 'Согласование' | 'Принято'
  updatedAt: string
  extras: string[]
}

export interface CreateOfferInput {
  clientId: string
  apartmentId: string
  property: string
  amount: number
  discount: number
  extras: string[]
}

export interface SalesApi {
  getClients(): Promise<Client[]>
  getClient(id: string): Promise<Client | null>
  getTasks(): Promise<WorkTask[]>
  completeTask(id: string): Promise<WorkTask>
  getConstructionEvents(): Promise<ConstructionEvent[]>
  getConstructionObjects(): Promise<ConstructionObject[]>
  getApartmentCatalog(): Promise<ApartmentCatalog>
  getOffers(): Promise<Offer[]>
  createOffer(input: CreateOfferInput): Promise<Offer>
}
