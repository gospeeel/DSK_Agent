import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useWorkspaceStore = defineStore('workspace', () => {
  const isMobileMenuOpen = shallowRef(false)
  const isNotificationsOpen = shallowRef(false)

  const toggleMobileMenu = () => {
    const shouldOpen = !isMobileMenuOpen.value
    isMobileMenuOpen.value = shouldOpen
    if (shouldOpen) isNotificationsOpen.value = false
  }
  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
  }
  const closeNotifications = () => {
    isNotificationsOpen.value = false
  }
  const toggleNotifications = () => {
    const shouldOpen = !isNotificationsOpen.value
    isNotificationsOpen.value = shouldOpen
    if (shouldOpen) isMobileMenuOpen.value = false
  }

  return {
    isMobileMenuOpen,
    isNotificationsOpen,
    toggleMobileMenu,
    closeMobileMenu,
    closeNotifications,
    toggleNotifications,
  }
})
