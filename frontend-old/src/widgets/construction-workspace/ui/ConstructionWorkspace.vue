<script setup lang="ts">
import { formatCurrency } from '@/shared/lib/format'
import { LoadingRows, StatusBadge } from '@/shared/ui'
import { useConstructionWorkspace } from '../model/use-construction-workspace'
const props = defineProps<{ objectId: string }>()
const { objects, object, project, eventsQuery, events, catalogQuery, floors } =
  useConstructionWorkspace(() => props.objectId)
const statusLabel = { critical: 'Отклонение', warning: 'Наблюдение', stable: 'По плану' } as const
</script>

<template>
  <div class="mx-auto max-w-[1200px]">
    <RouterLink
      to="/construction"
      class="mb-5 inline-block rounded py-2 text-sm font-semibold text-blueprint"
      >← К объектам</RouterLink
    >
    <LoadingRows v-if="objects.isPending.value" />
    <p v-else-if="objects.isError.value" role="alert" class="text-risk">
      Не удалось загрузить объект.
      <button class="underline" @click="objects.refetch()">Повторить</button>
    </p>
    <p v-else-if="!object">Объект не найден. Вернитесь к списку объектов.</p>
    <template v-else>
      <section class="rounded-xl border border-ink/10 bg-sheet p-5 sm:p-7">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-2xl font-semibold">{{ object.name }}</h2>
          <StatusBadge :tone="object.level" :label="statusLabel[object.level]" />
        </div>
        <p v-if="project" class="mt-2 text-sm text-muted">{{ project.address }}</p>
        <dl class="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt class="text-sm text-muted">Текущий этап</dt>
            <dd class="mt-1 font-semibold">{{ object.currentStage }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">Готовность</dt>
            <dd class="mt-1 font-semibold">{{ object.readiness }}%</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">Тип объекта</dt>
            <dd class="mt-1 font-semibold">{{ object.type }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">Плановый срок сдачи</dt>
            <dd class="mt-1 font-semibold">{{ object.plannedDelivery }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted">Прогноз сдачи</dt>
            <dd
              class="mt-1 font-semibold"
              :class="object.forecastDelivery !== object.plannedDelivery ? 'text-risk' : ''"
            >
              {{ object.forecastDelivery }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              {{ object.type === 'Паркинг' ? 'Машино-места' : 'Квартиры' }}
            </dt>
            <dd class="mt-1 font-semibold">
              {{ object.availableUnits }} в продаже · {{ object.reservedUnits }} в резерве
            </dd>
          </div>
        </dl>
        <p
          v-if="object.forecastDelivery !== object.plannedDelivery"
          class="mt-6 rounded-lg bg-risk/8 p-4 text-sm text-risk"
        >
          Прогноз сдачи изменился: {{ object.plannedDelivery }} → {{ object.forecastDelivery }}.
          Учитывайте новый срок при подготовке предложений клиентам.
        </p>
      </section>
      <section class="mt-6 rounded-xl border border-ink/10 bg-sheet p-5 sm:p-7">
        <h3 class="text-lg font-semibold">События строительства</h3>
        <LoadingRows v-if="eventsQuery.isPending.value" :rows="2" />
        <p v-else-if="eventsQuery.isError.value" class="mt-4 text-sm text-risk">
          Не удалось загрузить события.
          <button class="underline" @click="eventsQuery.refetch()">Повторить</button>
        </p>
        <p v-else-if="!events.length" class="mt-4 text-sm text-muted">
          В журнале пока нет событий по этому объекту.
        </p>
        <article v-for="event in events" :key="event.id" class="mt-4 border-t border-ink/10 pt-4">
          <div class="flex flex-wrap justify-between gap-2">
            <h4 class="font-semibold">{{ event.title }}</h4>
            <span class="text-sm text-muted">{{ event.detectedAt }}</span>
          </div>
          <p class="mt-2 text-sm leading-6">{{ event.impact }}</p>
          <p class="mt-2 text-sm text-muted">Затронуто клиентов: {{ event.affectedClients }}</p>
        </article>
      </section>
      <section
        v-if="object.type === 'Корпус'"
        class="mt-6 rounded-xl border border-ink/10 bg-sheet p-5 sm:p-7"
      >
        <h3 class="text-lg font-semibold">Квартиры по этажам</h3>
        <p class="mt-2 text-sm text-muted">
          В демокаталоге представлена часть этажей. Остатки по объекту указаны выше.
        </p>
        <LoadingRows v-if="catalogQuery.isPending.value" :rows="3" />
        <p v-else-if="catalogQuery.isError.value" class="mt-4 text-sm text-risk">
          Не удалось загрузить квартиры.
          <button class="underline" @click="catalogQuery.refetch()">Повторить</button>
        </p>
        <p v-else-if="!floors.length" class="mt-4 text-sm text-muted">Квартиры ещё не добавлены.</p>
        <table v-else class="mt-5 w-full text-left text-sm">
          <thead class="border-b border-ink/15 text-muted">
            <tr>
              <th class="py-3 font-medium">Этаж</th>
              <th class="py-3 font-medium">В продаже</th>
              <th class="py-3 text-right font-medium">Цена от</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink/10">
            <tr v-for="floor in floors" :key="floor.id">
              <td class="py-3 font-semibold">{{ floor.number }}</td>
              <td class="py-3">{{ floor.available }} из {{ floor.total }}</td>
              <td class="py-3 text-right tabular-nums">
                {{ floor.minPrice === null ? 'Нет в продаже' : formatCurrency(floor.minPrice) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
