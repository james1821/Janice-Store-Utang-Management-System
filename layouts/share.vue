<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
    <header class="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
      <p class="font-bold text-base leading-tight tracking-tight">
        Janice Store <span class="text-emerald-600 dark:text-emerald-400">Utang Tracker</span>
      </p>
      <button
        @click="toggle"
        class="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Sun v-if="isDark" :size="18" />
        <Moon v-else :size="18" />
      </button>
    </header>

    <main class="flex-1 px-4 py-4 max-w-lg w-full mx-auto">
      <slot />
    </main>

    <footer class="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4 space-y-1">
      <p class="flex items-center justify-center gap-1"><Lock :size="11" /> Read-only view · Janice Store Utang Tracker</p>
      <p class="text-slate-300 dark:text-slate-600">Made by JamesDev</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon, Lock } from 'lucide-vue-next'

const { isDark, toggle } = useDarkMode()
</script>
