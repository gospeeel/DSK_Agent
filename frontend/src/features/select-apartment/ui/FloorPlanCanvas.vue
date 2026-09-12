<script setup lang="ts">
import { computed } from 'vue'

import type { Apartment, FloorPlan, PlanFixture, PlanOpening } from '@/entities/apartment'
import { formatCurrency } from '@/shared/lib/format'

const props = defineProps<{
  plan: FloorPlan
  apartments: Apartment[]
  selectedApartmentId: string
  zoom: number
}>()

const emit = defineEmits<{ select: [apartmentId: string] }>()
const apartmentsById = computed(
  () => new Map(props.apartments.map((apartment) => [apartment.id, apartment])),
)

const apartmentFor = (id: string) => apartmentsById.value.get(id)

const regionFillClass = (apartment: Apartment | undefined) => {
  if (!apartment) return 'fill-[#ecebe6]'
  if (props.selectedApartmentId === apartment.id) return 'fill-[#f4d69f]'
  if (apartment.status === 'sold') return 'fill-[#d8d9d5]'
  if (apartment.status === 'reserved') return 'fill-[url(#reserved-hatch)]'
  return 'fill-[#dcedd8] group-hover:fill-[#cfe7ca]'
}

const regionStrokeClass = (apartment: Apartment | undefined) =>
  props.selectedApartmentId === apartment?.id ? 'stroke-blueprint' : 'stroke-[#68777c]'

const regionTextClass = (apartment: Apartment | undefined) =>
  apartment?.status === 'sold' ? 'fill-[#49585d]' : 'fill-[#34474f]'

const select = (apartment: Apartment | undefined) => {
  if (apartment?.status === 'available') emit('select', apartment.id)
}

const openingTransform = (opening: PlanOpening) =>
  `translate(${opening.x} ${opening.y}) rotate(${opening.rotation})${opening.flip ? ' scale(1 -1)' : ''}`

const doorArc = (width: number) => `M0 0 A${width} ${width} 0 0 1 ${width} ${width}`
const doorLeaf = (width: number) => `M0 0 ${width} ${width}`

const fixtureTransform = (fixture: PlanFixture) =>
  `translate(${fixture.x} ${fixture.y}) rotate(${fixture.rotation ?? 0}) scale(${fixture.scale ?? 1})`

const coreGeometry = computed(() => {
  const core = props.plan.core
  const padding = 12
  const gap = 8
  const liftHeight = core.height - 38
  const liftWidth = (core.width * 0.56 - padding - gap * core.lifts) / core.lifts
  const stairY = core.y + padding
  const stairHeight = core.height - 38

  return {
    lifts: Array.from({ length: core.lifts }, (_, index) => ({
      x: core.x + padding + index * (liftWidth + gap),
      y: core.y + padding,
      width: liftWidth,
      height: liftHeight,
    })),
    stairs: {
      x: core.x + core.width * 0.59,
      y: stairY,
      width: core.width * 0.41 - padding,
      height: stairHeight,
    },
  }
})
</script>

<template>
  <div
    class="min-h-[430px] overflow-auto bg-[#dfe2dd] p-3 sm:p-5"
    data-testid="floor-plan"
    :data-layout-id="plan.layoutId"
  >
    <svg
      :viewBox="plan.viewBox"
      class="mx-auto block h-auto bg-sheet shadow-[0_12px_40px_rgba(23,34,41,0.1)]"
      :style="{ width: `${zoom * 100}%`, minWidth: `${zoom * 1000}px` }"
      aria-label="Интерактивный архитектурный план этажа"
    >
      <defs>
        <pattern
          id="reserved-hatch"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="10" height="10" fill="#f2eadb" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#cbb58e" stroke-width="2.5" />
        </pattern>

        <symbol id="fixture-bath" viewBox="0 0 28 14">
          <rect x="1" y="1" width="26" height="12" rx="5" />
          <path d="M4 5h20M7 5v6" />
        </symbol>
        <symbol id="fixture-toilet" viewBox="0 0 14 20">
          <rect x="3" y="1" width="8" height="5" rx="1" />
          <ellipse cx="7" cy="12" rx="5" ry="6" />
          <ellipse cx="7" cy="12" rx="2.5" ry="3.5" />
        </symbol>
        <symbol id="fixture-sink" viewBox="0 0 16 16">
          <rect x="1" y="1" width="14" height="14" rx="2" />
          <ellipse cx="8" cy="9" rx="4.5" ry="3.5" />
          <path d="M8 2v3" />
        </symbol>
        <symbol id="fixture-stove" viewBox="0 0 18 18">
          <rect x="1" y="1" width="16" height="16" />
          <circle cx="6" cy="6" r="2.3" />
          <circle cx="12" cy="6" r="2.3" />
          <circle cx="6" cy="12" r="2.3" />
          <circle cx="12" cy="12" r="2.3" />
        </symbol>
        <symbol id="fixture-counter" viewBox="0 0 34 9">
          <rect x="1" y="1" width="32" height="7" />
          <path d="M12 1v7M23 1v7" />
        </symbol>
        <symbol id="fixture-wardrobe" viewBox="0 0 28 10">
          <rect x="1" y="1" width="26" height="8" />
          <path d="M14 1v8M4 3l7 4m13-4-7 4" />
        </symbol>
      </defs>

      <rect
        x="20"
        y="285"
        width="960"
        height="120"
        fill="#fbfaf6"
        stroke="#65757b"
        stroke-width="3"
      />

      <g
        v-for="region in plan.regions"
        :key="region.apartmentId"
        class="group outline-none"
        :class="apartmentFor(region.apartmentId)?.status === 'available' ? 'cursor-pointer' : ''"
        :role="apartmentFor(region.apartmentId)?.status === 'available' ? 'button' : 'img'"
        :tabindex="apartmentFor(region.apartmentId)?.status === 'available' ? 0 : -1"
        @click="select(apartmentFor(region.apartmentId))"
        @keydown.enter="select(apartmentFor(region.apartmentId))"
        @keydown.space.prevent="select(apartmentFor(region.apartmentId))"
      >
        <title v-if="apartmentFor(region.apartmentId)">
          Квартира № {{ apartmentFor(region.apartmentId)?.number }},
          {{ apartmentFor(region.apartmentId)?.area }} м²,
          {{ formatCurrency(apartmentFor(region.apartmentId)?.price ?? 0) }}
        </title>
        <polygon
          :points="region.points"
          class="stroke-[5] transition-colors duration-150 group-focus-visible:stroke-signal group-focus-visible:stroke-[8]"
          :class="[
            regionFillClass(apartmentFor(region.apartmentId)),
            regionStrokeClass(apartmentFor(region.apartmentId)),
          ]"
          stroke-linejoin="miter"
        />

        <path
          v-for="wall in region.walls"
          :key="wall"
          :d="wall"
          fill="none"
          stroke="#68777c"
          stroke-width="3.5"
          pointer-events="none"
        />

        <g
          v-for="opening in region.openings"
          :key="opening.id"
          :transform="openingTransform(opening)"
          pointer-events="none"
        >
          <template v-if="opening.kind === 'door'">
            <line x1="-2" y1="0" :x2="opening.width + 2" y2="0" stroke="#fffdf8" stroke-width="7" />
            <path :d="doorLeaf(opening.width)" fill="none" stroke="#69787e" stroke-width="1.5" />
            <path :d="doorArc(opening.width)" fill="none" stroke="#9aa6aa" stroke-width="1.1" />
          </template>
          <template v-else>
            <line x1="0" y1="0" :x2="opening.width" y2="0" stroke="#fffdf8" stroke-width="8" />
            <line
              x1="0"
              y1="-2.3"
              :x2="opening.width"
              y2="-2.3"
              stroke="#4f91aa"
              stroke-width="1.5"
            />
            <line
              x1="0"
              y1="2.3"
              :x2="opening.width"
              y2="2.3"
              stroke="#4f91aa"
              stroke-width="1.5"
            />
          </template>
        </g>

        <g
          v-for="fixture in region.fixtures"
          :key="fixture.id"
          :transform="fixtureTransform(fixture)"
          fill="none"
          stroke="#65757b"
          stroke-width="1.25"
          pointer-events="none"
        >
          <use :href="`#fixture-${fixture.kind}`" width="28" height="20" />
        </g>

        <g v-for="room in region.rooms" :key="room.id" pointer-events="none">
          <text
            :x="room.x"
            :y="room.y - 3"
            text-anchor="middle"
            class="text-[11px] font-medium"
            :class="regionTextClass(apartmentFor(region.apartmentId))"
          >
            {{
              room.label === 'Жилая комната'
                ? 'Комната'
                : room.label === 'Прихожая'
                  ? 'Холл'
                  : room.label
            }}
          </text>
          <text
            :x="room.x"
            :y="room.y + 10"
            text-anchor="middle"
            class="text-[11px] font-semibold tabular-nums"
            :class="regionTextClass(apartmentFor(region.apartmentId))"
          >
            {{ room.area?.toLocaleString('ru-RU') }}
          </text>
        </g>

        <g :transform="`translate(${region.labelX} ${region.labelY})`" pointer-events="none">
          <rect
            x="-25"
            y="-15"
            width="50"
            height="24"
            rx="4"
            :fill="selectedApartmentId === region.apartmentId ? '#173f5f' : '#fffdf8'"
            stroke="#68777c"
            stroke-width="1.5"
          />
          <text
            y="2"
            text-anchor="middle"
            class="text-[12px] font-bold"
            :fill="selectedApartmentId === region.apartmentId ? '#fffdf8' : '#173f5f'"
          >
            № {{ apartmentFor(region.apartmentId)?.number }}
          </text>
          <circle
            v-if="selectedApartmentId === region.apartmentId"
            cx="28"
            cy="-14"
            r="9"
            fill="#e9a23b"
          />
          <path
            v-if="selectedApartmentId === region.apartmentId"
            d="m24 -14 3 3 5-7"
            fill="none"
            stroke="#173f5f"
            stroke-width="2.4"
          />
          <text
            v-if="apartmentFor(region.apartmentId)?.status !== 'available'"
            y="24"
            text-anchor="middle"
            class="fill-muted text-[10px] font-semibold uppercase tracking-wide"
          >
            {{ apartmentFor(region.apartmentId)?.status === 'sold' ? 'Продана' : 'Бронь' }}
          </text>
        </g>
      </g>

      <g pointer-events="none">
        <rect
          :x="plan.core.x"
          :y="plan.core.y"
          :width="plan.core.width"
          :height="plan.core.height"
          fill="#fffdf8"
          stroke="#65757b"
          stroke-width="5"
        />

        <g
          v-for="(lift, index) in coreGeometry.lifts"
          :key="`lift-${index}`"
          fill="#f0f1ed"
          stroke="#65757b"
          stroke-width="2"
        >
          <rect :x="lift.x" :y="lift.y" :width="lift.width" :height="lift.height" />
          <path
            :d="`M${lift.x + 5} ${lift.y + 5}L${lift.x + lift.width - 5} ${lift.y + lift.height - 5}M${lift.x + lift.width - 5} ${lift.y + 5}L${lift.x + 5} ${lift.y + lift.height - 5}`"
            stroke="#97a3a7"
            stroke-width="1.2"
          />
          <text
            :x="lift.x + lift.width / 2"
            :y="lift.y + lift.height + 17"
            text-anchor="middle"
            class="fill-[#34474f] text-[10px] font-semibold"
            stroke="none"
          >
            ЛИФТ
          </text>
        </g>

        <rect
          :x="coreGeometry.stairs.x"
          :y="coreGeometry.stairs.y"
          :width="coreGeometry.stairs.width"
          :height="coreGeometry.stairs.height"
          fill="#fffdf8"
          stroke="#65757b"
          stroke-width="2"
        />
        <g fill="none" stroke="#748389" stroke-width="1.4">
          <line
            v-for="step in 7"
            :key="`step-${step}`"
            :x1="coreGeometry.stairs.x"
            :y1="coreGeometry.stairs.y + (coreGeometry.stairs.height / 8) * step"
            :x2="coreGeometry.stairs.x + coreGeometry.stairs.width"
            :y2="coreGeometry.stairs.y + (coreGeometry.stairs.height / 8) * step"
          />
          <path
            :d="`M${coreGeometry.stairs.x + coreGeometry.stairs.width / 2} ${coreGeometry.stairs.y + coreGeometry.stairs.height - 4}V${coreGeometry.stairs.y + 4}m-5 6 5-6 5 6`"
          />
        </g>
        <path
          :d="`M${plan.core.x - 24} 345h24M${plan.core.x + plan.core.width} 345h24`"
          fill="none"
          stroke="#a0aaad"
          stroke-width="2"
        />
        <text
          :x="coreGeometry.stairs.x + coreGeometry.stairs.width / 2"
          :y="plan.core.y + plan.core.height - 9"
          text-anchor="middle"
          class="fill-muted text-[9px] font-semibold"
        >
          ЛЕСТНИЦА
        </text>

        <circle cx="950" cy="370" r="10" fill="#fffdf8" stroke="#65757b" stroke-width="2" />
        <path d="M950 375v-19m0 0-5 7m5-7 5 7" fill="none" stroke="#65757b" stroke-width="1.8" />
        <text x="950" y="351" text-anchor="middle" class="fill-muted text-[9px] font-semibold">
          СЕВЕР
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
symbol > * {
  vector-effect: non-scaling-stroke;
}
</style>
