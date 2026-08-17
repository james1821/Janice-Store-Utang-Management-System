<template>
  <div v-if="person" class="space-y-5 lg:space-y-0 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
    <button @click="goBack" class="shrink-0 flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 lg:mb-5">
      <ArrowLeft :size="16" /> Back
    </button>

    <div class="lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-3 lg:gap-8 space-y-5 lg:space-y-0">
    <!-- Left column: profile summary, always visible on desktop -->
    <div class="space-y-5 lg:space-y-4 lg:h-full lg:overflow-y-auto lg:pr-1">
      <div class="flex items-start justify-between lg:block">
        <div class="flex items-center gap-3 min-w-0 lg:flex-col lg:items-start lg:gap-3">
          <div
            class="w-14 h-14 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"
            :class="person.photoUrl ? 'cursor-zoom-in' : ''"
            @click="person.photoUrl && openLightbox(person.photoUrl, person.fullName)"
          >
            <img v-if="person.photoUrl" :src="person.photoUrl" class="w-full h-full object-cover" alt="" />
            <User v-else :size="24" class="lg:hidden text-slate-400 dark:text-slate-500" />
            <User v-if="!person.photoUrl" :size="32" class="hidden lg:block text-slate-400 dark:text-slate-500" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <h1 class="text-xl lg:text-2xl font-bold dark:text-slate-100 truncate">{{ person.fullName }}</h1>
              <button
                type="button"
                @click="toggleFavorite(personId)"
                class="w-7 h-7 flex items-center justify-center rounded-full shrink-0"
                :class="person.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'"
                :aria-label="person.isFavorite ? 'Remove from favorites' : 'Mark as favorite'"
              >
                <Star :size="18" :fill="person.isFavorite ? 'currentColor' : 'none'" />
              </button>
            </div>
          </div>
        </div>
        <button @click="openEditPerson" class="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 lg:mt-3">
          <Pencil :size="14" /> Edit
        </button>
      </div>

      <div
        v-if="hasContactInfo"
        class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden"
      >
        <div v-if="person.phoneNumber" class="flex items-center gap-3 px-4 py-3">
          <span class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0">
            <Phone :size="16" />
          </span>
          <div class="min-w-0">
            <p class="text-[11px] text-slate-400 dark:text-slate-500">Phone</p>
            <p class="text-sm font-medium dark:text-slate-100 truncate">{{ person.phoneNumber }}</p>
          </div>
        </div>
        <div v-if="person.gcashName || person.gcashNumber" class="flex items-center gap-3 px-4 py-3">
          <span class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0">
            <Wallet :size="16" />
          </span>
          <div class="min-w-0">
            <p class="text-[11px] text-slate-400 dark:text-slate-500">GCash</p>
            <p class="text-sm font-medium dark:text-slate-100 truncate">
              {{ person.gcashName }}<span v-if="person.gcashName && person.gcashNumber"> · </span>{{ person.gcashNumber }}
            </p>
          </div>
        </div>
        <div v-if="person.address" class="flex items-center gap-3 px-4 py-3">
          <span class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0">
            <MapPin :size="16" />
          </span>
          <div class="min-w-0">
            <p class="text-[11px] text-slate-400 dark:text-slate-500">Address</p>
            <p class="text-sm font-medium dark:text-slate-100 truncate">{{ person.address }}</p>
          </div>
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

      <button @click="showAddUtang = true" class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 active:opacity-80 lg:hover:opacity-90 flex items-center justify-center gap-1.5">
        <Plus :size="16" /> Add Utang
      </button>

      <div class="grid grid-cols-2 gap-3">
        <button
          @click="downloadPdf"
          :disabled="exportingPdf"
          class="rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 flex items-center justify-center gap-1.5 active:bg-slate-50 dark:active:bg-slate-700 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <FileDown :size="16" /> {{ exportingPdf ? 'Preparing…' : 'PDF' }}
        </button>
        <button
          @click="showShareModal = true"
          class="rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2.5 flex items-center justify-center gap-1.5 active:bg-slate-50 dark:active:bg-slate-700 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-700"
        >
          <QrCode :size="16" /> Share
        </button>
      </div>

      <!-- <button @click="confirmDeletePerson = true" class="hidden lg:flex w-full text-sm text-rose-500 dark:text-rose-400 py-2 items-center justify-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl">
        <Trash2 :size="14" /> Delete this customer
      </button> -->
    </div>

    <!-- Right column: history -->
    <div class="lg:col-span-2 space-y-5 lg:space-y-0 lg:h-full lg:flex lg:flex-col lg:min-h-0">
      <div class="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
        <div class="sticky top-14 lg:static lg:top-auto z-30 -mx-4 px-4 lg:mx-0 lg:px-0 py-2 bg-slate-50 dark:bg-slate-900 space-y-2 shrink-0">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 dark:text-slate-200 lg:text-lg">Utang history</h2>
            <SortToggle v-model="sortBy" :options="sortOptions" />
          </div>
          <div class="flex gap-2">
            <input
              v-model="utangSearch"
              type="text"
              placeholder="Search notes, items, type…"
              class="flex-1 min-w-0 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 outline-none focus:border-emerald-500"
            />
            <select v-model="filterType" class="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 dark:text-slate-100 shrink-0">
              <option value="">All types</option>
              <option value="tinda">Tinda</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
          </div>
        </div>

        <div v-if="filteredUtangs.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center mt-2 shrink-0">
          No utang recorded yet.
        </div>

        <div v-else class="space-y-4 mt-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-2">
          <div v-for="group in groupedUtangs" :key="group.label || 'all'">
            <p v-if="group.label" class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{{ group.label }}</p>
            <div class="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
              <NuxtLink
                v-for="u in group.items"
                :key="u.id"
                :to="`/utangs/${u.id}`"
                class="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 active:bg-slate-50 dark:active:bg-slate-700 lg:hover:border-slate-300 dark:lg:hover:border-slate-600"
              >
                <div class="w-full flex items-start justify-between text-left">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">{{ u.type }}</span>
                      <span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full" :class="statusClass(u.status)">{{ u.status }}</span>
                    </div>
                    <p v-if="u.type === 'tinda'" class="text-sm mt-0.5 truncate dark:text-slate-200">
                      {{ u.items?.map((i) => `${i.quantity}× ${i.productName}`).join(', ') }}
                    </p>
                    <p v-if="u.type === 'gcash' && u.gcashNumber" class="text-sm mt-0.5 text-slate-500 dark:text-slate-400">{{ u.gcashNumber }}</p>
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

      <!-- <div v-if="personPayments.length > 0">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-semibold text-slate-800 dark:text-slate-200 lg:text-lg">Payment history</h2>
          <SortToggle v-model="paymentSortBy" :options="paymentSortOptions" />
        </div>
        <div class="space-y-4">
          <div v-for="group in groupedPayments" :key="group.label">
            <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{{ group.label }}</p>
            <div class="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
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
      </div> -->

      <!-- <button @click="confirmDeletePerson = true" class="lg:hidden w-full text-sm text-rose-500 dark:text-rose-400 py-2 flex items-center justify-center gap-1.5">
        <Trash2 :size="14" /> Delete this customer
      </button> -->
    </div>
    </div>

    <AddUtangModal v-model="showAddUtang" :person-id="person.id" />
    <ShareQrModal v-model="showShareModal" :person="person" />

    <Modal v-model="showEditPerson" title="Edit Customer">
      <form @submit.prevent="submitEditPerson" class="space-y-4">
        <ImageUploader v-model="editForm.photoUrl" :max-dimension="320" :target-k-b="35" />
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Full name *</label>
          <input v-model="editForm.fullName" required class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Phone number <span class="text-slate-400 font-normal">(optional)</span></label>
          <input v-model="editForm.phoneNumber" placeholder="09xx xxx xxxx" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">GCash name <span class="text-slate-400 font-normal">(optional)</span></label>
            <input v-model="editForm.gcashName" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">GCash number <span class="text-slate-400 font-normal">(optional)</span></label>
            <input v-model="editForm.gcashNumber" placeholder="09xx xxx xxxx" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Address <span class="text-slate-400 font-normal">(optional)</span></label>
          <input v-model="editForm.address" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <button type="submit" :disabled="savingPerson" class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 active:opacity-80 disabled:opacity-50">
          {{ savingPerson ? 'Saving…' : 'Save changes' }}
        </button>
      </form>
    </Modal>

    <ConfirmDialog
      v-model="confirmDeletePerson"
      title="Delete this customer?"
      message="This customer will be hidden from your active list. Their utang and payment history will be kept."
      confirm-label="Delete"
      danger
      @confirm="doDeletePerson"
    />
  </div>
  <div v-else class="text-center text-slate-400 py-10">Loading…</div>
</template>

<script setup lang="ts">
import { ArrowLeft, User, Star, Pencil, Phone, Wallet, MapPin, Plus, FileDown, QrCode, CalendarClock, Trash2, Clock, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-vue-next'
import type { Utang } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const personId = route.params.id as string

const { getPerson, init: initPeople, updatePerson, softDeletePerson, toggleFavorite } = usePeople()
const { init: initUtangs, forPerson, outstandingForPerson } = useUtangs()
const { init: initPayments, forPerson: paymentsForPerson } = usePayments()
const { init: initProducts } = useProducts()
const { formatCurrency, getOutstandingBalance, formatDateTime, formatDate, calculateAccruedInterest, getDueStatus, groupByDateLabel } = useUtangCalc()
const { open: openLightbox } = useLightbox()
const { exportPersonUtangPdf } = usePdfExport()
const toast = useToast()
const { load, save, clear } = useDraftStorage()

onMounted(() => {
  initPeople()
  initUtangs()
  initPayments()
  initProducts()
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/people')
}

const person = getPerson(personId)
const personUtangs = forPerson(personId)
const personPayments = paymentsForPerson(personId)
const outstandingTotal = outstandingForPerson(personId)

const hasContactInfo = computed(() => !!(person.value?.phoneNumber || person.value?.gcashName || person.value?.gcashNumber || person.value?.address))

function interestAmount(u: Utang) {
  return calculateAccruedInterest(u)
}
function dueDateClass(u: Utang) {
  const status = getDueStatus(u)
  if (status === 'overdue') return 'text-rose-600 dark:text-rose-400'
  if (status === 'approaching') return 'text-amber-600 dark:text-amber-400'
  return 'text-slate-400 dark:text-slate-500'
}

const filterType = ref('')
const utangSearch = ref('')
const sortBy = ref<'new' | 'old' | 'amount-high' | 'amount-low'>('new')
const sortOptions = [
  { value: 'new', label: 'Newest first', icon: Clock },
  { value: 'old', label: 'Oldest first', icon: Clock },
  { value: 'amount-high', label: 'Amount: high to low', icon: ArrowDownWideNarrow },
  { value: 'amount-low', label: 'Amount: low to high', icon: ArrowUpWideNarrow }
]

const filteredUtangs = computed(() => {
  let list = personUtangs.value
  if (filterType.value) list = list.filter((u) => u.type === filterType.value)
  const q = utangSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter((u) => {
      const inNote = (u.note || '').toLowerCase().includes(q)
      const inType = u.type.toLowerCase().includes(q)
      const inItems = (u.items || []).some((i) => i.productName.toLowerCase().includes(q))
      return inNote || inType || inItems
    })
  }
  const sorted = [...list]
  sorted.sort((a, b) => {
    switch (sortBy.value) {
      case 'new':
        return b.createdAt - a.createdAt
      case 'old':
        return a.createdAt - b.createdAt
      case 'amount-high':
        return getOutstandingBalance(b) - getOutstandingBalance(a)
      case 'amount-low':
        return getOutstandingBalance(a) - getOutstandingBalance(b)
      default:
        return 0
    }
  })
  return sorted
})

// Date section headers ("Today", "Yesterday"...) only make sense when sorted by date;
// sorting by amount instead renders as one flat, unlabeled group.
const groupedUtangs = computed(() => {
  if (sortBy.value === 'new' || sortBy.value === 'old') {
    return groupByDateLabel(filteredUtangs.value, (u) => u.createdAt)
  }
  return filteredUtangs.value.length ? [{ label: '', items: filteredUtangs.value }] : []
})

const paymentSortBy = ref<'new' | 'old'>('new')
const paymentSortOptions = [
  { value: 'new', label: 'Newest first', icon: Clock },
  { value: 'old', label: 'Oldest first', icon: Clock }
]
const sortedPersonPayments = computed(() => {
  const sorted = [...personPayments.value]
  sorted.sort((a, b) => (paymentSortBy.value === 'new' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))
  return sorted
})
const groupedPayments = computed(() => groupByDateLabel(sortedPersonPayments.value, (p) => p.createdAt))

function statusClass(status: string) {
  if (status === 'paid') return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  if (status === 'partial') return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
}

// Add utang
const showAddUtang = ref(false)

// Share via QR
const showShareModal = ref(false)

// PDF export
const exportingPdf = ref(false)
async function downloadPdf() {
  if (!person.value) return
  exportingPdf.value = true
  try {
    await exportPersonUtangPdf(person.value, personUtangs.value, personPayments.value)
  } catch {
    toast.error('Could not generate PDF')
  } finally {
    exportingPdf.value = false
  }
}

// Edit person
const showEditPerson = ref(false)
const savingPerson = ref(false)
const editForm = reactive({ fullName: '', photoUrl: '', phoneNumber: '', gcashName: '', gcashNumber: '', address: '' })
const editDraftKey = `person-edit:${personId}`

let stopEditDraftWatch: (() => void) | null = null
function openEditPerson() {
  if (!person.value) return
  // Start from the saved record, then layer any unsaved draft on top so an
  // accidentally-closed edit doesn't lose what was typed.
  Object.assign(editForm, {
    fullName: person.value.fullName,
    photoUrl: person.value.photoUrl || '',
    phoneNumber: person.value.phoneNumber || '',
    gcashName: person.value.gcashName || '',
    gcashNumber: person.value.gcashNumber || '',
    address: person.value.address || ''
  })
  const draft = load<typeof editForm>(editDraftKey)
  if (draft) Object.assign(editForm, draft)
  if (!stopEditDraftWatch) {
    stopEditDraftWatch = watch(editForm, (val) => save(editDraftKey, val), { deep: true })
  }
  showEditPerson.value = true
}
async function submitEditPerson() {
  savingPerson.value = true
  try {
    await updatePerson(personId, { ...editForm })
    toast.success('Customer updated')
    clear(editDraftKey)
    showEditPerson.value = false
  } catch {
    toast.error('Could not save changes')
  } finally {
    savingPerson.value = false
  }
}

// Delete person
const confirmDeletePerson = ref(false)
async function doDeletePerson() {
  await softDeletePerson(personId)
  toast.success('Customer deleted')
  router.push('/people')
}
</script>
