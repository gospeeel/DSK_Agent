<script setup lang="ts">
defineOptions({ name: 'BackendCorrespondence' })
import ApiState from '@/shared/ui/ApiState.vue'
import { useCorrespondence } from '../model/use-correspondence'
const c = useCorrespondence()
const time = (value: string) => new Date(value).toLocaleString('ru-RU')
</script>
<template>
  <div class="rounded-xl border border-ink/10 bg-sheet p-4 sm:p-6">
    <ApiState
      :pending="c.sessions.isPending.value"
      :error="c.sessions.error.value"
      :empty="!c.visibleSessions.value.length"
      empty-text="Обращений пока нет. Клиент может создать обращение из каталога."
      @retry="c.sessions.refetch()"
    >
      <label class="block max-w-xl text-sm"
        >Обращение<select
          v-model="c.selectedId.value"
          :disabled="c.send.isPending.value || c.action.isPending.value"
          class="mt-2 h-11 w-full rounded-lg border border-ink/20 bg-white px-3"
        >
          <option v-for="item in c.visibleSessions.value" :key="item.id" :value="item.id">
            № {{ item.id }} · {{ item.user_name || item.guest_name || 'Клиент' }} ·
            {{
              item.status === 'close'
                ? 'Закрыто'
                : item.id_employee
                  ? 'В работе'
                  : 'Ожидает менеджера'
            }}
          </option>
        </select></label
      >
      <div v-if="c.selected.value" class="mt-5">
        <p class="text-sm text-muted">
          {{ c.selected.value.guest_email || c.selected.value.guest_phone }}
          <span v-if="c.selected.value.employee_name"
            >Менеджер: {{ c.selected.value.employee_name }}</span
          >
        </p>
        <div
          v-if="c.session.isStaff && c.selected.value.status !== 'close'"
          class="my-4 flex flex-wrap gap-2"
        >
          <button
            v-if="!c.selected.value.id_employee"
            class="rounded-lg bg-blueprint px-4 py-2 text-sm text-white"
            :disabled="c.action.isPending.value"
            @click="c.action.mutate('take')"
          >
            Взять в работу
          </button>
          <template v-else-if="c.canWrite.value"
            ><button
              class="rounded-lg border border-ink/20 px-4 py-2 text-sm"
              :disabled="c.action.isPending.value"
              @click="c.action.mutate('close')"
            >
              Закрыть обращение</button
            ><input
              v-model="c.reason.value"
              aria-label="Причина отказа"
              placeholder="Причина отказа"
              class="min-w-0 rounded-lg border border-ink/20 px-3 py-2 text-sm"
            /><button
              class="rounded-lg border border-ink/20 px-4 py-2 text-sm"
              :disabled="!c.reason.value.trim() || c.action.isPending.value"
              @click="c.action.mutate('reject')"
            >
              Зафиксировать отказ
            </button></template
          >
        </div>
        <p v-if="c.action.error.value" role="alert" class="text-sm text-risk">
          {{ c.action.error.value.message }}
        </p>
        <ApiState
          :pending="c.messages.isPending.value"
          :error="c.messages.error.value"
          @retry="c.messages.refetch()"
        >
          <ol
            class="my-5 max-h-[50vh] space-y-4 overflow-y-auto rounded-lg bg-paper p-4"
            aria-label="История общения"
          >
            <li
              v-for="message in c.messages.data.value"
              :key="message.id"
              class="border-b border-ink/10 pb-3 last:border-0"
            >
              <div class="flex flex-wrap justify-between gap-2 text-xs text-muted">
                <strong>{{
                  message.sender_name ||
                  { client: 'Клиент', manager: 'Менеджер', ai: 'AI-помощник', system: 'Система' }[
                    message.sender_type
                  ]
                }}</strong
                ><time>{{ time(message.sended_at) }}</time>
              </div>
              <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                {{ message.content }}
              </p>
            </li>
            <li v-if="!c.messages.data.value?.length" class="text-sm text-muted">
              Сообщений пока нет.
            </li>
          </ol>
        </ApiState>
        <form v-if="c.canWrite.value" @submit.prevent="c.send.mutate()">
          <label class="block text-sm"
            >Сообщение<textarea
              v-model="c.text.value"
              required
              rows="3"
              class="mt-2 w-full rounded-lg border border-ink/20 p-3"
              :disabled="c.send.isPending.value"
            /></label
          ><button
            class="mt-3 rounded-lg bg-blueprint px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="c.send.isPending.value || !c.text.value.trim()"
          >
            {{ c.send.isPending.value ? 'Отправляем…' : 'Отправить сообщение' }}
          </button>
          <p v-if="c.send.error.value" role="alert" class="mt-3 text-sm text-risk">
            {{ c.send.error.value.message }}
          </p>
        </form>
      </div>
    </ApiState>
  </div>
</template>
