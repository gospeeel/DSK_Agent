<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import {
  apartmentQueries,
  getApartmentLabel,
  type Apartment,
  type ApartmentCatalog,
} from '@/entities/apartment'
import { formatCurrency } from '@/shared/lib/format'
import { useApartmentSelectionStore } from '../model/apartment-selection.store'
import ApartmentDetails from './ApartmentDetails.vue'
import FloorPlanCanvas from './FloorPlanCanvas.vue'

const props = defineProps<{ open: boolean; initialApartmentId?: string }>()
const emit = defineEmits<{ close: []; select: [apartment: Apartment] }>()
const store = useApartmentSelectionStore()
const catalogQuery = useQuery(apartmentQueries.catalog())
const closeButton = useTemplateRef('closeButton')
const zoom = shallowRef(1)

const catalog = computed(() => catalogQuery.data.value)
const buildings = computed(
  () => catalog.value?.buildings.filter((building) => building.projectId === store.projectId) ?? [],
)
const floors = computed(
  () => catalog.value?.floors.filter((floor) => floor.buildingId === store.buildingId) ?? [],
)
const floorApartments = computed(
  () => catalog.value?.apartments.filter((apartment) => apartment.floorId === store.floorId) ?? [],
)
const floorPlan = computed(() =>
  catalog.value?.plans.find((plan) => plan.floorId === store.floorId),
)
const selectedApartment = computed(() =>
  catalog.value?.apartments.find((apartment) => apartment.id === store.selectedApartmentId),
)
const availableCount = computed(
  () => floorApartments.value.filter((apartment) => apartment.status === 'available').length,
)

const projectModel = computed({
  get: () => store.projectId,
  set: (value: string) => catalog.value && store.selectProject(catalog.value, value),
})
const buildingModel = computed({
  get: () => store.buildingId,
  set: (value: string) => catalog.value && store.selectBuilding(catalog.value, value),
})
const floorModel = computed({
  get: () => store.floorId,
  set: (value: string) => catalog.value && store.selectFloor(catalog.value, value),
})

const initialize = (nextCatalog: ApartmentCatalog) => {
  store.initialize(nextCatalog, props.initialApartmentId)
  zoom.value = 1
  nextTick(() => closeButton.value?.focus())
}

watch(
  [() => props.open, catalog],
  ([isOpen, nextCatalog]) => {
    if (isOpen && nextCatalog) initialize(nextCatalog)
  },
  { immediate: true },
)

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

const onKeydown = (event: KeyboardEvent) => {
  if (props.open && event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

const selectApartment = (apartmentId: string) => {
  store.selectedApartmentId = apartmentId
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[80] flex bg-ink/65 p-0 sm:p-3"
      role="presentation"
      @mousedown.self="emit('close')"
    >
      <section
        class="m-auto flex h-[100dvh] w-full max-w-[1500px] flex-col overflow-hidden bg-sheet shadow-2xl sm:h-[calc(100dvh-1.5rem)] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apartment-selector-title"
      >
        <header class="shrink-0 border-b border-ink/10 bg-sheet px-4 py-4 sm:px-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 id="apartment-selector-title" class="text-xl font-semibold tracking-[-0.02em]">
                  Выбор квартиры
                </h2>
                <span
                  class="rounded bg-signal/15 px-2 py-1 text-[11px] font-semibold text-[#815309]"
                >
                  ДЕМОКАТАЛОГ
                </span>
              </div>
              <p class="mt-1 text-sm text-muted">Нажмите на квартиру, чтобы проверить параметры</p>
            </div>
            <button
              ref="closeButton"
              class="grid size-10 shrink-0 place-items-center rounded-lg border border-ink/12 text-2xl leading-none text-muted hover:bg-paper hover:text-ink"
              type="button"
              aria-label="Закрыть выбор квартиры"
              @click="emit('close')"
            >
              ×
            </button>
          </div>

          <div v-if="catalog" class="mt-4 grid gap-2 sm:grid-cols-3 lg:max-w-[920px]">
            <label class="block">
              <span class="sr-only">Жилой комплекс</span>
              <select
                v-model="projectModel"
                class="h-10 w-full rounded-lg border border-ink/15 bg-white px-3 text-sm font-medium"
              >
                <option v-for="project in catalog.projects" :key="project.id" :value="project.id">
                  {{ project.name }}
                </option>
              </select>
            </label>
            <label class="block">
              <span class="sr-only">Корпус</span>
              <select
                v-model="buildingModel"
                class="h-10 w-full rounded-lg border border-ink/15 bg-white px-3 text-sm font-medium"
              >
                <option v-for="building in buildings" :key="building.id" :value="building.id">
                  {{ building.name }} · готовность {{ building.readiness }}%
                </option>
              </select>
            </label>
            <label class="block">
              <span class="sr-only">Этаж</span>
              <select
                v-model="floorModel"
                data-testid="floor-selector"
                class="h-10 w-full rounded-lg border border-ink/15 bg-white px-3 text-sm font-medium"
              >
                <option v-for="floor in floors" :key="floor.id" :value="floor.id">
                  {{ floor.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="mt-3 flex items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <strong v-if="floorPlan" class="font-semibold text-ink">
                {{ floorPlan.layoutName }}
              </strong>
              <span><i class="mr-1.5 inline-block size-2.5 bg-[#dcedd8]" />В продаже</span>
              <span><i class="mr-1.5 inline-block size-2.5 bg-[#eee8db]" />Бронь</span>
              <span><i class="mr-1.5 inline-block size-2.5 bg-[#d8d9d5]" />Продана</span>
              <strong class="font-semibold text-ink">{{ availableCount }} доступно</strong>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button
                class="grid size-9 place-items-center rounded-md border border-ink/12 text-lg hover:bg-paper disabled:opacity-40"
                type="button"
                aria-label="Уменьшить масштаб"
                :disabled="zoom <= 0.8"
                @click="zoom = Math.max(0.8, zoom - 0.2)"
              >
                −
              </button>
              <span class="w-12 text-center text-xs tabular-nums"
                >{{ Math.round(zoom * 100) }}%</span
              >
              <button
                class="grid size-9 place-items-center rounded-md border border-ink/12 text-lg hover:bg-paper disabled:opacity-40"
                type="button"
                aria-label="Увеличить масштаб"
                :disabled="zoom >= 2"
                @click="zoom = Math.min(2, zoom + 0.2)"
              >
                +
              </button>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 rounded-lg bg-paper p-1 lg:hidden">
            <button
              class="h-9 rounded-md text-sm font-semibold"
              :class="store.mobileView === 'plan' ? 'bg-white text-ink shadow-sm' : 'text-muted'"
              type="button"
              @click="store.mobileView = 'plan'"
            >
              На плане
            </button>
            <button
              class="h-9 rounded-md text-sm font-semibold"
              :class="store.mobileView === 'list' ? 'bg-white text-ink shadow-sm' : 'text-muted'"
              type="button"
              @click="store.mobileView = 'list'"
            >
              Списком
            </button>
          </div>
        </header>

        <div
          v-if="catalogQuery.isPending.value"
          class="grid flex-1 place-items-center text-sm text-muted"
        >
          Загружаем каталог квартир…
        </div>
        <div
          v-else-if="catalogQuery.isError.value || !catalog"
          class="grid flex-1 place-items-center p-6 text-risk"
        >
          Не удалось загрузить каталог квартир.
        </div>
        <div
          v-else
          class="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden"
        >
          <main class="min-w-0 lg:overflow-auto">
            <FloorPlanCanvas
              v-if="floorPlan && store.mobileView === 'plan'"
              :plan="floorPlan"
              :apartments="floorApartments"
              :selected-apartment-id="store.selectedApartmentId"
              :zoom="zoom"
              @select="selectApartment"
            />
            <div v-else-if="store.mobileView === 'list'" class="divide-y divide-ink/10 lg:hidden">
              <button
                v-for="apartment in floorApartments"
                :key="apartment.id"
                class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left disabled:opacity-45"
                :class="apartment.id === store.selectedApartmentId ? 'bg-signal/10' : 'bg-sheet'"
                type="button"
                :disabled="apartment.status !== 'available'"
                @click="selectApartment(apartment.id)"
              >
                <span>
                  <strong class="block text-sm">{{ getApartmentLabel(apartment) }}</strong>
                  <small class="mt-1 block text-muted">{{ apartment.finish }}</small>
                </span>
                <strong class="text-sm tabular-nums">{{ formatCurrency(apartment.price) }}</strong>
              </button>
            </div>
          </main>

          <ApartmentDetails
            :apartment="selectedApartment"
            :catalog="catalog"
            @choose="emit('select', $event)"
          />
        </div>
      </section>
    </div>
  </Teleport>
</template>
