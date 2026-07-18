<script setup>
import { computed } from 'vue'
import { useReviewsStore } from '@/stores/reviews.js'

const store = useReviewsStore()

const kpis = computed(() => [
  { label: '影評數', value: store.stats.count, unit: '部' },
  { label: '總字數', value: store.stats.totalWords.toLocaleString('zh-Hant-TW'), unit: '字' },
  { label: '平均字數', value: store.stats.avgWords.toLocaleString('zh-Hant-TW'), unit: '字' },
  { label: '涵蓋年份', value: store.stats.yearSpan, unit: '年' },
])

// 分佈條最多列 8 個 genre，其餘折進「其他」
const genreBars = computed(() => {
  const rows = store.stats.genreRows
  if (rows.length <= 8) return rows
  const top = rows.slice(0, 7)
  const otherCount = rows.slice(7).reduce((sum, r) => sum + r.count, 0)
  return [...top, { genre: '其他', count: otherCount }]
})

const maxCount = computed(() => Math.max(...genreBars.value.map(r => r.count), 1))
</script>

<template>
  <section aria-label="統計" class="flex flex-col gap-3">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5"
      >
        <p class="text-xs text-neutral-500">{{ kpi.label }}</p>
        <p class="mt-0.5 text-xl font-semibold text-neutral-100">
          {{ kpi.value }}<span class="ms-1 text-xs font-normal text-neutral-500">{{ kpi.unit }}</span>
        </p>
      </div>
    </div>

    <div v-if="genreBars.length" class="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3">
      <h2 class="text-xs text-neutral-500 mb-2">類型分佈</h2>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="row in genreBars"
          :key="row.genre"
          class="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-xs"
          :title="`${row.genre}：${row.count} 部`"
        >
          <span class="truncate text-neutral-300">{{ row.genre }}</span>
          <span class="h-2 rounded-sm bg-neutral-800/60 overflow-hidden">
            <span
              class="block h-full rounded-e-[4px] bg-[#3987e5]"
              :style="{ width: `${(row.count / maxCount) * 100}%` }"
            />
          </span>
          <span class="text-end text-neutral-400 tabular-nums">{{ row.count }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
