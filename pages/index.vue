<template>
  <div class="space-y-5 lg:space-y-4 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
    <!-- Mobile: original stacked summary. Desktop: hidden, replaced by the dashboard header below. -->
    <div class="lg:hidden space-y-5">
      <div>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Total outstanding utang</p>
        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{{ formatCurrency(totalOutstanding) }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ activeDebtorCount }} {{ activeDebtorCount === 1 ? 'customer' : 'customers' }} with active utang</p>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <p class="text-xs text-slate-400 dark:text-slate-500">Tinda</p>
          <p class="font-semibold text-sm mt-1 dark:text-slate-100">{{ formatCurrency(byCategory.tinda) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <p class="text-xs text-slate-400 dark:text-slate-500">Cash</p>
          <p class="font-semibold text-sm mt-1 dark:text-slate-100">{{ formatCurrency(byCategory.cash) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <p class="text-xs text-slate-400 dark:text-slate-500">GCash</p>
          <p class="font-semibold text-sm mt-1 dark:text-slate-100">{{ formatCurrency(byCategory.gcash) }}</p>
        </div>
      </div>

      <button
        @click="showQuickAdd = true"
        class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3.5 text-center active:opacity-80 flex items-center justify-center gap-2"
      >
        <Plus :size="18" />
        New Utang
      </button>

      <div class="grid grid-cols-2 gap-3">
        <NuxtLink to="/people?new=1" class="rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-semibold py-3.5 text-center active:opacity-80 flex items-center justify-center gap-1.5">
          <Plus :size="16" /> Add Customer
        </NuxtLink>
        <NuxtLink to="/products?new=1" class="rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-semibold py-3.5 text-center active:opacity-80 flex items-center justify-center gap-1.5">
          <Plus :size="16" /> Add Product
        </NuxtLink>
      </div>
    </div>

    <!-- Desktop dashboard header -->
    <div class="hidden lg:block space-y-3 lg:shrink-0">
      <div class="flex items-center justify-between gap-6">
        <div>
          <h1 class="text-xl xl:text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of everything owed across your store.</p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
          <NuxtLink to="/people?new=1" class="rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3.5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5">
            <Plus :size="16" /> Customer
          </NuxtLink>
          <NuxtLink to="/products?new=1" class="rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3.5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5">
            <Plus :size="16" /> Product
          </NuxtLink>
          <button
            @click="showQuickAdd = true"
            class="rounded-lg bg-emerald-600 text-white font-semibold px-3.5 py-2 text-sm hover:opacity-90 flex items-center gap-1.5 shadow-sm shadow-emerald-600/30"
          >
            <Plus :size="16" /> New Utang
          </button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-3">
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-500 dark:text-slate-400">Total outstanding</p>
            <span class="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0"><Wallet2 :size="14" /></span>
          </div>
          <p class="text-lg xl:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">{{ formatCurrency(totalOutstanding) }}</p>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{{ activeDebtorCount }} {{ activeDebtorCount === 1 ? 'customer' : 'customers' }} with active utang</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-500 dark:text-slate-400">Tinda</p>
            <span class="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"><ShoppingCart :size="14" /></span>
          </div>
          <p class="text-lg xl:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">{{ formatCurrency(byCategory.tinda) }}</p>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Goods on credit</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-500 dark:text-slate-400">Cash</p>
            <span class="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"><Banknote :size="14" /></span>
          </div>
          <p class="text-lg xl:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">{{ formatCurrency(byCategory.cash) }}</p>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Cash loans</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-500 dark:text-slate-400">GCash</p>
            <span class="w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0"><Smartphone :size="14" /></span>
          </div>
          <p class="text-lg xl:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">{{ formatCurrency(byCategory.gcash) }}</p>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">GCash loans</p>
        </div>
      </div>
    </div>

    <div class="lg:grid lg:grid-cols-3 lg:gap-8 lg:flex-1 lg:min-h-0">
      <div class="lg:col-span-2 lg:h-full lg:flex lg:flex-col lg:min-h-0">
        <div class="flex items-center justify-between mb-2 lg:mb-3 shrink-0">
          <h2 class="font-semibold text-slate-800 dark:text-slate-200 lg:text-lg">Recent activity</h2>
          <SortToggle v-model="activitySort" :options="activitySortOptions" />
        </div>
        <div v-if="activityItems.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center shrink-0">
          No activity yet.
        </div>
        <div v-else class="space-y-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-2">
          <div v-for="group in groupedActivity" :key="group.label">
            <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{{ group.label }}</p>
            <div class="space-y-2 lg:bg-white lg:dark:bg-slate-800 lg:rounded-xl lg:border lg:border-slate-200 lg:dark:border-slate-700 lg:divide-y lg:divide-slate-100 lg:dark:divide-slate-700 lg:space-y-0 lg:overflow-hidden">
              <NuxtLink
                v-for="item in group.items"
                :key="item.id"
                :to="`/people/${item.personId}`"
                class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 active:bg-slate-50 dark:active:bg-slate-700 lg:rounded-none lg:border-0 lg:px-4 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-700/60"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    <img v-if="personPhoto(item.personId)" :src="personPhoto(item.personId)" class="w-full h-full object-cover" alt="" />
                    <User v-else :size="15" class="text-slate-400 dark:text-slate-500" />
                  </span>
                  <div class="min-w-0">
                    <p class="font-medium text-sm dark:text-slate-100 truncate">{{ personName(item.personId) }}</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 capitalize truncate">{{ item.label }} · {{ formatDateTime(item.createdAt) }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0 ml-2">
                  <p class="font-semibold text-sm dark:text-slate-100">{{ item.kind === 'payment' ? '+' : '' }}{{ formatCurrency(item.amount) }}</p>
                  <span
                    class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full"
                    :class="statusClass(item.status)"
                  >{{ item.status }}</span>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden lg:block space-y-3 lg:h-full lg:overflow-y-auto lg:pr-1">
        <h2 class="font-semibold text-slate-800 dark:text-slate-200 lg:text-lg mb-1">Quick links</h2>
        <NuxtLink to="/people" class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600">
          <span class="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200"><Users :size="17" class="text-slate-400" /> Manage customers</span>
          <ChevronRight :size="16" class="text-slate-300" />
        </NuxtLink>
        <NuxtLink to="/calendar" class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600">
          <span class="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200"><CalendarClock :size="17" class="text-slate-400" /> Upcoming due dates</span>
          <ChevronRight :size="16" class="text-slate-300" />
        </NuxtLink>
        <NuxtLink to="/products" class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600">
          <span class="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200"><ShoppingCart :size="17" class="text-slate-400" /> Product catalog</span>
          <ChevronRight :size="16" class="text-slate-300" />
        </NuxtLink>
        <NuxtLink to="/backup" class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600">
          <span class="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200"><Save :size="17" class="text-slate-400" /> Backup your data</span>
          <ChevronRight :size="16" class="text-slate-300" />
        </NuxtLink>
      </div>
    </div>

    <AddUtangModal v-model="showQuickAdd" />
  </div>
</template>

<script setup lang="ts">
import { Plus, User, Clock, Wallet2, ShoppingCart, Banknote, Smartphone, Users, CalendarClock, Save, ChevronRight } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { init: initPeople, people } = usePeople()
const { init: initProducts } = useProducts()
const { init: initUtangs, utangs, totalOutstanding, activeDebtorCount, byCategory } = useUtangs()
const { init: initPayments, payments } = usePayments()
const { formatCurrency, formatDateTime, groupByDateLabel } = useUtangCalc()

onMounted(() => {
  initPeople()
  initProducts()
  initUtangs()
  initPayments()
})

const showQuickAdd = ref(false)

const activitySort = ref<'new' | 'old'>('new')
const activitySortOptions = [
  { value: 'new', label: 'Newest first', icon: Clock },
  { value: 'old', label: 'Oldest first', icon: Clock }
]

interface ActivityItem {
  id: string
  kind: 'utang' | 'payment'
  personId: string
  createdAt: number
  label: string
  amount: number
  status: string
}

const activityItems = computed<ActivityItem[]>(() => {
  const utangItems: ActivityItem[] = utangs.value.map((u) => ({
    id: `utang-${u.id}`,
    kind: 'utang',
    personId: u.personId,
    createdAt: u.createdAt,
    label: `New ${u.type} utang`,
    amount: u.amount,
    status: u.status
  }))
  const paymentItems: ActivityItem[] = payments.value.map((p) => {
    const utang = utangs.value.find((u) => u.id === p.utangId)
    return {
      id: `payment-${p.id}`,
      kind: 'payment',
      personId: p.personId,
      createdAt: p.createdAt,
      label: utang ? `Payment · ${utang.type}` : 'Payment',
      amount: p.amount,
      status: utang?.status || 'partial'
    }
  })
  const merged = [...utangItems, ...paymentItems]
  merged.sort((a, b) => (activitySort.value === 'new' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))
  return merged.slice(0, 15)
})

const groupedActivity = computed(() => groupByDateLabel(activityItems.value, (item) => item.createdAt))

function personName(id: string) {
  return people.value.find((p) => p.id === id)?.fullName || 'Unknown'
}

function personPhoto(id: string) {
  return people.value.find((p) => p.id === id)?.photoUrl || ''
}

function statusClass(status: string) {
  if (status === 'paid') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  if (status === 'partial') return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
}
</script>
