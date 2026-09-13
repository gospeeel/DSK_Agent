import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from '@/shared/api/query-client'
import { onUnauthorized } from '@/shared/api/transport'
import { useSessionStore } from '@/features/auth-session'

import '@fontsource-variable/golos-text'
import './app/styles/main.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
onUnauthorized(() => { useSessionStore().reset(); void router.replace('/login') })
app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount('#app')
