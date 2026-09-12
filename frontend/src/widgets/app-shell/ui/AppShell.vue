<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Building2, FileText, LayoutDashboard, Menu, Users, X } from '@lucide/vue'

import { useWorkspaceStore } from '../model/workspace.store'
import { LogoutButton, useSessionStore } from '@/features/auth-session'
import { NotificationCenter } from '@/features/notifications'
import { DskMark } from '@/shared/ui'

defineSlots<{ default(): unknown }>()

const route = useRoute()
const session = useSessionStore()
const workspace = useWorkspaceStore()
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const menuClose = useTemplateRef<HTMLButtonElement>('menuClose')

const navigation = computed(() => [
  { label: 'Главная', to: '/', icon: LayoutDashboard },
  ...(session.isStaff ? [{ label: 'Клиенты', to: '/clients', icon: Users }] : []),
  { label: 'Обращения', to: '/conversations', icon: Users },
  { label: 'Сделки', to: '/deals', icon: FileText },
  { label: 'Предложения', to: '/offers', icon: FileText },
  { label: 'Объекты', to: '/construction', icon: Building2 },
  ...(session.isStaff ? [{ label: 'AI-помощник', to: '/ai', icon: FileText }] : []),
  ...(session.isStaff ? [{ label: 'Анализ рынка', to: '/competitors', icon: Building2 }] : []),
  ...(!session.isStaff ? [{ label: 'Профиль', to: '/profile', icon: Users }] : []),
])

const currentTitle = computed(() => String(route.meta.title ?? 'Рабочее пространство'))

watch(
  () => workspace.isMobileMenuOpen,
  async (menuOpen, wasMenuOpen) => {
    await nextTick()
    if (menuOpen) menuClose.value?.focus()
    else if (wasMenuOpen) menuTrigger.value?.focus()
  },
)

const closePanelsOnEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (workspace.isMobileMenuOpen) workspace.closeMobileMenu()
  if (workspace.isNotificationsOpen) workspace.closeNotifications()
}

onMounted(() => window.addEventListener('keydown', closePanelsOnEscape))
onUnmounted(() => window.removeEventListener('keydown', closePanelsOnEscape))
</script>

<template>
  <div class="min-h-screen bg-[#e8e7e1] lg:pl-[72px]">
    <aside
      class="group fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col overflow-hidden bg-blueprint text-white shadow-[10px_0_30px_rgba(23,34,41,0.12)] transition-[width] duration-200 ease-out hover:w-[232px] focus-within:w-[232px] lg:flex"
    >
      <div class="flex h-20 w-[232px] items-center border-b border-ink/10 bg-sheet px-3">
        <div
          class="h-12 w-12 shrink-0 overflow-hidden transition-[width] duration-200 ease-out group-hover:w-[165px] group-focus-within:w-[165px]"
        >
          <DskMark variant="full" />
        </div>
      </div>

      <nav class="w-[232px] flex-1 px-3 py-6" aria-label="Основная навигация">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="mb-1 flex h-11 w-[208px] items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/65 transition-colors duration-200 hover:bg-white/8 hover:text-white"
          active-class="!bg-white !text-blueprint"
        >
          <component :is="item.icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
          <span
            class="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
            >{{ item.label }}</span
          >
        </RouterLink>
      </nav>

      <div class="w-[232px] border-t border-white/12 p-3">
        <div class="mb-1 flex h-12 items-center gap-3 px-1">
          <div
            class="grid size-9 place-items-center rounded-full bg-signal text-xs font-bold text-ink"
          >
            {{
              session.user?.name
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
            }}
          </div>
          <div
            class="min-w-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <p class="truncate text-sm font-medium">{{ session.user?.name }}</p>
            <p class="text-xs text-white/55">{{ session.roleLabel }}</p>
          </div>
        </div>
        <LogoutButton collapsible />
      </div>
    </aside>

    <div class="min-w-0">
      <header
        class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-sheet/92 px-4 backdrop-blur-md sm:px-6 lg:h-20 lg:px-8"
      >
        <div class="flex min-w-0 items-center gap-3">
          <button
            ref="menuTrigger"
            class="grid size-10 place-items-center rounded-lg border border-ink/12 text-blueprint lg:hidden"
            type="button"
            aria-label="Открыть меню"
            @click="workspace.toggleMobileMenu"
          >
            <Menu :size="20" aria-hidden="true" />
          </button>
          <h1 class="truncate text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
            {{ currentTitle }}
          </h1>
        </div>
        <NotificationCenter
          v-if="!session.isStaff"
          :open="workspace.isNotificationsOpen"
          @toggle="workspace.toggleNotifications"
          @close="workspace.closeNotifications"
        />
      </header>

      <main
        class="engineering-grid min-h-[calc(100vh-4rem)] px-4 py-5 sm:px-6 lg:min-h-[calc(100vh-5rem)] lg:px-8 lg:py-7"
      >
        <p v-if="session.error" role="alert" class="mb-4 text-sm text-risk">{{ session.error }}</p>
        <slot />
      </main>
    </div>

    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <button
        v-if="workspace.isMobileMenuOpen"
        class="fixed inset-0 z-40 bg-ink/45 lg:hidden"
        type="button"
        aria-label="Закрыть меню"
        @click="workspace.closeMobileMenu"
      />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      leave-active-class="transition-transform duration-150 ease-in"
      enter-from-class="-translate-x-full"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="workspace.isMobileMenuOpen"
        class="fixed inset-y-0 left-0 z-50 w-[min(84vw,320px)] bg-blueprint p-4 text-white lg:hidden"
      >
        <div class="-mx-4 -mt-4 mb-6 flex h-20 items-center justify-between bg-sheet px-4">
          <DskMark animated variant="full" />
          <button
            ref="menuClose"
            class="grid size-10 place-items-center rounded-lg border border-ink/15 text-blueprint"
            type="button"
            aria-label="Закрыть меню"
            @click="workspace.closeMobileMenu"
          >
            <X :size="20" />
          </button>
        </div>
        <nav class="space-y-1" aria-label="Мобильная навигация">
          <RouterLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-3.5 text-white/70"
            active-class="!bg-white !text-blueprint"
            @click="workspace.closeMobileMenu"
          >
            <component :is="item.icon" :size="19" aria-hidden="true" />{{ item.label }}
          </RouterLink>
        </nav>
        <div class="mt-6 border-t border-white/12 pt-3"><LogoutButton /></div>
      </aside>
    </Transition>

  </div>
</template>
