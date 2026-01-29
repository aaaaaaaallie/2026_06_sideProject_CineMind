<script setup>
import { useMainStore } from '@/store/main';
import { computed, watch } from 'vue';
const mainStore = useMainStore();
const isLoading = computed(() => mainStore.isLoading);

watch(isLoading, (val) => {
  console.log('isLoading ', val);
});
</script>

<template>
  <section id="home" class="section">
    <div class="wrapper" @click="mainStore.openPopup('warning')">I am Home</div>
  </section>
</template>
<style lang="scss"></style>
