<template>
  <div>
    <div v-if="loading" class="text-center text-slate-400 py-16">Loading…</div>

    <div v-else-if="notFound || !utang" class="text-center py-16 space-y-2">
      <LockKeyhole :size="32" class="mx-auto text-slate-300 dark:text-slate-600" />
      <p class="font-semibold text-slate-600 dark:text-slate-300">This link isn't available</p>
      <p class="text-sm text-slate-400 dark:text-slate-500 px-6">
        It may have expired (links last 24 hours), been turned off by the store, or the link is incorrect. Please ask the store for a new one.
      </p>
    </div>

    <div v-else class="space-y-5">
      <NuxtLink :to="`/share/${personId}`" class="flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400">
        <ArrowLeft :size="16" /> Back
      </NuxtLink>

      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">{{ utang.type }} utang</span>
          <span class="text-[11px] uppercase font-semibold px-2 py-1 rounded-full" :class="statusClass(utang.status)">{{ utang.status }}</span>
        </div>

        <div class="space-y-1.5 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">Original amount</span>
            <span class="font-medium dark:text-slate-100">{{ formatCurrency(utang.amount) }}</span>
          </div>
          <div v-if="hasInterest" class="flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">
              Interest ({{ utang.interestType === 'percentage' ? `${utang.interestValue}%` : formatCurrency(utang.interestValue || 0) }}) {{ interestFrequencyLabel(utang.interestFrequency) }}
            </span>
            <span class="font-medium text-amber-600 dark:text-amber-400">+ {{ formatCurrency(accruedInterest) }}</span>
          </div>
          <div v-if="hasInterest" class="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700">
            <span class="text-slate-600 dark:text-slate-300 font-medium">Total after interest</span>
            <span class="font-semibold dark:text-slate-100">{{ formatCurrency(utang.amount + accruedInterest) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">Paid so far</span>
            <span class="font-medium text-emerald-600 dark:text-emerald-400">{{ formatCurrency(utang.amountPaid) }}</span>
          </div>
          <div class="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700">
            <span class="font-semibold text-slate-700 dark:text-slate-200">Outstanding balance</span>
            <span class="font-bold" :class="outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
              {{ formatCurrency(outstanding) }}
            </span>
          </div>
        </div>

        <div v-if="utang.note" class="text-sm">
          <span class="text-slate-500 dark:text-slate-400">Note: </span>
          <span class="dark:text-slate-200">{{ utang.note }}</span>
        </div>

        <div class="text-xs text-slate-400 dark:text-slate-500">Created {{ formatDateTime(utang.createdAt) }}</div>
      </div>

      <div v-if="utang.dueDate" class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-1">
        <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><CalendarClock :size="15" /> Due date</span>
        <p class="text-sm font-medium" :class="dueDateTextClass">
          {{ formatDate(utang.dueDate) }}
          <span v-if="dueStatus === 'overdue'"> · overdue</span>
          <span v-else-if="dueStatus === 'approaching'"> · due soon</span>
        </p>
      </div>

      <div v-if="utang.type === 'tinda' && utang.items?.length" class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Products loaned</p>
        <div class="space-y-1.5">
          <div v-for="(item, idx) in utang.items" :key="idx" class="flex items-center justify-between text-sm">
            <span class="text-slate-600 dark:text-slate-300">{{ item.quantity }}× {{ item.productName }}</span>
            <span class="text-slate-500 dark:text-slate-400">{{ formatCurrency(item.unitPrice * item.quantity) }}</span>
          </div>
        </div>
      </div>

      <div>
        <p class="font-semibold text-slate-800 dark:text-slate-200 mb-2">Payment history</p>
        <div v-if="utangPayments.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          No payments recorded yet{{ utang.status === 'partial' ? ' — balance shown reflects manual adjustments.' : '.' }}
        </div>
        <div v-else class="space-y-2">
          <div v-for="pay in utangPayments" :key="pay.id" class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div>
              <p class="text-sm font-medium dark:text-slate-100">{{ formatCurrency(pay.amount) }}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ pay.note || 'Payment' }}</p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">{{ formatDateTime(pay.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, CalendarClock, LockKeyhole } from 'lucide-vue-next'

definePageMeta({ layout: 'share' })

const route = useRoute()
const personId = route.params.personId as string
const utangId = route.params.utangId as string

const { utangs, payments, loading, notFound, load } = usePublicShare()
const { formatCurrency, formatDateTime, formatDate, calculateAccruedInterest, getDueStatus, interestFrequencyLabel } = useUtangCalc()

onMounted(() => {
  load(personId)
})

const utang = computed(() => utangs.value.find((u) => u.id === utangId) || null)
const utangPayments = computed(() => payments.value.filter((p) => p.utangId === utangId).sort((a, b) => b.createdAt - a.createdAt))

const hasInterest = computed(() => !!(utang.value?.interestType && utang.value?.interestValue && utang.value?.interestFrequency))
const accruedInterest = computed(() => (utang.value ? calculateAccruedInterest(utang.value) : 0))
const outstanding = computed(() => {
  if (!utang.value) return 0
  const total = utang.value.amount + accruedInterest.value
  return Math.max(0, +(total - utang.value.amountPaid).toFixed(2))
})

const dueStatus = computed(() => (utang.value ? getDueStatus(utang.value) : 'none'))
const dueDateTextClass = computed(() => {
  if (dueStatus.value === 'overdue') return 'text-rose-600 dark:text-rose-400'
  if (dueStatus.value === 'approaching') return 'text-amber-600 dark:text-amber-400'
  if (dueStatus.value === 'paid') return 'text-emerald-600 dark:text-emerald-400'
  return 'text-slate-600 dark:text-slate-300'
})

function statusClass(status: string) {
  if (status === 'paid') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  if (status === 'partial') return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
}
</script>
