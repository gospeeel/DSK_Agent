<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import { useAiAssistant } from '../model/ai-assistant'
const assistant = useAiAssistant()
</script>
<template>
  <div v-if="assistant.session.isStaff" class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
    <section class="rounded-xl border border-ink/10 bg-sheet p-6">
      <h2 class="text-xl font-semibold">Разбор переписки</h2>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
        AI читает связанную со сделкой историю, фиксирует потребности и возражения. Результат остаётся
        внутренним и не отправляется клиенту.
      </p>
      <label class="mt-5 block text-sm">
        Сделка
        <select
          v-model="assistant.selectedDealId.value"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"
        >
          <option :value="null" disabled>Выберите сделку</option>
          <option v-for="deal in assistant.visibleDeals.value" :key="deal.id" :value="deal.id">
            № {{ deal.id }} · {{ deal.user_name || `Клиент ${deal.id_user}` }}
          </option>
        </select>
      </label>
      <div class="mt-4 flex flex-wrap gap-3">
        <button
          class="rounded-lg bg-blueprint px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="!assistant.selectedDealId.value || assistant.analyze.isPending.value"
          @click="assistant.analyze.mutate()"
        >
          {{ assistant.analyze.isPending.value ? 'Анализируем…' : 'Сформировать сводку' }}
        </button>
        <button
          class="rounded-lg border border-ink/20 px-4 py-3 text-sm font-semibold text-blueprint disabled:opacity-50"
          :disabled="!assistant.selectedDealId.value || assistant.reply.isPending.value"
          @click="assistant.reply.mutate()"
        >
          Подготовить ответ
        </button>
      </div>
      <label class="mt-5 block text-sm">
        Конкретная реплика клиента, необязательно
        <textarea
          v-model="assistant.selectedText.value"
          rows="3"
          class="mt-2 w-full rounded-lg border border-ink/20 p-3"
          placeholder="Если поле пустое, AI возьмёт последнее сообщение клиента"
        />
      </label>
      <p v-if="assistant.analyze.error.value || assistant.reply.error.value" role="alert" class="mt-4 text-sm text-risk">
        {{ assistant.analyze.error.value?.message || assistant.reply.error.value?.message }}
      </p>
    </section>
    <section class="rounded-xl border border-ink/10 bg-sheet p-6" aria-live="polite">
      <h2 class="text-xl font-semibold">Рекомендация менеджеру</h2>
      <template v-if="assistant.reply.data.value">
        <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Контекст</p>
        <p class="mt-2 text-sm leading-6">{{ assistant.reply.data.value.analysis.summary }}</p>
        <p class="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Черновик ответа</p>
        <p class="mt-2 whitespace-pre-wrap text-sm leading-6">{{ assistant.reply.data.value.suggested_reply }}</p>
        <button
          class="mt-5 rounded-lg border border-ink/20 px-4 py-3 text-sm font-semibold text-blueprint"
          @click="assistant.copySuggestedReply"
        >
          {{ assistant.copied.value ? 'Скопировано' : 'Скопировать ответ' }}
        </button>
      </template>
      <template v-else-if="assistant.analyze.data.value">
        <p class="mt-4 text-sm leading-6">{{ assistant.analyze.data.value.analysis.summary }}</p>
        <div class="mt-5">
          <h3 class="text-sm font-semibold">Возражения</h3>
          <ul v-if="assistant.analyze.data.value.analysis.objections.length" class="mt-2 list-disc space-y-2 pl-5 text-sm">
            <li v-for="item in assistant.analyze.data.value.analysis.objections" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="mt-2 text-sm text-muted">Явные возражения не обнаружены.</p>
        </div>
        <div class="mt-5">
          <h3 class="text-sm font-semibold">Важные факторы</h3>
          <p class="mt-2 text-sm text-muted">
            {{ assistant.analyze.data.value.analysis.important_factors.join(', ') || 'Не выделены' }}
          </p>
        </div>
      </template>
      <p v-else class="mt-4 text-sm leading-6 text-muted">
        Выберите сделку и запустите сводку либо подготовку ответа.
      </p>
    </section>
  </div>
  <section v-else class="max-w-3xl rounded-xl border border-ink/10 bg-sheet p-6">
    <ApiState
      :pending="assistant.sessions.isPending.value"
      :error="assistant.sessions.error.value"
      :empty="!assistant.visibleSessions.value.length"
      empty-text="Сначала создайте обращение из каталога."
      @retry="assistant.sessions.refetch()"
      ><form @submit.prevent="assistant.ask.mutate()">
        <label class="block text-sm"
          >Обращение<select
            v-model="assistant.selectedId.value"
            required
            :disabled="assistant.ask.isPending.value"
            class="mt-2 h-11 w-full rounded-lg border border-ink/20 px-3"
          >
            <option :value="null" disabled>Выберите обращение</option>
            <option v-for="item in assistant.visibleSessions.value" :key="item.id" :value="item.id">
              № {{ item.id }}
            </option>
          </select></label
        ><label class="mt-4 block text-sm"
          >Вопрос<textarea
            v-model="assistant.question.value"
            required
            rows="4"
            :disabled="assistant.ask.isPending.value"
            class="mt-2 w-full rounded-lg border border-ink/20 p-3"
          />
        </label>
        <p class="mt-2 text-xs text-muted">
          Вопрос и ответ сохранятся в переписке. Ответ может занять до 75 секунд.
        </p>
        <button
          class="mt-4 rounded-lg bg-blueprint px-5 py-3 text-sm text-white disabled:opacity-50"
          :disabled="assistant.ask.isPending.value || !assistant.selected.value || !assistant.question.value.trim()"
        >
          {{ assistant.ask.isPending.value ? 'Готовим ответ…' : 'Задать вопрос' }}
        </button>
      </form>
      <p v-if="assistant.ask.error.value" role="alert" class="mt-4 text-sm text-risk">
        {{ assistant.ask.error.value.message }} Переписка может уже содержать ваш запрос; проверьте её перед
        повтором.
      </p>
      <p v-if="assistant.ask.data.value" role="status" class="mt-5 whitespace-pre-wrap text-sm leading-6">
        {{ assistant.ask.data.value.message }}
      </p></ApiState
    >
  </section>
</template>
