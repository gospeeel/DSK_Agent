import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiAudience, ApiUser } from '@/shared/api/backend-contracts'
import { ApiError } from '@/shared/api/transport'
import { queryClient } from '@/shared/api/query-client'

export const useSessionStore = defineStore('session', () => {
  const user = shallowRef<ApiUser | null>(null)
  const audience = shallowRef<ApiAudience>('staff')
  const ready = shallowRef(false)
  const error = shallowRef('')
  const busy = shallowRef(false)
  const isAuthenticated = computed(() => !!user.value)
  const isStaff = computed(
    () => user.value?.role === 'manager' || user.value?.role === 'supervisor',
  )
  const roleLabel = computed(
    () =>
      ({ user: 'Клиент', manager: 'Менеджер продаж', supervisor: 'Руководитель отдела' })[
        user.value?.role ?? 'user'
      ],
  )
  let restoring: Promise<void> | undefined
  const reset = () => {
    user.value = null
    queryClient.clear()
  }
  const restore = () => {
    if (ready.value) return Promise.resolve()
    if (restoring) return restoring
    restoring = (async () => {
      try {
        const profile = await backendApi.profile('user')
        audience.value = profile.role === 'user' ? 'user' : 'staff'
        user.value = profile
      } catch (cause) {
        if (!(cause instanceof ApiError && cause.status === 401))
          error.value = cause instanceof Error ? cause.message : 'Не удалось проверить сессию'
      } finally {
        ready.value = true
        restoring = undefined
      }
    })()
    return restoring
  }
  const signIn = async (kind: ApiAudience, email: string, password: string) => {
    busy.value = true
    error.value = ''
    try {
      const result = await backendApi.login(kind, email, password)
      reset()
      user.value = result.user
      audience.value = result.user.role === 'user' ? 'user' : 'staff'
      ready.value = true
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не удалось войти'
      return false
    } finally {
      busy.value = false
    }
  }
  const register = async (name: string, email: string, password: string) => {
    busy.value = true
    error.value = ''
    try {
      await backendApi.register(name, email, password)
      return await signIn('user', email, password)
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не удалось зарегистрироваться'
      return false
    } finally {
      busy.value = false
    }
  }
  const signOut = async () => {
    busy.value = true
    error.value = ''
    try {
      await backendApi.logout(audience.value)
      reset()
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не удалось выйти'
      return false
    } finally {
      busy.value = false
    }
  }
  return {
    user,
    audience,
    ready,
    error,
    busy,
    isAuthenticated,
    isStaff,
    roleLabel,
    restore,
    signIn,
    register,
    signOut,
    reset,
  }
})
