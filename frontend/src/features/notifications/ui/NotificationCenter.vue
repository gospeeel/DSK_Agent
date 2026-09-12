<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { Bell, X } from '@lucide/vue'
import ApiState from '@/shared/ui/ApiState.vue'
import { useNotifications } from '../model/use-notifications'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ toggle: []; close: [] }>()
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const close = useTemplateRef<HTMLButtonElement>('close')
const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
const formatDate = (value: string) => new Date(value).toLocaleString('ru-RU')
const unreadLabel = computed(() =>
  unreadCount.value === 1
    ? '1 непрочитанное'
    : `${unreadCount.value} непрочитанных`,
)

watch(
  () => props.open,
  async (open, wasOpen) => {
    await nextTick()
    if (open) close.value?.focus()
    else if (wasOpen) trigger.value?.focus()
  },
)
</script>

<template>
  <button
    ref="trigger"
    class="relative grid size-10 place-items-center rounded-lg border border-ink/12 bg-white text-blueprint transition-colors hover:bg-blueprint-soft/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    type="button"
    :aria-expanded="open"
    aria-controls="notification-center"
    aria-label="Уведомления"
    @click="emit('toggle')"
  >
    <Bell :size="19" aria-hidden="true" />
    <span
      v-if="unreadCount"
      class="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-risk px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-white"
      aria-hidden="true"
    >{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
  </button>

  <Transition
    enter-active-class="origin-right transition-[opacity,transform] duration-200 ease-out"
    leave-active-class="origin-right transition-[opacity,transform] duration-150 ease-in"
    enter-from-class="scale-[0.98] opacity-0"
    leave-to-class="scale-[0.98] opacity-0"
  >
    <aside
      v-if="open"
      id="notification-center"
      class="fixed top-16 right-0 z-50 flex h-[calc(100vh-4rem)] w-full max-w-sm flex-col border-l border-ink/10 bg-sheet shadow-[-12px_0_32px_rgba(23,34,41,0.12)] lg:top-20 lg:h-[calc(100vh-5rem)]"
      aria-label="Уведомления"
    >
      <header class="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <div>
          <h2 class="text-lg font-semibold">Уведомления</h2>
          <p class="mt-1 text-xs text-muted">{{ unreadLabel }}</p>
        </div>
        <button
          ref="close"
          class="grid size-9 place-items-center rounded-lg border border-ink/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          type="button"
          aria-label="Закрыть уведомления"
          @click="emit('close')"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <ApiState
          :pending="notifications.isPending.value"
          :error="notifications.error.value"
          :empty="!notifications.data.value?.length"
          empty-text="Новых уведомлений пока нет."
          @retry="notifications.refetch()"
        >
          <ol class="divide-y divide-ink/10">
            <li v-for="item in notifications.data.value" :key="item.id" class="py-4 first:pt-0">
              <div class="flex items-start gap-3">
                <span
                  class="mt-1.5 size-2 shrink-0 rounded-full"
                  :class="item.is_read ? 'bg-ink/15' : 'bg-signal'"
                  aria-hidden="true"
                />
                <article class="min-w-0 flex-1">
                  <h3 class="text-sm font-semibold leading-5">{{ item.title }}</h3>
                  <p class="mt-1 text-sm leading-6 text-muted">{{ item.message }}</p>
                  <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <time class="text-xs text-muted" :datetime="item.created_at">{{ formatDate(item.created_at) }}</time>
                    <button
                      v-if="!item.is_read"
                      class="text-xs font-semibold text-blueprint underline decoration-blueprint/25 underline-offset-4 disabled:opacity-50"
                      :disabled="markRead.isPending.value"
                      @click="markRead.mutate(item.id)"
                    >Прочитано</button>
                  </div>
                </article>
              </div>
            </li>
          </ol>
        </ApiState>
      </div>

      <footer v-if="unreadCount" class="border-t border-ink/10 p-4">
        <button
          class="w-full rounded-lg border border-ink/20 px-4 py-3 text-sm font-semibold text-blueprint disabled:opacity-50"
          :disabled="markAllRead.isPending.value"
          @click="markAllRead.mutate()"
        >Отметить все прочитанными</button>
      </footer>
    </aside>
  </Transition>
</template>
