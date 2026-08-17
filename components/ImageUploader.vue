<template>
  <div>
    <input ref="inputEl" type="file" accept="image/*" class="hidden" @change="handleChange" />
    <div class="flex items-center gap-3">
      <div
        class="shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
        :class="[round ? 'rounded-full' : 'rounded-xl', modelValue ? 'cursor-zoom-in' : '']"
        :style="{ width: size + 'px', height: size + 'px' }"
        @click="modelValue && openLightbox(modelValue)"
      >
        <img v-if="modelValue" :src="modelValue" class="w-full h-full object-cover" alt="" />
        <User v-else-if="round" :size="Math.round(size * 0.45)" class="text-slate-400 dark:text-slate-500" />
        <Package v-else :size="Math.round(size * 0.4)" class="text-slate-400 dark:text-slate-500" />
      </div>
      <div class="flex flex-col gap-1.5">
        <button
          type="button"
          @click="inputEl?.click()"
          :disabled="compressing"
          class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 disabled:opacity-50 text-left flex items-center gap-1"
        >
          <Camera :size="13" />
          {{ compressing ? 'Compressing…' : modelValue ? 'Change photo' : 'Upload photo' }}
        </button>
        <button
          v-if="modelValue && !compressing"
          type="button"
          @click="$emit('update:modelValue', '')"
          class="text-xs text-rose-500 text-left"
        >
          Remove
        </button>
        <p v-if="sizeLabel && !compressing" class="text-[11px] text-slate-400 dark:text-slate-500">{{ sizeLabel }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Package, Camera } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string
    size?: number
    round?: boolean
    maxDimension?: number
    targetKB?: number
  }>(),
  {
    size: 72,
    round: true,
    maxDimension: 400,
    targetKB: 45
  }
)
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const { compressImageFile, estimateKB } = useImageCompress()
const { open: openLightbox } = useLightbox()
const toast = useToast()
const inputEl = ref<HTMLInputElement | null>(null)
const compressing = ref(false)
const sizeLabel = ref('')

async function handleChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  compressing.value = true
  try {
    const dataUrl = await compressImageFile(file, { maxDimension: props.maxDimension, targetKB: props.targetKB })
    emit('update:modelValue', dataUrl)
    sizeLabel.value = `~${Math.max(1, Math.round(estimateKB(dataUrl)))} KB`
  } catch {
    toast.error('Could not process that image')
  } finally {
    compressing.value = false
    if (inputEl.value) inputEl.value.value = ''
  }
}
</script>
