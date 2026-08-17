<template>
  <div class="space-y-4 lg:space-y-6 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
    <div class="shrink-0">
      <h1 class="text-xl lg:text-3xl font-bold dark:text-slate-100">Calendar</h1>
      <p class="hidden lg:block text-slate-500 dark:text-slate-400 mt-1 text-sm">Track upcoming and overdue utang due dates.</p>
    </div>

    <div class="lg:grid lg:grid-cols-3 lg:gap-8 space-y-4 lg:space-y-0 lg:flex-1 lg:min-h-0">
      <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl border border-slate-200 dark:border-slate-700 p-3 lg:p-6 lg:h-full lg:flex lg:flex-col lg:min-h-0 lg:overflow-hidden">
        <div class="flex items-center justify-between mb-3 lg:mb-5 shrink-0">
          <button type="button" @click="prevMonth" class="w-8 h-8 lg:w-9 lg:h-9 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"><ChevronLeft :size="16" /></button>
          <p class="font-semibold text-sm lg:text-lg dark:text-slate-100">{{ monthLabel }}</p>
          <button type="button" @click="nextMonth" class="w-8 h-8 lg:w-9 lg:h-9 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"><ChevronRight :size="16" /></button>
        </div>

        <div class="grid grid-cols-7 gap-1 lg:gap-2 mb-1 shrink-0">
          <div v-for="d in weekdayLabels" :key="d" class="text-center text-[10px] lg:text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{{ d }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1 lg:gap-2 lg:flex-1 lg:min-h-0 lg:grid-rows-6">
          <button
            v-for="day in gridDays"
            :key="day.key"
            type="button"
            @click="selectDay(day)"
            class="aspect-square lg:aspect-auto lg:w-full lg:h-full rounded-lg lg:rounded-xl flex flex-col items-center justify-center gap-0.5 lg:gap-1 text-xs lg:text-sm relative lg:border lg:border-transparent"
            :class="[
              day.inMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600',
              isSelected(day) ? 'bg-emerald-600 text-white' : isToday(day) ? 'bg-emerald-50 dark:bg-emerald-900/30 font-semibold lg:border-emerald-200 dark:lg:border-emerald-800' : 'active:bg-slate-50 dark:active:bg-slate-700 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-700 lg:hover:border-slate-200 lg:dark:hover:border-slate-600'
            ]"
          >
            {{ day.date.getDate() }}
            <span v-if="day.entries.length" class="flex gap-0.5">
              <span
                v-for="(dot, idx) in day.entries.slice(0, 3)"
                :key="idx"
                class="w-1.5 h-1.5 rounded-full"
                :class="isSelected(day) ? 'bg-white' : dotClass(dot)"
              />
            </span>
          </button>
        </div>
      </div>

      <div class="lg:h-full lg:flex lg:flex-col lg:min-h-0">
        <p class="font-semibold text-slate-800 dark:text-slate-200 mb-2 lg:text-lg shrink-0">
          {{ selectedDate ? `Due on ${formatDate(selectedDate.getTime())}` : `Due in ${monthLabel}` }}
        </p>

        <div v-if="agendaList.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center shrink-0">
          No utangs due{{ selectedDate ? ' on this day' : ' this month' }}.
        </div>

        <div v-else class="space-y-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <NuxtLink
            v-for="u in agendaList"
            :key="u.id"
            :to="`/utangs/${u.id}`"
            class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 active:bg-slate-50 dark:active:bg-slate-700 lg:hover:border-slate-300 dark:lg:hover:border-slate-600"
          >
            <div class="min-w-0">
              <p class="font-medium text-sm dark:text-slate-100 truncate">{{ personName(u.personId) }}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500 capitalize">{{ u.type }} · {{ formatDate(u.dueDate!) }}</p>
            </div>
            <div class="text-right shrink-0 ml-2">
              <p class="font-semibold text-sm dark:text-slate-100">{{ formatCurrency(getOutstandingBalance(u)) }}</p>
              <span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full" :class="statusPillClass(u)">
                {{ getDueStatus(u) === 'overdue' ? 'overdue' : u.status }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Utang } from '~/types'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { init: initPeople, people } = usePeople()
const { init: initUtangs, utangs } = useUtangs()
const { formatCurrency, formatDate, getOutstandingBalance, getDueStatus } = useUtangCalc()

onMounted(() => {
  initPeople()
  initUtangs()
})

const today = new Date()
const viewMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref<Date | null>(null)

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const monthLabel = computed(() => viewMonth.value.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }))

function prevMonth() {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() - 1, 1)
  selectedDate.value = null
}
function nextMonth() {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + 1, 1)
  selectedDate.value = null
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const dueUtangs = computed(() => utangs.value.filter((u) => !!u.dueDate))

interface GridDay {
  key: string
  date: Date
  inMonth: boolean
  entries: Utang[]
}

const gridDays = computed<GridDay[]>(() => {
  const year = viewMonth.value.getFullYear()
  const month = viewMonth.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay() // 0=Sun
  const gridStart = new Date(year, month, 1 - startOffset)

  const days: GridDay[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const entries = dueUtangs.value.filter((u) => isSameDay(new Date(u.dueDate!), date))
    days.push({
      key: date.toISOString().slice(0, 10),
      date,
      inMonth: date.getMonth() === month,
      entries
    })
  }
  return days
})

function isToday(day: GridDay) {
  return isSameDay(day.date, today)
}
function isSelected(day: GridDay) {
  return !!selectedDate.value && isSameDay(day.date, selectedDate.value)
}
function selectDay(day: GridDay) {
  selectedDate.value = isSelected(day) ? null : new Date(day.date)
}

function dotClass(u: Utang) {
  const status = getDueStatus(u)
  if (status === 'overdue') return 'bg-rose-500'
  if (status === 'approaching') return 'bg-amber-500'
  if (status === 'paid') return 'bg-emerald-500'
  return 'bg-slate-400 dark:bg-slate-500'
}

function statusPillClass(u: Utang) {
  const status = getDueStatus(u)
  if (status === 'overdue') return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
  if (u.status === 'paid') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  if (u.status === 'partial') return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
  return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
}

function personName(id: string) {
  return people.value.find((p) => p.id === id)?.fullName || 'Unknown'
}

// Below the calendar: entries due on the selected day, or the whole visible month if no day is picked.
const agendaList = computed(() => {
  let list: Utang[]
  if (selectedDate.value) {
    list = dueUtangs.value.filter((u) => isSameDay(new Date(u.dueDate!), selectedDate.value!))
  } else {
    const year = viewMonth.value.getFullYear()
    const month = viewMonth.value.getMonth()
    list = dueUtangs.value.filter((u) => {
      const d = new Date(u.dueDate!)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }
  return [...list].sort((a, b) => (a.dueDate! - b.dueDate!))
})
</script>
