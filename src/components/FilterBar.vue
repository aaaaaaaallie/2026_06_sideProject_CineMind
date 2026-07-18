<script setup>
import { useReviewsStore } from '@/stores/reviews.js'

const store = useReviewsStore()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <select
        v-model="store.filterYear"
        aria-label="依上映年份篩選"
        class="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="">全部年份</option>
        <option v-for="year in store.allYears" :key="year" :value="year">{{ year }}</option>
      </select>

      <button
        v-if="store.hasActiveFilter"
        class="text-sm text-neutral-400 hover:text-neutral-200 px-2 py-1.5 transition-colors"
        @click="store.clearFilters()"
      >
        清除篩選
      </button>

      <span class="ms-auto text-xs text-neutral-500">{{ store.filtered.length }} / {{ store.reviews.length }} 部</span>
    </div>

    <div v-if="store.allGenres.length" class="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
      <button
        v-for="genre in store.allGenres"
        :key="genre"
        :aria-pressed="store.filterGenres.includes(genre)"
        class="shrink-0 rounded-full border px-3 py-1 text-xs transition-colors"
        :class="store.filterGenres.includes(genre)
          ? 'border-blue-500 bg-blue-500/15 text-blue-300'
          : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'"
        @click="store.toggleGenre(genre)"
      >
        {{ genre }}
      </button>
    </div>
  </div>
</template>
