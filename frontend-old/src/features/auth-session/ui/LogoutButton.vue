<script setup lang="ts">
import { LogOut } from '@lucide/vue'
import { useRouter } from 'vue-router'

import { useSessionStore } from '../model/session.store'

withDefaults(defineProps<{ collapsible?: boolean }>(), { collapsible: false })

const session = useSessionStore()
const router = useRouter()
const logout = async () => {
  if (await session.signOut()) await router.replace('/login')
}
</script>

<template>
  <button
    class="flex h-10 w-[208px] items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/8 hover:text-white"
    type="button"
    aria-label="Выйти из профиля"
    :disabled="session.busy"
    @click="logout"
  >
    <LogOut :size="18" :stroke-width="1.8" class="shrink-0" aria-hidden="true" />
    <span
      class="whitespace-nowrap transition-opacity duration-150"
      :class="collapsible ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : ''"
    >
      Выйти
    </span>
  </button>
</template>
