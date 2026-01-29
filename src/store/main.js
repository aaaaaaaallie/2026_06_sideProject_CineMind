import { defineStore } from 'pinia';

export const useMainStore = defineStore('main', {
  state: () => ({
    isLoading: true,
    popup: null,
    popupQueue: null,
  }),
  actions: {
    increment() {
      this.count++;
    },
    setLoading(boolean) {
      this.$patch((state) => {
        state.isLoading = boolean;
      });
    },
    openPopup(type) {
      this.popup = type;
    },
    closePopup() {
      this.popup = null;
    },
  },
});
