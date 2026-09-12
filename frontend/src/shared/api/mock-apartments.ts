import type {
  Apartment,
  ApartmentCatalog,
  ApartmentFloor,
  ApartmentPlanRegion,
  FloorPlan,
  PlanCore,
} from './contracts'

type EntrySide = 'top' | 'bottom'

interface LayoutSlot {
  x: number
  y: number
  width: number
  height: number
  rooms: 1 | 2 | 3
  entry: EntrySide
}

interface LayoutTemplate {
  id: string
  name: string
  core: PlanCore
  slots: LayoutSlot[]
}

interface FloorSeed {
  id: string
  buildingId: string
  number: number
  base: number
}

interface PinnedUnit extends Partial<Apartment> {
  base: number
  number: number
  rooms: 1 | 2 | 3
  area: number
  price: number
}

const projects = [
  { id: 'north', name: 'Квартал «Северный»', address: 'Воронеж, Московский проспект' },
  { id: 'river', name: 'Дом «Речной»', address: 'Воронеж, набережная Авиастроителей' },
]

const buildings = [
  {
    id: 'north-1',
    projectId: 'north',
    name: 'Корпус 1',
    completion: 'IV кв. 2026',
    readiness: 86,
  },
  {
    id: 'north-2',
    projectId: 'north',
    name: 'Корпус 2',
    completion: 'I кв. 2027',
    readiness: 64,
  },
  {
    id: 'north-3',
    projectId: 'north',
    name: 'Корпус 3',
    completion: 'III кв. 2027',
    readiness: 38,
  },
  {
    id: 'river-1',
    projectId: 'river',
    name: 'Жилой дом',
    completion: 'II кв. 2027',
    readiness: 71,
  },
]

const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'courtyard-6',
    name: 'Дворовая секция · 6 квартир',
    core: { x: 392, y: 295, width: 216, height: 100, lifts: 2 },
    slots: [
      { x: 25, y: 30, width: 305, height: 255, rooms: 2, entry: 'bottom' },
      { x: 347, y: 30, width: 306, height: 255, rooms: 1, entry: 'bottom' },
      { x: 670, y: 30, width: 305, height: 255, rooms: 2, entry: 'bottom' },
      { x: 25, y: 405, width: 305, height: 285, rooms: 3, entry: 'top' },
      { x: 347, y: 405, width: 306, height: 285, rooms: 1, entry: 'top' },
      { x: 670, y: 405, width: 305, height: 285, rooms: 3, entry: 'top' },
    ],
  },
  {
    id: 'gallery-8',
    name: 'Галерейная секция · 8 квартир',
    core: { x: 405, y: 298, width: 190, height: 94, lifts: 2 },
    slots: [
      { x: 20, y: 35, width: 230, height: 250, rooms: 1, entry: 'bottom' },
      { x: 260, y: 35, width: 230, height: 250, rooms: 2, entry: 'bottom' },
      { x: 510, y: 35, width: 230, height: 250, rooms: 2, entry: 'bottom' },
      { x: 750, y: 35, width: 230, height: 250, rooms: 1, entry: 'bottom' },
      { x: 20, y: 405, width: 230, height: 285, rooms: 2, entry: 'top' },
      { x: 260, y: 405, width: 230, height: 285, rooms: 3, entry: 'top' },
      { x: 510, y: 405, width: 230, height: 285, rooms: 1, entry: 'top' },
      { x: 750, y: 405, width: 230, height: 285, rooms: 3, entry: 'top' },
    ],
  },
  {
    id: 'family-4',
    name: 'Семейная секция · 4 квартиры',
    core: { x: 385, y: 292, width: 230, height: 106, lifts: 3 },
    slots: [
      { x: 25, y: 25, width: 455, height: 260, rooms: 2, entry: 'bottom' },
      { x: 520, y: 25, width: 455, height: 260, rooms: 3, entry: 'bottom' },
      { x: 25, y: 405, width: 455, height: 290, rooms: 1, entry: 'top' },
      { x: 520, y: 405, width: 455, height: 290, rooms: 2, entry: 'top' },
    ],
  },
  {
    id: 'urban-7',
    name: 'Городская секция · 7 квартир',
    core: { x: 378, y: 294, width: 244, height: 102, lifts: 3 },
    slots: [
      { x: 20, y: 30, width: 306, height: 255, rooms: 2, entry: 'bottom' },
      { x: 347, y: 30, width: 306, height: 255, rooms: 1, entry: 'bottom' },
      { x: 674, y: 30, width: 306, height: 255, rooms: 3, entry: 'bottom' },
      { x: 20, y: 405, width: 230, height: 285, rooms: 1, entry: 'top' },
      { x: 260, y: 405, width: 230, height: 285, rooms: 2, entry: 'top' },
      { x: 510, y: 405, width: 230, height: 285, rooms: 2, entry: 'top' },
      { x: 750, y: 405, width: 230, height: 285, rooms: 3, entry: 'top' },
    ],
  },
  {
    id: 'terrace-5',
    name: 'Террасная секция · 5 квартир',
    core: { x: 400, y: 296, width: 200, height: 98, lifts: 2 },
    slots: [
      { x: 25, y: 20, width: 390, height: 265, rooms: 3, entry: 'bottom' },
      { x: 585, y: 20, width: 390, height: 265, rooms: 2, entry: 'bottom' },
      { x: 25, y: 405, width: 305, height: 290, rooms: 1, entry: 'top' },
      { x: 347, y: 405, width: 306, height: 290, rooms: 2, entry: 'top' },
      { x: 670, y: 405, width: 305, height: 290, rooms: 3, entry: 'top' },
    ],
  },
  {
    id: 'asymmetric-6',
    name: 'Асимметричная секция · 6 квартир',
    core: { x: 390, y: 300, width: 220, height: 90, lifts: 2 },
    slots: [
      { x: 20, y: 40, width: 230, height: 245, rooms: 1, entry: 'bottom' },
      { x: 260, y: 20, width: 230, height: 265, rooms: 2, entry: 'bottom' },
      { x: 510, y: 20, width: 230, height: 265, rooms: 2, entry: 'bottom' },
      { x: 750, y: 40, width: 230, height: 245, rooms: 1, entry: 'bottom' },
      { x: 20, y: 405, width: 470, height: 290, rooms: 3, entry: 'top' },
      { x: 510, y: 405, width: 470, height: 290, rooms: 3, entry: 'top' },
    ],
  },
  {
    id: 'staggered-8',
    name: 'Ступенчатая секция · 8 квартир',
    core: { x: 398, y: 294, width: 204, height: 102, lifts: 2 },
    slots: [
      { x: 20, y: 55, width: 230, height: 230, rooms: 1, entry: 'bottom' },
      { x: 260, y: 25, width: 230, height: 260, rooms: 2, entry: 'bottom' },
      { x: 510, y: 25, width: 230, height: 260, rooms: 3, entry: 'bottom' },
      { x: 750, y: 55, width: 230, height: 230, rooms: 1, entry: 'bottom' },
      { x: 20, y: 405, width: 230, height: 255, rooms: 2, entry: 'top' },
      { x: 260, y: 405, width: 230, height: 290, rooms: 3, entry: 'top' },
      { x: 510, y: 405, width: 230, height: 290, rooms: 1, entry: 'top' },
      { x: 750, y: 405, width: 230, height: 255, rooms: 2, entry: 'top' },
    ],
  },
]

const floorConfigs = [
  { buildingId: 'north-1', from: 7, to: 13, firstBase: 83 },
  { buildingId: 'north-2', from: 8, to: 14, firstBase: 133 },
  { buildingId: 'north-3', from: 16, to: 22, firstBase: 215 },
  { buildingId: 'river-1', from: 5, to: 12, firstBase: 42 },
]

const pinnedUnits: Record<string, PinnedUnit> = {
  'north-1-f9': { base: 107, number: 109, rooms: 2, area: 58.1, price: 9_870_000, matchScore: 92 },
  'north-2-f12': {
    base: 181,
    number: 184,
    rooms: 2,
    area: 61.4,
    price: 9_460_000,
    matchScore: 94,
    riskLevel: 'warning',
    riskText: 'Поставка дверей смещена на 9 дней; срок сдачи корпуса пока без изменений.',
  },
  'north-3-f18': {
    base: 239,
    number: 241,
    rooms: 3,
    area: 78.9,
    price: 12_940_000,
    matchScore: 91,
  },
  'river-1-f7': { base: 66, number: 68, rooms: 1, area: 39.2, price: 6_890_000, matchScore: 96 },
  'river-1-f11': {
    base: 154,
    number: 156,
    rooms: 2,
    area: 64.8,
    price: 10_140_000,
    matchScore: 87,
  },
}

const stableHash = (value: string) => {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const floorSeeds: FloorSeed[] = floorConfigs.flatMap((config) =>
  Array.from({ length: config.to - config.from + 1 }, (_, index) => {
    const number = config.from + index
    const id = `${config.buildingId}-f${number}`
    return {
      id,
      buildingId: config.buildingId,
      number,
      base: pinnedUnits[id]?.base ?? config.firstBase + index * 12,
    }
  }),
)

const layoutForFloor = (floorId: string) =>
  layoutTemplates[stableHash(floorId) % layoutTemplates.length]!

const floors: ApartmentFloor[] = floorSeeds.map((floor) => {
  const layout = layoutForFloor(floor.id)
  return {
    id: floor.id,
    buildingId: floor.buildingId,
    number: floor.number,
    label: `${floor.number} этаж`,
    planId: `plan-${floor.id}`,
    layoutId: layout.id,
  }
})

const roundOne = (value: number) => Math.round(value * 10) / 10

const createRegion = (
  slot: LayoutSlot,
  apartment: Apartment,
  apartmentIndex: number,
): ApartmentPlanRegion => {
  const serviceHeight = Math.min(82, Math.round(slot.height * 0.34))
  const serviceTop = slot.entry === 'bottom' ? slot.y + slot.height - serviceHeight : slot.y
  const livingTop = slot.entry === 'bottom' ? slot.y : slot.y + serviceHeight
  const livingHeight = slot.height - serviceHeight
  const segmentWidth = slot.width / apartment.rooms
  const kitchenArea = apartment.rooms === 1 ? 7.6 : apartment.rooms === 2 ? 9.6 : 10.8
  const bathArea = 4.2
  const toiletArea = apartment.rooms === 1 ? 0 : 2.1
  const hallArea = apartment.rooms === 1 ? 5.8 : apartment.rooms === 2 ? 7.2 : 9.1
  const livingArea = Math.max(
    apartment.area - kitchenArea - bathArea - toiletArea - hallArea,
    apartment.rooms * 9,
  )
  const livingRoomArea = roundOne(livingArea / apartment.rooms)
  const serviceBoundary = slot.entry === 'bottom' ? serviceTop : serviceTop + serviceHeight
  const dividerXs = [0.4, 0.62, 0.76].map((ratio) => roundOne(slot.x + slot.width * ratio))

  const rooms = Array.from({ length: apartment.rooms }, (_, index) => ({
    id: `living-${index}`,
    label: 'Жилая комната',
    area:
      index === apartment.rooms - 1
        ? roundOne(livingArea - livingRoomArea * (apartment.rooms - 1))
        : livingRoomArea,
    x: roundOne(slot.x + segmentWidth * (index + 0.5)),
    y: roundOne(livingTop + livingHeight * 0.62),
  }))

  rooms.push(
    {
      id: 'kitchen',
      label: 'Кухня',
      area: kitchenArea,
      x: roundOne(slot.x + slot.width * 0.2),
      y: roundOne(serviceTop + serviceHeight * 0.67),
    },
    {
      id: 'bath',
      label: 'Ванная',
      area: bathArea,
      x: roundOne(slot.x + slot.width * 0.51),
      y: roundOne(serviceTop + serviceHeight * 0.67),
    },
  )

  if (toiletArea) {
    rooms.push({
      id: 'wc',
      label: 'С/у',
      area: toiletArea,
      x: roundOne(slot.x + slot.width * 0.69),
      y: roundOne(serviceTop + serviceHeight * 0.67),
    })
  }

  rooms.push({
    id: 'hall',
    label: 'Прихожая',
    area: hallArea,
    x: roundOne(slot.x + slot.width * 0.87),
    y: roundOne(serviceTop + serviceHeight * 0.67),
  })

  const walls = [
    `M${slot.x} ${serviceBoundary}H${slot.x + slot.width}`,
    ...Array.from(
      { length: apartment.rooms - 1 },
      (_, index) =>
        `M${roundOne(slot.x + segmentWidth * (index + 1))} ${livingTop}V${roundOne(livingTop + livingHeight)}`,
    ),
    ...dividerXs.map((x) => `M${x} ${serviceTop}V${roundOne(serviceTop + serviceHeight)}`),
  ]

  const openings = [
    ...Array.from({ length: apartment.rooms }, (_, index) => ({
      id: `window-${index}`,
      kind: 'window' as const,
      x: roundOne(slot.x + segmentWidth * (index + 0.25)),
      y: slot.entry === 'bottom' ? slot.y : slot.y + slot.height,
      width: roundOne(Math.min(56, segmentWidth * 0.5)),
      rotation: 0,
    })),
    ...Array.from({ length: apartment.rooms }, (_, index) => ({
      id: `room-door-${index}`,
      kind: 'door' as const,
      x: roundOne(slot.x + segmentWidth * (index + 0.5) - 9),
      y: serviceBoundary,
      width: 18,
      rotation: 0,
      flip: slot.entry === 'top',
    })),
    {
      id: 'entry',
      kind: 'door' as const,
      x: slot.x + slot.width - 48,
      y: slot.entry === 'bottom' ? slot.y + slot.height : slot.y,
      width: 22,
      rotation: 0,
      flip: slot.entry === 'bottom',
    },
  ]

  const fixtures = [
    {
      id: 'counter',
      kind: 'counter' as const,
      x: slot.x + 7,
      y: serviceTop + 8,
      rotation: 90,
      scale: 1.15,
    },
    {
      id: 'stove',
      kind: 'stove' as const,
      x: slot.x + slot.width * 0.28,
      y: serviceTop + 10,
    },
    {
      id: 'bath',
      kind: 'bath' as const,
      x: slot.x + slot.width * 0.43,
      y: serviceTop + 7,
      rotation: 90,
    },
    {
      id: 'toilet',
      kind: 'toilet' as const,
      x: slot.x + slot.width * 0.65,
      y: serviceTop + 8,
    },
    {
      id: 'wardrobe',
      kind: 'wardrobe' as const,
      x: slot.x + slot.width * 0.8,
      y: serviceTop + 8,
    },
  ]

  return {
    apartmentId: apartment.id,
    points: `${slot.x},${slot.y} ${slot.x + slot.width},${slot.y} ${slot.x + slot.width},${slot.y + slot.height} ${slot.x},${slot.y + slot.height}`,
    labelX: slot.x + slot.width / 2,
    labelY: livingTop + 27,
    walls,
    rooms,
    openings,
    fixtures: apartmentIndex % 2 === 0 ? fixtures : [...fixtures].reverse(),
  }
}

const projectByBuilding = new Map(buildings.map((building) => [building.id, building.projectId]))
const buildingById = new Map(buildings.map((building) => [building.id, building]))
const apartments: Apartment[] = []
const plans: FloorPlan[] = []

for (const floor of floorSeeds) {
  const layout = layoutForFloor(floor.id)
  const pinned = pinnedUnits[floor.id]
  const slots = layout.slots.map((slot) => ({ ...slot }))

  if (pinned) {
    const pinnedIndex = pinned.number - floor.base
    const compatibleIndex = slots.findIndex(
      (slot, index) => slot.rooms === pinned.rooms && index !== pinnedIndex,
    )
    if (compatibleIndex >= 0 && slots[pinnedIndex]?.rooms !== pinned.rooms) {
      const pinnedSlot = slots[pinnedIndex]!
      slots[pinnedIndex] = slots[compatibleIndex]!
      slots[compatibleIndex] = pinnedSlot
    }
  }

  const floorApartments = slots.map((slot, index) => {
    const number = floor.base + index
    const isPinned = pinned?.number === number
    const id = isPinned ? `apt-${number}` : `apt-${floor.id}-${number}`
    const areaSeed = stableHash(`${floor.id}:${index}:area`) % 40
    const area =
      slot.rooms === 1
        ? roundOne(37 + areaSeed / 10)
        : slot.rooms === 2
          ? roundOne(57 + areaSeed / 4)
          : roundOne(74 + areaSeed / 4)
    const availabilityRoll = stableHash(`${floor.id}:${index}:status`) % 10
    const building = buildingById.get(floor.buildingId)!
    const apartment: Apartment = {
      id,
      number,
      projectId: projectByBuilding.get(floor.buildingId)!,
      buildingId: floor.buildingId,
      floorId: floor.id,
      rooms: slot.rooms,
      area,
      price: Math.round((area * (151_000 + floor.number * 850)) / 10_000) * 10_000,
      finish: index % 2 === 0 ? 'White box' : 'Чистовая',
      completion: building.completion,
      matchScore: 75 + (stableHash(`${floor.id}:${index}:match`) % 21),
      matchReasons: [
        'Подходит по бюджету',
        index % 2 === 0 ? 'Этаж в приоритете' : 'Нужная отделка',
      ],
      riskLevel: 'none',
      ...(isPinned ? pinned : {}),
      status:
        isPinned || (pinned && index === 0)
          ? 'available'
          : availabilityRoll < 7
            ? 'available'
            : availabilityRoll < 9
              ? 'reserved'
              : 'sold',
    }
    return apartment
  })

  apartments.push(...floorApartments)
  plans.push({
    id: `plan-${floor.id}`,
    floorId: floor.id,
    layoutId: layout.id,
    layoutName: layout.name,
    viewBox: '0 0 1000 720',
    core: layout.core,
    regions: slots.map((slot, index) => createRegion(slot, floorApartments[index]!, index)),
  })
}

export const mockApartmentCatalog: ApartmentCatalog = {
  projects,
  buildings,
  floors,
  apartments,
  plans,
}
