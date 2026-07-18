<script setup>
import { onMounted } from 'vue'
import { useReviewsStore } from '@/stores/reviews.js'
import TokenGate from '@/components/TokenGate.vue'
import FilterBar from '@/components/FilterBar.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import YearGroup from '@/components/YearGroup.vue'

const store = useReviewsStore()

onMounted(() => {
  if (store.token) store.fetchReviews()
})
</script>

<template>
  <div class="min-h-dvh bg-neutral-950 text-neutral-100">
    <TokenGate v-if="!store.token" />

    <div v-else class="mx-auto max-w-2xl px-4 pb-10">
      <header class="flex items-center gap-2 py-4">
        <h1 class="text-lg font-bold tracking-wide">🎬 CineMind</h1>
        <button
          class="ms-auto text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          @click="store.logout()"
        >
          登出
        </button>
      </header>

      <p v-if="store.loading" class="py-16 text-center text-sm text-neutral-500">載入中…</p>

      <div v-else-if="store.error" class="py-16 text-center text-sm">
        <p class="text-red-400">{{ store.error }}</p>
        <button class="mt-3 text-neutral-400 underline hover:text-neutral-200" @click="store.fetchReviews()">重試</button>
      </div>

      <p v-else-if="!store.reviews.length" class="py-16 text-center text-sm text-neutral-500">
        還沒有歸檔的影評。<br>去 Telegram 用 /movie 開始討論，/generate 歸檔第一篇吧。
      </p>

      <div v-else class="flex flex-col gap-4">
        <FilterBar />
        <StatsPanel />

        <p v-if="!store.filtered.length" class="py-10 text-center text-sm text-neutral-500">
          沒有符合篩選條件的影評。
        </p>
        <YearGroup
          v-for="group in store.groupedByYear"
          :key="group.year"
          :year="group.year"
          :items="group.items"
        />
      </div>
    </div>
  </div>
</template>
