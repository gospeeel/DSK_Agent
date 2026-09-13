<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { formatCurrency } from '@/shared/lib/format'
import { useCompetitorWorkspace } from '../model/use-competitor-workspace'

const workspace = useCompetitorWorkspace()
const observed = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('ru-RU') : 'Дата не указана'
</script>

<template>
  <div class="space-y-5">
    <section class="rounded-xl border border-ink/10 bg-sheet p-5 sm:p-6">
      <h2 class="text-xl font-semibold">Сравнение с выбранной квартирой ДСК</h2>
      <p class="mt-2 text-sm leading-6 text-muted">
        Сравниваются только сохранённые цены и характеристики. Источник и дата наблюдения показаны
        рядом с каждым предложением.
      </p>
      <label class="mt-5 block max-w-2xl text-sm">
        Сделка
        <select
          v-model="workspace.selectedDealId.value"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"
        >
          <option :value="null">Без выбранной квартиры</option>
          <option v-for="deal in workspace.visibleDeals.value" :key="deal.id" :value="deal.id">
            № {{ deal.id }} · {{ deal.user_name || 'Клиент ' + deal.id_user }}
          </option>
        </select>
      </label>
      <p v-if="workspace.ownPricePerSqm.value" class="mt-4 text-sm">
        ДСК: <strong>{{ formatCurrency(workspace.ownPricePerSqm.value) }}/м²</strong>
      </p>
    </section>

    <ApiState
      :pending="workspace.competitors.isPending.value"
      :error="workspace.competitors.error.value"
      :empty="!workspace.competitors.data.value?.length"
      empty-text="Конкурентные предложения ещё не загружены."
      @retry="workspace.competitors.refetch()"
    >
      <section class="overflow-hidden rounded-xl border border-ink/10 bg-sheet">
        <article
          v-for="item in workspace.competitors.data.value"
          :key="item.id"
          class="grid gap-4 border-b border-ink/10 p-5 last:border-0 lg:grid-cols-[1fr_180px_160px]"
        >
          <div>
            <h3 class="font-semibold">{{ item.project_name }}</h3>
            <p class="mt-1 text-sm text-muted">
              {{ item.district }} · {{ observed(item.observed_at) }}
            </p>
            <p v-if="item.advantages" class="mt-3 text-sm leading-6">
              Сильные стороны: {{ item.advantages }}
            </p>
            <p v-if="item.disadvantages" class="mt-1 text-sm leading-6 text-muted">
              Ограничения: {{ item.disadvantages }}
            </p>
            <a
              v-if="item.source_url"
              :href="item.source_url"
              target="_blank"
              rel="noreferrer"
              class="mt-3 inline-block text-sm font-semibold text-blueprint underline underline-offset-4"
            >
              Проверить источник
            </a>
            <button v-if="workspace.session.user?.role === 'supervisor'" class="mt-3 ml-3 text-sm font-semibold text-blueprint underline underline-offset-4" @click="workspace.edit(item)">Обновить данные</button>
          </div>
          <div>
            <p class="text-xs text-muted">Цена конкурента</p>
            <p class="mt-1 font-semibold tabular-nums">
              {{ item.price_per_sqm ? formatCurrency(item.price_per_sqm) + '/м²' : 'Не указана' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">Разница ДСК</p>
            <p
              v-if="workspace.priceDelta(item.price_per_sqm) !== null"
              class="mt-1 font-semibold tabular-nums"
              :class="
                workspace.priceDelta(item.price_per_sqm)! <= 0 ? 'text-[#39704f]' : 'text-risk'
              "
            >
              {{ workspace.priceDelta(item.price_per_sqm)! > 0 ? '+' : ''
              }}{{ workspace.priceDelta(item.price_per_sqm) }}%
            </p>
            <p v-else class="mt-1 text-sm text-muted">Выберите сделку</p>
          </div>
        </article>
      </section>
    </ApiState>

    <form
      v-if="workspace.session.user?.role === 'supervisor'"
      class="rounded-xl border border-ink/10 bg-sheet p-5 sm:p-6"
      @submit.prevent="workspace.create.mutate()"
    >
      <h2 class="text-xl font-semibold">{{ workspace.editingId.value ? 'Обновить рыночное наблюдение' : 'Добавить рыночное наблюдение' }}</h2>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="text-sm"
          >Проект<input
            v-model="workspace.form.project_name"
            required
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
        /></label>
        <label class="text-sm"
          >Район<input
            v-model="workspace.form.district"
            required
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
        /></label>
        <label class="text-sm"
          >Цена за м²<input
            v-model="workspace.form.price_per_sqm"
            inputmode="numeric"
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
        /></label>
        <label class="text-sm">Комнат<input v-model="workspace.form.rooms" inputmode="numeric" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm">Площадь, м²<input v-model="workspace.form.area" inputmode="decimal" class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3" /></label>
        <label class="text-sm"
          >Дата наблюдения<input
            v-model="workspace.form.observed_at"
            type="date"
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
        /></label>
        <label class="text-sm sm:col-span-2"
          >Ссылка на источник<input
            v-model="workspace.form.source_url"
            type="url"
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
        /></label>
        <label class="text-sm"
          >Преимущества<textarea
            v-model="workspace.form.advantages"
            rows="3"
            class="mt-2 w-full rounded-lg border border-ink/20 p-3"
        /></label>
        <label class="text-sm"
          >Ограничения<textarea
            v-model="workspace.form.disadvantages"
            rows="3"
            class="mt-2 w-full rounded-lg border border-ink/20 p-3"
        /></label>
      </div>
      <button
        class="mt-5 rounded-lg bg-blueprint px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        :disabled="workspace.create.isPending.value"
      >
        {{ workspace.create.isPending.value ? 'Сохраняем…' : workspace.editingId.value ? 'Сохранить изменения' : 'Сохранить наблюдение' }}
      </button>
      <button v-if="workspace.editingId.value" type="button" class="mt-5 ml-3 rounded-lg border border-ink/20 px-4 py-3 text-sm" @click="workspace.resetForm">Отмена</button>
      <p v-if="workspace.create.error.value" role="alert" class="mt-3 text-sm text-risk">
        {{ workspace.create.error.value.message }}
      </p>
    </form>
  </div>
</template>
