<template>
  <div v-if="utang && person" class="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
    <button @click="goBack" class="lg:col-span-3 w-fit inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-700">
      <ArrowLeft :size="16" /> Back
    </button>

    <!-- Left column: summary, sticky on desktop -->
    <div class="space-y-5 lg:sticky lg:top-24">
      <NuxtLink :to="`/people/${person.id}`" class="flex items-center gap-3">
        <div
          class="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"
          :class="person.photoUrl ? 'cursor-zoom-in' : ''"
          @click.prevent="person.photoUrl && openLightbox(person.photoUrl, person.fullName)"
        >
          <img v-if="person.photoUrl" :src="person.photoUrl" class="w-full h-full object-cover" alt="" />
          <User v-else :size="20" class="text-slate-400 dark:text-slate-500" />
        </div>
        <div class="min-w-0">
          <p class="font-semibold dark:text-slate-100 truncate">{{ person.fullName }}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">View profile <ChevronRight :size="12" /></p>
        </div>
      </NuxtLink>

      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">{{ utang.type }} utang</span>
          <div class="flex items-center gap-2">
            <span class="text-[11px] uppercase font-semibold px-2 py-1 rounded-full" :class="statusClass(utang.status)">{{ utang.status }}</span>
            <button type="button" @click="showEditUtang = true" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-700" aria-label="Edit utang">
              <Pencil :size="15" />
            </button>
          </div>
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

        <div v-if="utang.gcashNumber" class="text-sm">
          <span class="text-slate-500 dark:text-slate-400">GCash number: </span>
          <span class="font-medium dark:text-slate-100">{{ utang.gcashNumber }}</span>
        </div>

        <div v-if="utang.note" class="text-sm">
          <span class="text-slate-500 dark:text-slate-400">Note: </span>
          <span class="dark:text-slate-200">{{ utang.note }}</span>
        </div>

        <div class="text-xs text-slate-400 dark:text-slate-500">Created {{ formatDateTime(utang.createdAt) }}</div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><CalendarClock :size="15" /> Due date</span>
          <button type="button" @click="editingDueDate = !editingDueDate" class="rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-700">
            {{ editingDueDate ? 'Cancel' : utang.dueDate ? 'Change' : 'Set date' }}
          </button>
        </div>
        <p v-if="!editingDueDate && utang.dueDate" class="text-sm font-medium" :class="dueDateTextClass">
          {{ formatDate(utang.dueDate) }}
          <span v-if="dueStatus === 'overdue'"> · overdue</span>
          <span v-else-if="dueStatus === 'approaching'"> · due soon</span>
        </p>
        <p v-else-if="!editingDueDate" class="text-sm text-slate-400 dark:text-slate-500">No due date set.</p>
        <div v-if="editingDueDate" class="flex gap-2">
          <input v-model="dueDateInput" type="date" class="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
          <button type="button" @click="saveDueDate" :disabled="!dueDateInput" class="rounded-lg bg-emerald-600 text-white text-sm font-semibold px-3 disabled:opacity-50">Save</button>
        </div>
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

      <div class="flex gap-2">
        <button v-if="utang.status !== 'paid'" @click="showPayment = true" class="flex-1 rounded-xl bg-emerald-600 text-white text-sm font-semibold py-3 active:opacity-80 lg:hover:opacity-90 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30">
          <Banknote :size="16" /> Record payment
        </button>
        <button v-if="utang.status !== 'paid'" @click="confirmMarkPaid = true" class="rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-semibold py-3 px-4 active:bg-slate-50 dark:active:bg-slate-700 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-700 flex items-center justify-center gap-1.5">
          <CheckCircle2 :size="16" /> Mark paid
        </button>
        <button @click="showEditUtang = true" class="rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-semibold py-3 px-4 active:bg-slate-50 dark:active:bg-slate-700 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-700 flex items-center justify-center gap-1.5" :class="utang.status === 'paid' ? 'flex-1' : ''">
          <Pencil :size="16" /> Edit utang
        </button>
      </div>
    </div>

    <!-- Right column: payment history -->
    <div class="lg:col-span-2">
      <p class="font-semibold text-slate-800 dark:text-slate-200 mb-2 lg:text-lg">Payment history</p>
      <div v-if="utangPayments.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
        No payments recorded yet{{ utang.status === 'partial' ? ' — balance shown reflects manual adjustments.' : '.' }}
      </div>
      <div v-else class="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
        <div v-for="pay in utangPayments" :key="pay.id" class="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <div class="min-w-0">
            <p class="text-sm font-medium dark:text-slate-100">{{ formatCurrency(pay.amount) }}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 truncate">{{ pay.note || 'Payment' }}</p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <p class="text-xs text-slate-400 dark:text-slate-500">{{ formatDateTime(pay.createdAt) }}</p>
            <button
              type="button"
              @click="askDeletePayment(pay)"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 active:bg-rose-50 dark:active:bg-rose-900/20"
              aria-label="Delete payment"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <PaymentModal v-model="showPayment" :utang="utang" />
    <AddUtangModal v-model="showEditUtang" :edit-utang="utang" />

    <ConfirmDialog
      v-model="confirmMarkPaid"
      title="Mark as fully paid?"
      message="This will settle the remaining balance on this utang entry without recording a matching payment amount."
      confirm-label="Mark paid"
      danger
      @confirm="doMarkPaid"
    />

    <ConfirmDialog
      v-model="confirmDeletePayment"
      title="Delete this payment?"
      message="This payment will be removed and the outstanding balance will be updated to reflect the remaining payments."
      confirm-label="Delete"
      danger
      @confirm="doDeletePayment"
    />
  </div>
  <div v-else class="text-center text-slate-400 py-10">Loading…</div>
</template>

<script setup lang="ts">
import { ArrowLeft, User, ChevronRight, CalendarClock, Banknote, CheckCircle2, Pencil, Trash2 } from 'lucide-vue-next'
import type { Payment } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const utangId = route.params.id as string

const { getUtang, init: initUtangs, markUtangPaid, updateUtang } = useUtangs()
const { getPerson, init: initPeople } = usePeople()
const { init: initPayments, forUtang, deletePayment } = usePayments()
const { formatCurrency, formatDateTime, formatDate, calculateAccruedInterest, getDueStatus, interestFrequencyLabel } = useUtangCalc()
const { open: openLightbox } = useLightbox()
const toast = useToast()

onMounted(() => {
  initUtangs()
  initPeople()
  initPayments()
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

const utang = getUtang(utangId)
const person = computed(() => (utang.value ? getPerson(utang.value.personId).value : null))
const utangPayments = computed(() => (utang.value ? forUtang(utang.value.id).value : []))

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

// Due date editing
const editingDueDate = ref(false)
const dueDateInput = ref('')
watch(
  () => utang.value?.dueDate,
  (ts) => {
    dueDateInput.value = ts ? new Date(ts).toISOString().slice(0, 10) : ''
  },
  { immediate: true }
)
async function saveDueDate() {
  if (!utang.value || !dueDateInput.value) return
  const ts = new Date(`${dueDateInput.value}T00:00:00`).getTime()
  if (Number.isNaN(ts)) return
  await updateUtang(utang.value.id, { dueDate: ts })
  toast.success('Due date updated')
  editingDueDate.value = false
}

// Payment
const showPayment = ref(false)

// Delete a recorded payment (rolls the utang balance back)
const confirmDeletePayment = ref(false)
const paymentToDelete = ref<Payment | null>(null)
function askDeletePayment(pay: Payment) {
  paymentToDelete.value = pay
  confirmDeletePayment.value = true
}
async function doDeletePayment() {
  if (!paymentToDelete.value || !utang.value) return
  const payment = paymentToDelete.value
  try {
    await deletePayment(payment, utang.value)
    toast.success('Payment deleted')
  } catch {
    toast.error('Could not delete payment')
  } finally {
    paymentToDelete.value = null
  }
}

// Full edit (opens AddUtangModal in edit mode, pre-filled from this utang)
const showEditUtang = ref(false)

// Mark paid
const confirmMarkPaid = ref(false)
async function doMarkPaid() {
  if (!utang.value) return
  await markUtangPaid(utang.value.id, utang.value)
  toast.success('Marked as paid')
}
</script>