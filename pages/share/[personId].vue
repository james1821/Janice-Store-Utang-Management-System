<template>
  <div>
    <div v-if="loading" class="text-center text-slate-400 py-16">Loading…</div>

    <div v-else-if="notFound" class="text-center py-16 space-y-2">
      <LockKeyhole :size="32" class="mx-auto text-slate-300 dark:text-slate-600" />
      <p class="font-semibold text-slate-600 dark:text-slate-300">This link isn't available</p>
      <p class="text-sm text-slate-400 dark:text-slate-500 px-6">
        It may have expired (links last 24 hours), been turned off by the store, or the link is incorrect. Please ask the store for a new one.
      </p>
    </div>

    <div v-else-if="person" class="space-y-5">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <img v-if="person.photoUrl" :src="person.photoUrl" class="w-full h-full object-cover" alt="" />
          <User v-else :size="24" class="text-slate-400 dark:text-slate-500" />
        </div>
        <div class="min-w-0">
          <h1 class="text-xl font-bold dark:text-slate-100 truncate">{{ person.fullName }}</h1>
          <p class="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Eye :size="12" /> You're viewing your own utang history
          </p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-400 dark:text-slate-500">Outstanding balance</p>
          <p class="text-2xl font-bold" :class="outstandingTotal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
            {{ formatCurrency(outstandingTotal) }}
          </p>
        </div>
        <span v-if="outstandingTotal <= 0" class="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full">Fully Paid</span>
      </div>

      <div>
        <h2 class="font-semibold text-slate-800 dark:text-slate-200 mb-2">Utang history</h2>

        <div v-if="utangs.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          No utang recorded.
        </div>

        <div v-else class="space-y-4">
          <div v-for="group in groupedUtangs" :key="group.label">
            <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{{ group.label }}</p>
            <div class="space-y-2">
              <NuxtLink
                v-for="u in group.items"
                :key="u.id"
                :to="`/share/${personId}/${u.id}`"
                class="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 active:bg-slate-50 dark:active:bg-slate-700"
              >
                <div class="flex items-start justify-between">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">{{ u.type }}</span>
                      <span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full" :class="statusClass(u.status)">{{ u.status }}</span>
                    </div>
                    <p v-if="u.type === 'tinda'" class="text-sm mt-0.5 dark:text-slate-200">
                      {{ u.items?.map((i) => `${i.quantity}× ${i.productName}`).join(', ') }}
                    </p>
                    <p v-if="u.note" class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ u.note }}</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">{{ formatDateTime(u.createdAt) }}</p>
                    <p v-if="interestAmount(u) > 0" class="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1">
                      + {{ formatCurrency(interestAmount(u)) }} interest so far
                    </p>
                    <p v-if="u.dueDate" class="text-[11px] font-medium mt-1 flex items-center gap-1" :class="dueDateClass(u)">
                      <CalendarClock :size="12" />
                      Due {{ formatDate(u.dueDate) }}{{ getDueStatus(u) === 'overdue' ? ' · overdue' : getDueStatus(u) === 'approaching' ? ' · due soon' : '' }}
                    </p>
                  </div>
                  <div class="text-right shrink-0 ml-2">
                    <p class="font-semibold text-sm dark:text-slate-100">{{ formatCurrency(getOutstandingBalance(u)) }}</p>
                    <p v-if="u.amountPaid > 0" class="text-[11px] text-slate-400 dark:text-slate-500">paid {{ formatCurrency(u.amountPaid) }}</p>
                    <p class="text-[11px] text-slate-300 dark:text-slate-600 mt-0.5">Details →</p>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div v-if="payments.length > 0">
        <h2 class="font-semibold text-slate-800 dark:text-slate-200 mb-2">Payment history</h2>
        <div class="space-y-4">
          <div v-for="group in groupedPayments" :key="group.label">
            <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{{ group.label }}</p>
            <div class="space-y-2">
              <div v-for="pay in group.items" :key="pay.id" class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Eye, LockKeyhole, CalendarClock } from 'lucide-vue-next'
import type { Utang } from '~/types'

definePageMeta({ layout: 'share' })

const route = useRoute()
const personId = route.params.personId as string

const { person, utangs, payments, loading, notFound, load } = usePublicShare()
const { formatCurrency, formatDateTime, formatDate, getOutstandingBalance, calculateAccruedInterest, getDueStatus, groupByDateLabel } = useUtangCalc()

useHead({
  title: () => (person.value ? `${person.value.fullName} Payment history` : 'Payment history')
})

onMounted(() => {
  load(personId)
})

const outstandingTotal = computed(() => utangs.value.reduce((sum, u) => sum + getOutstandingBalance(u), 0))

function interestAmount(u: Utang) {
  return calculateAccruedInterest(u)
}
function dueDateClass(u: Utang) {
  const status = getDueStatus(u)
  if (status === 'overdue') return 'text-rose-600 dark:text-rose-400'
  if (status === 'approaching') return 'text-amber-600 dark:text-amber-400'
  return 'text-slate-400 dark:text-slate-500'
}
function statusClass(status: string) {
  if (status === 'paid') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  if (status === 'partial') return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
}

const groupedUtangs = computed(() => groupByDateLabel(utangs.value, (u) => u.createdAt))
const groupedPayments = computed(() => groupByDateLabel(payments.value, (p) => p.createdAt))
</script>
