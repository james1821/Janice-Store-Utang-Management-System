<template>
  <Modal :model-value="modelValue" title="Record Payment" @update:model-value="$emit('update:modelValue', $event)">
    <div v-if="utang" class="space-y-3">
      <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium capitalize dark:text-slate-100">{{ utang.type }} utang</p>
          <p class="text-xs text-slate-400 dark:text-slate-500">{{ utang.note || 'No note' }}</p>
        </div>
        <p class="font-bold text-rose-600 dark:text-rose-400">{{ formatCurrency(outstanding) }}</p>
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Amount to pay (₱)</label>
        <input v-model.number="amount" type="number" min="0.01" :max="outstanding" step="0.01" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        <button type="button" @click="amount = outstanding" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Pay full amount</button>
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
        <input v-model="note" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
      </div>

      <button
        @click="submit"
        :disabled="saving || !amount || amount <= 0"
        class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 active:opacity-80 disabled:opacity-50"
      >
        {{ saving ? 'Recording…' : 'Record payment' }}
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import type { Utang } from '~/types'

const props = defineProps<{ modelValue: boolean; utang: Utang | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [] }>()

const { getOutstandingBalance, formatCurrency } = useUtangCalc()
const { recordPayment } = usePayments()
const toast = useToast()
const { load, save, clear } = useDraftStorage()

const amount = ref<number | undefined>(undefined)
const note = ref('')
const saving = ref(false)

const outstanding = computed(() => (props.utang ? getOutstandingBalance(props.utang) : 0))

function draftKey(utangId: string) {
  return `payment:${utangId}`
}

let stopWatch: (() => void) | null = null

watch(
  () => props.utang,
  (u) => {
    if (stopWatch) {
      stopWatch()
      stopWatch = null
    }
    if (!u) return
    const draft = load<{ amount?: number; note?: string }>(draftKey(u.id))
    amount.value = draft?.amount ?? getOutstandingBalance(u)
    note.value = draft?.note ?? ''
    stopWatch = watch(
      [amount, note],
      ([a, n]) => save(draftKey(u.id), { amount: a, note: n }),
      { deep: true }
    )
  },
  { immediate: true }
)

async function submit() {
  if (!props.utang || !amount.value) return
  saving.value = true
  try {
    await recordPayment(props.utang, amount.value, note.value)
    clear(draftKey(props.utang.id))
    toast.success('Payment recorded')
    emit('saved')
    emit('update:modelValue', false)
  } catch {
    toast.error('Could not record payment')
  } finally {
    saving.value = false
  }
}
</script>
