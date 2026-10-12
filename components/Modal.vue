<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" @click.self="close">
        <Transition name="sheet">
          <div
            v-if="modelValue"
            class="bg-white dark:bg-slate-800 w-full sm:max-w-md lg:max-w-xl sm:rounded-2xl rounded-t-2xl flex flex-col"
            :class="noBodyScroll ? 'max-h-[90vh] overflow-hidden' : 'max-h-[90vh] overflow-y-auto'"
          >
            <div class="flex items-center justify-between px-4 lg:px-6 pt-4 lg:pt-5 pb-2 shrink-0 bg-white dark:bg-slate-800">
              <h2 class="font-semibold text-lg lg:text-xl text-slate-900 dark:text-slate-100">{{ title }}</h2>
              <button @click="close" class="text-slate-400 dark:text-slate-500 w-7 h-7 flex items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-700" aria-label="Close">
                <X :size="18" />
              </button>
            </div>
            <div class="px-4 lg:px-6 pb-6" :class="noBodyScroll ? 'flex-1 min-h-0 flex flex-col overflow-y-auto' : ''">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

withDefaults(defineProps<{ modelValue: boolean; title: string; noBodyScroll?: boolean }>(), {
  noBodyScroll: false
})
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sheet-enter-active, .sheet-leave-active { transition: transform 0.25s ease; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(24px); }
</style>
