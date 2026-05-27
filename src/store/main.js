import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  // State
  const isLoading = ref(true)
  const isMobile = ref(null)
  const popup = ref(null)
  const popupQueue = ref(null)

  // Actions
  const increment = () => {
    count.value++
  }

  const setLoading = (boolean) => {
    isLoading.value = boolean
  }
  const setIsMobile = (boolean) => {
    isMobile.value = boolean
  }
  const openPopup = (type) => {
    popup.value = type
  }
  const closePopup = () => {
    popup.value = null
  }


  return {
    isLoading,
    isMobile,
    popup,
    popupQueue,
    increment,
    setLoading,
    setIsMobile,
    openPopup,
    closePopup,
  }
})
