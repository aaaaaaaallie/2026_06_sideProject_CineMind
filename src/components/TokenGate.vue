<script setup>
import { ref } from 'vue'
import { useReviewsStore } from '@/stores/reviews.js'

const store = useReviewsStore()
const input = ref('')

async function submit() {
  if (!input.value.trim() || store.loading) return
  try {
    await store.login(input.value.trim())
  } catch {
    // 錯誤訊息由 store.error 呈現
  }
}
</script>

<template>
  <main class="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold tracking-wide">🎬 CineMind</h1>
      <p class="mt-2 text-sm text-neutral-400">個人影視觀點工作台</p>
    </div>

    <form
      class="w-full max-w-xs flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5"
      @submit.prevent="submit"
    >
      <label for="token" class="text-sm text-neutral-300">Dashboard Token</label>
      <input
        id="token"
        v-model="input"
        type="password"
        autocomplete="current-password"
        placeholder="輸入 token"
        class="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
      >
      <button
        type="submit"
        :disabled="store.loading || !input.trim()"
        class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-500 transition-colors"
      >
        {{ store.loading ? '驗證中…' : '進入' }}
      </button>
      <p v-if="store.error" class="text-sm text-red-400" role="alert">{{ store.error }}</p>
    </form>
  </main>
</template>
