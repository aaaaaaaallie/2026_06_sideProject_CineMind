<script setup>
import { computed, ref } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  review: { type: Object, required: true },
})

const open = ref(false)

const dateLabel = computed(() => {
  if (!props.review.createdAt) return ''
  return new Date(props.review.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
})

// digest 來自自家 Gemini 產出（信任來源），展開時才解析
const digestHtml = computed(() => (open.value ? marked.parse(props.review.digest ?? '') : ''))
</script>

<template>
  <article class="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
    <button
      class="w-full flex items-center gap-3 p-3 text-start hover:bg-neutral-800/40 transition-colors"
      :aria-expanded="open"
      @click="open = !open"
    >
      <img
        v-if="review.posterUrl"
        :src="review.posterUrl"
        :alt="`《${review.movieTitleZh}》海報`"
        loading="lazy"
        class="w-10 h-14 shrink-0 rounded object-cover bg-neutral-800"
      >
      <span
        v-else
        class="w-10 h-14 shrink-0 rounded bg-neutral-800 flex items-center justify-center text-lg"
        aria-hidden="true"
      >🎬</span>

      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium text-neutral-100">{{ review.movieTitleZh }}</span>
        <span class="block truncate text-xs text-neutral-500">{{ review.movieTitleEn }}</span>
        <span class="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
          <span v-for="genre in review.genres ?? []" :key="genre" class="rounded-full bg-neutral-800 px-1.5 py-0.5">{{ genre }}</span>
          <span>{{ review.wordCount?.toLocaleString('zh-Hant-TW') }} 字</span>
          <span v-if="dateLabel">· {{ dateLabel }}</span>
        </span>
      </span>

      <span class="shrink-0 text-neutral-500 text-xs transition-transform" :class="{ 'rotate-180': open }" aria-hidden="true">▼</span>
    </button>

    <div v-if="open" class="digest-prose border-t border-neutral-800 px-4 py-3" v-html="digestHtml" />
  </article>
</template>
