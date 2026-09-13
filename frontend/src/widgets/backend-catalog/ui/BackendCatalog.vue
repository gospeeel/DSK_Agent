<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { formatCurrency } from '@/shared/lib/format'
import { FloorPlanCanvas } from '@/features/select-apartment'
import { BuildingEditor } from '@/features/edit-building'
import { CreateCatalogEntry } from '@/features/create-catalog-entry'
import { DiscountPolicyManager } from '@/features/manage-discount-policy'
import { AncillaryInventory } from '@/features/ancillary-inventory'
import { ErpSnapshot } from '@/features/erp-snapshot'
import { ApartmentEditor, ComplexEditor, ProgressEditor } from '@/features/edit-catalog'
import { useBackendCatalog } from '../model/use-backend-catalog'
const props = defineProps<{ objectId?: string }>()
const c = useBackendCatalog(() => props.objectId)
const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('ru-RU') : 'Не указана'
const stages = {
  excavation: 'Котлован',
  foundation: 'Фундамент',
  frame: 'Каркас',
  roofing: 'Кровля',
  finishing: 'Отделка',
}
</script>
<template>
  <div class="space-y-5">
    <section class="rounded-xl border border-ink/10 bg-sheet p-5">
      <RouterLink v-if="objectId" to="/construction" class="text-sm text-blueprint underline"
        >К каталогу</RouterLink
      >
      <ApiState
        v-else
        :pending="c.complexes.isPending.value"
        :error="c.complexes.error.value"
        :empty="!c.complexes.data.value?.length"
        empty-text="Жилые комплексы ещё не добавлены."
        @retry="c.complexes.refetch()"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm"
            >Жилой комплекс<select
              v-model="c.complexId.value"
              class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
            >
              <option
                v-for="complex in c.complexes.data.value"
                :key="complex.id"
                :value="complex.id"
              >
                {{ complex.name }}
              </option>
            </select></label
          >
          <div>
            <ApiState
              :pending="c.buildings.isPending.value"
              :error="c.buildings.error.value"
              :empty="!c.buildings.data.value?.length"
              empty-text="Корпуса не добавлены."
              @retry="c.buildings.refetch()"
              ><label class="block text-sm"
                >Корпус<select
                  v-model="c.selectedBuilding.value"
                  class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
                >
                  <option
                    v-for="building in c.buildings.data.value"
                    :key="building.id"
                    :value="building.id"
                  >
                    {{ building.address }}
                  </option>
                </select></label
              ></ApiState
            >
          </div>
        </div>
      </ApiState>
      <ComplexEditor
        v-if="!objectId && c.selectedComplex.value"
        :complex="c.selectedComplex.value"
        :role="c.session.user?.role"
      />
      <ApiState
        v-if="c.buildingId.value !== null"
        :pending="c.building.isPending.value"
        :error="c.building.error.value"
        @retry="c.building.refetch()"
        ><div v-if="c.building.data.value" class="mt-5">
          <h2 class="text-xl font-semibold">{{ c.building.data.value.address }}</h2>
          <p class="mt-2 text-sm text-muted">
            {{ c.building.data.value.district }} · {{ c.building.data.value.floors_count }} этажей
          </p>
          <p class="mt-3 text-sm">
            {{
              c.session.isStaff
                ? `Плановая дата: ${date(c.building.data.value.planned_date)}`
                : 'Срок сдачи уточняйте у менеджера.'
            }}
          </p>
          <p v-if="c.building.data.value.actual_date" class="mt-2 text-sm">
            Фактическая сдача: {{ date(c.building.data.value.actual_date) }}
          </p>
          <p v-if="c.building.data.value.readiness_percent != null" class="mt-2 text-sm">
            Общая готовность: <strong>{{ c.building.data.value.readiness_percent }}%</strong>
          </p>
          <p v-if="c.session.isStaff && c.building.data.value.forecast_date" class="mt-2 text-sm">
            Прогноз: {{ date(c.building.data.value.forecast_date) }}<template v-if="c.building.data.value.delivery_shift_days"> · сдвиг {{ c.building.data.value.delivery_shift_days }} дн.</template>
          </p>
          <RouterLink
            v-if="!objectId"
            :to="`/construction/${c.building.data.value.id}`"
            class="mt-3 inline-block text-sm text-blueprint underline"
            >Открыть карточку объекта</RouterLink
          >
        </div></ApiState
      >
      <BuildingEditor
        v-if="c.building.data.value"
        :building="c.building.data.value"
        :role="c.session.user?.role"
      />
      <DiscountPolicyManager
        v-if="c.session.user?.role === 'supervisor' && c.buildingId.value"
        :building-id="c.buildingId.value"
      />
      <CreateCatalogEntry
        v-if="c.session.isStaff"
        :complex-id="c.complexId.value"
        :building-id="c.buildingId.value"
      />
    </section>
    <AncillaryInventory
      v-if="c.buildingId.value"
      :building-id="c.buildingId.value"
      :audience="c.session.audience"
      :can-create="c.session.isStaff"
      :can-edit="c.session.user?.role === 'supervisor'"
    />
    <ErpSnapshot v-if="c.session.isStaff && c.buildingId.value" :building-id="c.buildingId.value" />
    <section
      v-if="c.buildingId.value !== null"
      class="rounded-xl border border-ink/10 bg-sheet p-5"
    >
      <h2 class="text-lg font-semibold">Квартиры</h2>
      <ApiState
        :pending="c.units.isPending.value"
        :error="c.units.error.value"
        :empty="!c.units.data.value?.length"
        empty-text="Квартиры в этом корпусе пока отсутствуют."
        @retry="c.units.refetch()"
      >
        <p class="mt-2 text-sm text-muted">
          {{ c.counts.value.free }} в продаже · {{ c.counts.value.booked }} в брони ·
          {{ c.counts.value.sold }} продано
        </p>
        <div class="my-4 flex flex-wrap items-end gap-3">
          <label class="text-sm"
            >Этаж<select
              v-model="c.floor.value"
              data-testid="floor-selector"
              class="ml-3 h-10 rounded-lg border border-ink/20 px-3"
            >
              <option v-for="floor in c.floors.value" :key="floor" :value="floor">
                {{ floor }}
              </option>
            </select></label
          ><button
            class="rounded-lg border border-ink/20 px-3 py-2 text-sm"
            @click="c.view.value = c.view.value === 'plan' ? 'list' : 'plan'"
          >
            {{ c.view.value === 'plan' ? 'Списком' : 'На схеме' }}</button
          ><template v-if="c.view.value === 'plan' && c.plan.value"
            ><button
              aria-label="Уменьшить масштаб"
              class="rounded border px-3 py-2"
              :disabled="c.zoom.value <= 0.8"
              @click="c.zoom.value = Math.max(0.8, c.zoom.value - 0.2)"
            >
              −</button
            ><button
              aria-label="Увеличить масштаб"
              class="rounded border px-3 py-2"
              :disabled="c.zoom.value >= 2"
              @click="c.zoom.value = Math.min(2, c.zoom.value + 0.2)"
            >
              +
            </button></template
          >
        </div>
        <template v-if="c.view.value === 'plan' && c.plan.value"
          ><p class="mb-3 text-xs leading-5 text-muted">
            Демонстрационная геометрия. Номера, площади квартир, цены и статусы получены из
            каталога. На телефоне схему можно прокручивать.
          </p>
          <FloorPlanCanvas
            :plan="c.plan.value"
            :apartments="c.apartments.value"
            :selected-apartment-id="c.selectedId.value"
            :zoom="c.zoom.value"
            :allow-unavailable-selection="c.session.isStaff"
            @select="c.selectedId.value = $event"
        /></template>
        <template v-else
          ><p v-if="c.view.value === 'plan'" class="mb-3 text-sm text-muted">
            Для состава этого этажа нет подходящего шаблона. Все квартиры показаны списком.
          </p>
          <div class="divide-y divide-ink/10">
            <button
              v-for="apartment in c.apartments.value"
              :key="apartment.id"
              class="flex w-full flex-wrap items-center justify-between gap-3 rounded p-4 text-left hover:bg-paper disabled:opacity-60"
              :class="c.selectedId.value === apartment.id ? 'bg-blueprint-soft' : ''"
              :disabled="!c.session.isStaff && apartment.status !== 'available'"
              @click="c.selectedId.value = apartment.id"
            >
              <span
                ><strong
                  >№ {{ apartment.number }} · {{ apartment.rooms }} комн. ·
                  {{ apartment.area }} м²</strong
                ><small class="mt-1 block"
                  >{{ apartment.finish }} ·
                  {{
                    { available: 'В продаже', reserved: 'Бронь', sold: 'Продана' }[apartment.status]
                  }}</small
                ></span
              ><span class="font-semibold">{{ formatCurrency(apartment.price) }}</span>
            </button>
          </div></template
        >
        <div v-if="c.selected.value" class="mt-5 border-t border-ink/15 pt-5">
          <h3 class="font-semibold">Квартира № {{ c.selected.value.number }}</h3>
          <p class="mt-2 text-sm">
            {{ c.selected.value.area }} м² · {{ formatCurrency(c.selected.value.price) }}
          </p>
          <form v-if="!c.session.isStaff" class="mt-4" @submit.prevent="c.createRequest.mutate()">
            <label class="block text-sm"
              >Сообщение менеджеру<textarea
                v-model="c.requestText.value"
                rows="3"
                required
                :disabled="c.createRequest.isPending.value"
                class="mt-2 w-full rounded-lg border border-ink/20 p-3"
              /></label
            ><button
              :disabled="c.createRequest.isPending.value || c.createRequest.isSuccess.value"
              class="mt-3 rounded-lg bg-blueprint px-4 py-3 text-sm text-white disabled:opacity-50"
            >
              Отправить обращение
            </button>
            <p v-if="c.createRequest.error.value" role="alert" class="mt-3 text-sm text-risk">
              {{ c.createRequest.error.value.message }}
            </p>
            <p v-if="c.createRequest.isSuccess.value" role="status" class="mt-3 text-sm">
              Обращение № {{ c.createRequest.data.value?.id }} создано.
              <RouterLink to="/conversations" class="underline">Открыть переписку</RouterLink>
            </p>
          </form>
          <p v-else class="mt-3 text-sm text-muted">
            Используйте раздел «Сделки» для привязки клиента и раздел «Предложения» для подготовки КП.
          </p>
          <ApartmentEditor
            v-if="c.selectedApiApartment.value"
            :apartment="c.selectedApiApartment.value"
            :role="c.session.user?.role"
          />
        </div>
      </ApiState>
    </section>
    <section
      v-if="c.buildingId.value !== null"
      class="rounded-xl border border-ink/10 bg-sheet p-5"
    >
      <h2 class="text-lg font-semibold">Ход строительства</h2>
      <ApiState
        :pending="c.progress.isPending.value"
        :error="c.progress.error.value"
        :empty="!c.progress.data.value?.length"
        empty-text="Этапы строительства пока не опубликованы."
        @retry="c.progress.refetch()"
        ><article
          v-for="step in c.progress.data.value"
          :key="step.id"
          class="border-b border-ink/10 py-4 last:border-0"
        >
          <div class="flex justify-between gap-3">
            <h3 class="font-semibold">{{ stages[step.stage_name] }}</h3>
            <span>{{
              step.completion_percentage == null
                ? 'Готовность не указана'
                : `${step.completion_percentage}%`
            }}</span>
          </div>
          <p v-if="step.delay_reason" class="mt-2 text-sm">{{ step.delay_reason }}</p>
          <p v-if="step.delay_days != null" class="mt-2 text-sm text-muted">
            Задержка этапа: {{ step.delay_days }} дн.
          </p>
          <ProgressEditor :progress="step" :role="c.session.user?.role" />
        </article></ApiState
      >
    </section>
  </div>
</template>
