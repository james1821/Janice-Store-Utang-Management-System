<template>
  <button
    type="button"
    @click="cycle"
    :title="currentLabel"
    :aria-label="`Sort: ${currentLabel}. Tap to change.`"
    class="shrink-0 h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"
  >
    <component :is="currentIcon" :size="16" :stroke-width="2" />
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = defineProps<{
  modelValue: string
  options: { value: string; label: string; icon: Component }[]
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const currentLabel = computed(() => props.options.find((o) => o.value === props.modelValue)?.label || 'Sort')
const currentIcon = computed(() => props.options.find((o) => o.value === props.modelValue)?.icon)

function cycle() {
  const idx = props.options.findIndex((o) => o.value === props.modelValue)
  const next = props.options[(idx + 1) % props.options.length]
  if (next) emit('update:modelValue', next.value)
}
</script>
