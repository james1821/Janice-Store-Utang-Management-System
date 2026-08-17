<template>
  <Modal :model-value="modelValue" :title="title" @update:model-value="$emit('update:modelValue', $event)">
    <p class="text-sm text-slate-600 dark:text-slate-300 mb-5">{{ message }}</p>
    <div class="flex gap-3">
      <button
        class="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 active:bg-slate-50 dark:active:bg-slate-700"
        @click="$emit('update:modelValue', false)"
      >
        Cancel
      </button>
      <button
        class="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white active:opacity-80"
        :class="danger ? 'bg-rose-600' : 'bg-emerald-600'"
        @click="confirm"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirm', danger: false }
)
const emit = defineEmits<{ 'update:modelValue': [boolean]; confirm: [] }>()

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>
