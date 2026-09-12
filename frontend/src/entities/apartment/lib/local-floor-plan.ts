import type { Apartment, ApartmentPlanRegion, FloorPlan, PlanCore } from '@/shared/api/contracts'
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

// Versioned local display geometry only. Never creates commercial inventory.
export function localFloorPlan(
  buildingId: number,
  floor: number,
  apartments: Apartment[],
): FloorPlan | null {
  const compatible = layoutTemplates.filter(
    (t) =>
      t.slots.length === apartments.length &&
      [1, 2, 3].every(
        (n) =>
          t.slots.filter((s) => s.rooms === n).length ===
          apartments.filter((a) => a.rooms === n).length,
      ),
  )
  if (!compatible.length) return null
  const key = `v1:${buildingId}:${floor}`
  let hash = 2166136261
  for (const c of key) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619)
  const template = compatible[(hash >>> 0) % compatible.length]!
  const remaining = [...apartments].sort((a, b) => Number(a.id) - Number(b.id))
  const regions = template.slots.map((slot, index) => {
    const at = remaining.findIndex((a) => a.rooms === slot.rooms)
    const apartment = remaining.splice(at, 1)[0]!
    const region = createRegion(slot, apartment, index)
    // Room dimensions are not supplied by the backend. Do not invent room areas.
    return { ...region, rooms: region.rooms.map((room) => ({ ...room, area: undefined })) }
  })
  return {
    id: key,
    floorId: `${buildingId}:${floor}`,
    layoutId: template.id,
    layoutName: template.name,
    viewBox: '0 0 1000 720',
    core: template.core,
    regions,
  }
}
