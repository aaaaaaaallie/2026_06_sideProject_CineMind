<script setup>
import { computed, reactive, ref } from 'vue'
import { marked } from 'marked'
import { useReviewsStore } from '@/stores/reviews.js'

const props = defineProps({
  review: { type: Object, required: true },
})

const store = useReviewsStore()
const open = ref(false)
const deleting = ref(false)
const editing = ref(false)
const saving = ref(false)
const form = reactive({ movieTitleZh: '', note: '' })

async function handleDelete() {
  if (!window.confirm(`確定要刪除《${props.review.movieTitleZh}》這篇歸檔嗎？此動作無法復原。`)) return
  deleting.value = true
  await store.deleteReview(props.review.id)
  deleting.value = false
}

function startEdit() {
  form.movieTitleZh = props.review.movieTitleZh
  form.note = props.review.note ?? ''
  editing.value = true
}

function resetTitle() {
  if (props.review.movieTitleZhOriginal) form.movieTitleZh = props.review.movieTitleZhOriginal
}

async function saveEdit() {
  saving.value = true
  await store.updateReview(props.review.id, {
    movieTitleZh: form.movieTitleZh.trim(),
    note: form.note.trim(),
  })
  saving.value = false
  editing.value = false
}

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

    <div v-if="open" class="border-t border-neutral-800">
      <div v-if="editing" class="flex flex-col gap-2 px-4 py-3">
        <label class="text-xs text-neutral-400">
          片名
          <input
            v-model="form.movieTitleZh"
            class="mt-1 w-full rounded bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
          >
        </label>
        <button
          v-if="review.movieTitleZhOriginal"
          class="self-start text-[11px] text-neutral-500 underline hover:text-neutral-300"
          @click="resetTitle"
        >
          還原為原始片名《{{ review.movieTitleZhOriginal }}》
        </button>
        <label class="text-xs text-neutral-400">
          備註
          <textarea
            v-model="form.note"
            rows="3"
            class="mt-1 w-full rounded bg-neutral-800 px-2 py-1.5 text-sm text-neutral-100"
          />
        </label>
        <div class="flex justify-end gap-3 pt-1">
          <button class="text-xs text-neutral-400 hover:text-neutral-200" @click="editing = false">取消</button>
          <button
            class="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
            :disabled="saving"
            @click="saveEdit"
          >
            {{ saving ? '儲存中…' : '儲存' }}
          </button>
        </div>
      </div>

      <template v-else>
        <!-- 備註與操作同一排：沒有備註時 ms-auto 仍讓按鈕靠右 -->
        <div class="flex items-start gap-3 px-4 pt-3">
          <p v-if="review.note" class="min-w-0 whitespace-pre-wrap text-sm text-neutral-300">📝 {{ review.note }}</p>
          <div class="ms-auto flex shrink-0 gap-3">
            <button class="text-xs text-neutral-400 hover:text-neutral-200" @click="startEdit">✏️ 編輯</button>
            <button
              class="text-xs text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
              :disabled="deleting"
              @click="handleDelete"
            >
              {{ deleting ? '刪除中…' : '🗑 刪除這篇' }}
            </button>
          </div>
        </div>
        <div class="digest-prose px-4 pt-2 pb-3" v-html="digestHtml" />
      </template>
    </div>
  </article>
</template>
