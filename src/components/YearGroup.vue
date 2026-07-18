<script setup>
import { ref } from 'vue'
import ReviewCard from './ReviewCard.vue'

defineProps({
  year: { type: String, required: true },
  items: { type: Array, required: true },
})

const open = ref(true)
</script>

<template>
  <section>
    <button
      class="w-full flex items-center gap-2 py-2 text-start"
      :aria-expanded="open"
      @click="open = !open"
    >
      <h2 class="text-base font-semibold text-neutral-100">{{ year }}</h2>
      <span class="text-xs text-neutral-500">{{ items.length }} 部</span>
      <span class="ms-auto text-neutral-500 text-xs transition-transform" :class="{ 'rotate-180': open }" aria-hidden="true">▼</span>
    </button>

    <div v-if="open" class="flex flex-col gap-2">
      <ReviewCard v-for="review in items" :key="review.id" :review="review" />
    </div>
  </section>
</template>
