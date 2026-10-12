<template>
  <input
    ref="el"
    :value="display"
    type="text"
    inputmode="decimal"
    :placeholder="placeholder"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue?: number | null; placeholder?: string; max?: number }>()
const emit = defineEmits<{ 'update:modelValue': [number | undefined] }>()

const el = ref<HTMLInputElement | null>(null)
const display = ref('')

function toPlain(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
function toFixed2(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function parseDisplay(s: string): number | undefined {
  if (s === '') return undefined
  const n = Number(s.replace(/,/g, ''))
  return Number.isNaN(n) ? undefined : n
}

watch(
  () => props.modelValue,
  (v) => {
    if (el.value && document.activeElement === el.value) return
    const current = parseDisplay(display.value)
    const next = v === undefined || v === null || Number.isNaN(v) ? undefined : v
    if (current === next) return
    display.value = next === undefined ? '' : toPlain(next)
  },
  { immediate: true }
)

function onInput(e: Event) {
  const input = e.target as HTMLInputElement
  const caret = input.selectionStart ?? input.value.length
  const before = input.value.slice(0, caret)

  let s = input.value.replace(/[^0-9.]/g, '')
  const firstDot = s.indexOf('.')
  if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
  const dot = s.indexOf('.')
  if (dot !== -1) s = s.slice(0, dot + 3)

  let [intPart, decPart] = s.split('.')
  intPart = intPart.replace(/^0+(?=\d)/, '')
  const intFormatted = intPart ? Number(intPart).toLocaleString('en-US') : dot !== -1 ? '0' : ''
  const formatted = decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted

  display.value = formatted
  input.value = formatted

  const sigBefore = before.replace(/[^0-9.]/g, '').length
  let pos = 0
  let count = 0
  while (pos < formatted.length && count < sigBefore) {
    if (/[0-9.]/.test(formatted[pos])) count++
    pos++
  }
  input.setSelectionRange(pos, pos)

  emit('update:modelValue', parseDisplay(s))
}

function onFocus() {
  if (display.value === '') return
  const n = parseDisplay(display.value)
  if (n !== undefined) display.value = toPlain(n)
}

function onBlur() {
  const n = parseDisplay(display.value)
  if (display.value === '' || n === undefined) {
    display.value = ''
    emit('update:modelValue', undefined)
    return
  }
  const clamped = props.max !== undefined && n > props.max ? props.max : n
  display.value = toFixed2(clamped)
  emit('update:modelValue', clamped)
}
</script>
