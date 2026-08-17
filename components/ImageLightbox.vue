<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="lightboxSrc"
        class="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6"
        @click="close"
      >
        <button
          class="absolute top-4 right-4 text-white w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
          @click="close"
          aria-label="Close"
        >
          <X :size="24" />
        </button>
        <img :src="lightboxSrc" :alt="lightboxAlt" class="max-w-full max-h-full rounded-xl object-contain" @click.stop />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

const { lightboxSrc, lightboxAlt, close } = useLightbox()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
