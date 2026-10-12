<template>
  <Modal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit Utang' : personId ? 'Add Utang' : 'Quick Add Utang'"
    :no-body-scroll="true"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Customer picker, only shown in quick-add mode (no fixed personId prop, not editing) -->
    <div v-if="!personId && !isEditMode" class="shrink-0 mb-3">
      <div v-if="!selectedPersonId">
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Customer *</label>
        <input
          v-model="personSearch"
          placeholder="Search customers…"
          class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500"
        />
        <div v-if="personSearch" class="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          <button
            v-for="p in matchingPeople"
            :key="p.id"
            type="button"
            @click="choosePerson(p.id)"
            class="w-full text-left px-3 py-2 text-sm active:bg-slate-50 dark:active:bg-slate-700 dark:text-slate-100"
          >
            {{ p.fullName }}
          </button>
          <p v-if="matchingPeople.length === 0" class="px-3 py-2 text-sm text-slate-400">No matches.</p>
        </div>
      </div>
      <!-- Collapsed to a single compact row once picked, so the product list below keeps its space -->
      <div v-else class="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-3 py-2">
        <span class="text-sm font-medium text-emerald-800 dark:text-emerald-300">{{ selectedPersonName }}</span>
        <button type="button" @click="clearPerson" class="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Change</button>
      </div>
    </div>

    <div v-if="resolvedPersonId" class="flex-1 min-h-0 flex flex-col">
      <div class="flex gap-2 mb-3 shrink-0">
        <button
          v-for="t in types"
          :key="t.value"
          @click="type = t.value"
          class="flex-1 rounded-xl py-2 text-sm font-semibold border"
          :class="type === t.value ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'"
        >
          {{ t.label }}
        </button>
      </div>

      <div class="shrink-0 mb-3 grid grid-cols-2 gap-3">
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Date of utang</label>
          <input
            v-model="utangDate"
            type="date"
            :max="todayInputValue"
            class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Due date <span class="text-slate-400 font-normal">(optional)</span></label>
          <input
            v-model="dueDate"
            type="date"
            class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      <p class="shrink-0 -mt-2 mb-3 text-[11px] text-slate-400 dark:text-slate-500">
        Defaults to today — backdate it to log an old utang.
      </p>

      <!-- Tinda -->
      <form v-if="type === 'tinda'" @submit.prevent="submitTinda" class="flex-1 min-h-0 flex flex-col">
        <div class="shrink-0 space-y-2 mb-2">
          <div class="flex gap-2">
            <input
              v-model="productSearch"
              placeholder="Search products…"
              class="flex-1 min-w-0 text-sm rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              @click="showInlineAddProduct = !showInlineAddProduct"
              class="shrink-0 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm font-medium px-3"
            >
              {{ showInlineAddProduct ? 'Cancel' : '+ New' }}
            </button>
          </div>

          <div v-if="showInlineAddProduct" class="border border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl p-3 space-y-2 bg-emerald-50/50 dark:bg-emerald-900/10">
            <ImageUploader v-model="newProduct.imageUrl" :round="false" :size="56" :max-dimension="480" :target-k-b="45" />
            <input v-model="newProduct.name" placeholder="Product name" class="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
            <CurrencyInput v-model="newProduct.price" placeholder="Price (₱)" class="w-full rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
            <button
              type="button"
              @click="saveInlineProduct"
              :disabled="savingProduct || !newProduct.name || !newProduct.price"
              class="w-full rounded-lg bg-emerald-600 text-white text-sm font-semibold py-2 disabled:opacity-50"
            >
              {{ savingProduct ? 'Adding…' : 'Add product' }}
            </button>
          </div>
        </div>

        <div v-if="sortedFilteredProducts.length === 0" class="text-sm text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center shrink-0">
          {{ activeProducts.length === 0 ? 'No products yet — add one above.' : 'No products match your search.' }}
        </div>
        <!-- Fills the remaining modal height instead of a fixed cap, so more rows show on taller screens.
             min-h-0 (not a fixed min) lets it shrink so the pinned footer/date fields never get clipped. -->
        <div v-else class="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2">
          <div v-for="p in sortedFilteredProducts" :key="p.id" class="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
            <div class="min-w-0">
              <p class="text-sm font-medium truncate dark:text-slate-100">{{ p.name }}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ formatCurrency(p.price) }} each</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="toggleProductFavorite(p.id)"
                class="w-7 h-7 flex items-center justify-center rounded-full"
                :class="p.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'"
                :aria-label="p.isFavorite ? 'Remove from favorites' : 'Mark as favorite'"
              >
                <Star :size="16" :fill="p.isFavorite ? 'currentColor' : 'none'" />
              </button>
              <button type="button" @click="decrement(p.id)" class="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center"><Minus :size="14" /></button>
              <span class="w-5 text-center text-sm dark:text-slate-100">{{ qty[p.id] || 0 }}</span>
              <button type="button" @click="increment(p.id)" class="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center"><Plus :size="14" /></button>
            </div>
          </div>
        </div>

        <div class="shrink-0 space-y-3 mt-3">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
            <input v-model="tindaNote" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          </div>
          <div class="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-4 py-3">
            <span class="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total</span>
            <span class="font-bold text-emerald-800 dark:text-emerald-300">{{ formatCurrency(tindaTotal) }}</span>
          </div>
          <div class="flex gap-2">
            <button type="submit" :disabled="saving || tindaTotal <= 0" class="flex-1 rounded-xl bg-emerald-600 text-white font-semibold py-3 active:opacity-80 disabled:opacity-50">
              {{ saving ? 'Saving…' : isEditMode ? 'Save changes' : 'Save utang' }}
            </button>
            <button v-if="!isEditMode" type="button" @click="finishAdding" class="shrink-0 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 font-semibold px-5 py-3 active:bg-slate-50 dark:active:bg-slate-700">
              Done
            </button>
          </div>
        </div>
      </form>

      <!-- Cash -->
      <form v-else-if="type === 'cash'" @submit.prevent="submitCash" class="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₱) *</label>
          <CurrencyInput v-model="cash.amount" required class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div class="flex items-center gap-2">
          <input id="hasInterestCash" v-model="cash.hasInterest" type="checkbox" class="w-4 h-4" />
          <label for="hasInterestCash" class="text-sm font-medium text-slate-700 dark:text-slate-300">Add interest</label>
        </div>
        <div v-if="cash.hasInterest" class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
            <select v-model="cash.interestType" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ cash.interestType === 'percentage' ? 'Rate (%)' : 'Amount (₱)' }}</label>
            <input v-model.number="cash.interestValue" type="number" min="0" step="0.01" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          </div>
          <div class="col-span-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Frequency</label>
            <select v-model="cash.interestFrequency" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500">
              <option value="day">Per day</option>
              <option value="week">Per week</option>
              <option value="month">Per month</option>
              <option value="once">One-time (fixed)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
          <input v-model="cash.note" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div class="flex gap-2">
          <button type="submit" :disabled="saving || !cash.amount" class="flex-1 rounded-xl bg-emerald-600 text-white font-semibold py-3 active:opacity-80 disabled:opacity-50">
            {{ saving ? 'Saving…' : isEditMode ? 'Save changes' : 'Save utang' }}
          </button>
          <button v-if="!isEditMode" type="button" @click="finishAdding" class="shrink-0 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 font-semibold px-5 py-3 active:bg-slate-50 dark:active:bg-slate-700">
            Done
          </button>
        </div>
      </form>

      <!-- GCash -->
      <form v-else @submit.prevent="submitGcash" class="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₱) *</label>
          <CurrencyInput v-model="gcash.amount" required class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">GCash number</label>
          <input v-model="gcash.gcashNumber" placeholder="09xx xxx xxxx" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Auto-filled from this person's profile — edit if needed.</p>
        </div>
        <div class="flex items-center gap-2">
          <input id="hasInterestGcash" v-model="gcash.hasInterest" type="checkbox" class="w-4 h-4" />
          <label for="hasInterestGcash" class="text-sm font-medium text-slate-700 dark:text-slate-300">Add interest</label>
        </div>
        <div v-if="gcash.hasInterest" class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
            <select v-model="gcash.interestType" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ gcash.interestType === 'percentage' ? 'Rate (%)' : 'Amount (₱)' }}</label>
            <input v-model.number="gcash.interestValue" type="number" min="0" step="0.01" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          </div>
          <div class="col-span-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Frequency</label>
            <select v-model="gcash.interestFrequency" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500">
              <option value="day">Per day</option>
              <option value="week">Per week</option>
              <option value="month">Per month</option>
              <option value="once">One-time (fixed)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Note</label>
          <input v-model="gcash.note" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div class="flex gap-2">
          <button type="submit" :disabled="saving || !gcash.amount" class="flex-1 rounded-xl bg-emerald-600 text-white font-semibold py-3 active:opacity-80 disabled:opacity-50">
            {{ saving ? 'Saving…' : isEditMode ? 'Save changes' : 'Save utang' }}
          </button>
          <button v-if="!isEditMode" type="button" @click="finishAdding" class="shrink-0 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 font-semibold px-5 py-3 active:bg-slate-50 dark:active:bg-slate-700">
            Done
          </button>
        </div>
      </form>
    </div>
  </Modal>

  <ConfirmDialog
    v-model="showConfirmEdit"
    title="Save changes?"
    message="This will update the existing utang record for this customer, including its amount and history."
    confirm-label="Save changes"
    @confirm="confirmEditSave"
  />
</template>

<script setup lang="ts">
import { Star, Minus, Plus } from 'lucide-vue-next'
import type { Utang, UtangType, TindaLineItem } from '~/types'

const props = defineProps<{ modelValue: boolean; personId?: string; editUtang?: Utang | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [] }>()

const { activeProducts, init: initProducts, addProduct, toggleFavorite: toggleProductFavorite } = useProducts()
const { activePeople, init: initPeople } = usePeople()
const { addUtang, updateUtangFull } = useUtangs()
const { formatCurrency } = useUtangCalc()
const toast = useToast()
const { clear: clearDraft } = useDraftStorage()

onMounted(() => {
  initProducts()
  initPeople()
})

const isEditMode = computed(() => !!props.editUtang)

const types: { value: UtangType; label: string }[] = [
  { value: 'tinda', label: 'Tinda' },
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' }
]
const saving = ref(false)

// Person picker (quick-add mode only)
const personSearch = ref('')
const selectedPersonId = ref('')
const matchingPeople = computed(() =>
  activePeople.value.filter((p) => p.fullName.toLowerCase().includes(personSearch.value.toLowerCase()))
)
const selectedPersonName = computed(() => activePeople.value.find((p) => p.id === selectedPersonId.value)?.fullName || '')
function choosePerson(id: string) {
  selectedPersonId.value = id
  const person = activePeople.value.find((p) => p.id === id)
  personSearch.value = person?.fullName || ''
}
function clearPerson() {
  selectedPersonId.value = ''
  personSearch.value = ''
}
const resolvedPersonId = computed(() => props.editUtang?.personId || props.personId || selectedPersonId.value)

// Date of utang + due date (shared across all utang types)
function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const todayInputValue = toDateInputValue(new Date())
const utangDate = ref(todayInputValue)
const dueDate = ref('')

// Product search + inline quick-add. Favorites always float to the top.
const productSearch = ref('')
const filteredProducts = computed(() =>
  activeProducts.value.filter((p) => p.name.toLowerCase().includes(productSearch.value.toLowerCase()))
)
const sortedFilteredProducts = computed(() => {
  const arr = [...filteredProducts.value]
  arr.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
  return arr
})
const showInlineAddProduct = ref(false)
const savingProduct = ref(false)
const newProduct = reactive({ name: '', price: undefined as number | undefined, imageUrl: '' })
async function saveInlineProduct() {
  if (!newProduct.name || !newProduct.price) return
  savingProduct.value = true
  try {
    await addProduct({ name: newProduct.name, price: newProduct.price, imageUrl: newProduct.imageUrl })
    toast.success('Product added')
    Object.assign(newProduct, { name: '', price: undefined, imageUrl: '' })
    showInlineAddProduct.value = false
    productSearch.value = ''
  } catch {
    toast.error('Could not add product')
  } finally {
    savingProduct.value = false
  }
}

// Draft (persists typed-but-unsaved input across accidental closes) — not used while editing
const draftKey = computed(() => (props.personId ? `utang-add:${props.personId}` : 'utang-quick-add'))

const type = ref<UtangType>('tinda')
const qty = reactive<Record<string, number>>({})
const tindaNote = ref('')
const cash = reactive({
  amount: undefined as number | undefined,
  hasInterest: false,
  interestType: 'percentage' as 'percentage' | 'fixed',
  interestValue: 0,
  interestFrequency: 'month' as 'day' | 'week' | 'month' | 'once',
  note: ''
})
const gcash = reactive({
  amount: undefined as number | undefined,
  gcashNumber: '',
  hasInterest: false,
  interestType: 'percentage' as 'percentage' | 'fixed',
  interestValue: 0,
  interestFrequency: 'month' as 'day' | 'week' | 'month' | 'once',
  note: ''
})

const draftState = reactive({
  type,
  utangDate,
  dueDate,
  qty,
  tindaNote,
  cash,
  gcash,
  selectedPersonId,
  personSearch
})

// Auto-fill the GCash number from the selected person's saved profile (still editable).
watch(
  [resolvedPersonId, type, () => activePeople.value.length],
  () => {
    if (!resolvedPersonId.value || gcash.gcashNumber) return
    const person = activePeople.value.find((p) => p.id === resolvedPersonId.value)
    if (person?.gcashNumber) gcash.gcashNumber = person.gcashNumber
  },
  { immediate: true }
)

let stopDraftWatch: (() => void) | null = null
function attachDraft() {
  if (stopDraftWatch) stopDraftWatch()
  stopDraftWatch = null
  const existing = useDraftStorage().load<any>(draftKey.value)
  if (existing) {
    type.value = existing.type ?? type.value
    utangDate.value = existing.utangDate ?? todayInputValue
    dueDate.value = existing.dueDate ?? ''
    Object.keys(qty).forEach((k) => delete qty[k])
    Object.assign(qty, existing.qty || {})
    tindaNote.value = existing.tindaNote ?? ''
    Object.assign(cash, existing.cash || {})
    Object.assign(gcash, existing.gcash || {})
    if (!props.personId) {
      selectedPersonId.value = existing.selectedPersonId ?? ''
      personSearch.value = existing.personSearch ?? ''
    }
  }
  const { save } = useDraftStorage()
  stopDraftWatch = watch(
    draftState,
    (val) => save(draftKey.value, val),
    { deep: true }
  )
}

// Pre-fills every field from the utang being edited. Type is left editable — "everything" is editable.
function loadFromUtang(u: Utang) {
  type.value = u.type
  utangDate.value = toDateInputValue(new Date(u.createdAt))
  dueDate.value = u.dueDate ? toDateInputValue(new Date(u.dueDate)) : ''
  Object.keys(qty).forEach((k) => delete qty[k])
  for (const item of u.items || []) {
    qty[item.productId] = item.quantity
  }
  tindaNote.value = u.type === 'tinda' ? u.note || '' : ''
  const hasInterest = !!(u.interestType && u.interestValue && u.interestFrequency)
  Object.assign(cash, {
    amount: u.type === 'cash' ? u.amount : undefined,
    hasInterest: u.type === 'cash' && hasInterest,
    interestType: u.interestType || 'percentage',
    interestValue: u.interestValue || 0,
    interestFrequency: u.interestFrequency || 'month',
    note: u.type === 'cash' ? u.note || '' : ''
  })
  Object.assign(gcash, {
    amount: u.type === 'gcash' ? u.amount : undefined,
    gcashNumber: u.gcashNumber || '',
    hasInterest: u.type === 'gcash' && hasInterest,
    interestType: u.interestType || 'percentage',
    interestValue: u.interestValue || 0,
    interestFrequency: u.interestFrequency || 'month',
    note: u.type === 'gcash' ? u.note || '' : ''
  })
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.editUtang) loadFromUtang(props.editUtang)
      else attachDraft()
    } else {
      if (stopDraftWatch) {
        stopDraftWatch()
        stopDraftWatch = null
      }
      productSearch.value = ''
      showInlineAddProduct.value = false
    }
  },
  { immediate: true }
)

function increment(id: string) {
  qty[id] = (qty[id] || 0) + 1
}
function decrement(id: string) {
  qty[id] = Math.max(0, (qty[id] || 0) - 1)
}
const tindaTotal = computed(() =>
  activeProducts.value.reduce((sum, p) => sum + (qty[p.id] || 0) * p.price, 0)
)

function utangDateTimestamp(): number {
  if (!utangDate.value) return Date.now()
  const now = new Date()
  const [y, m, d] = utangDate.value.split('-').map(Number)
  return new Date(y || now.getFullYear(), (m || 1) - 1, d || 1, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()).getTime()
}

function dueDateTimestamp(): number | undefined {
  if (!dueDate.value) return undefined
  const ts = new Date(`${dueDate.value}T00:00:00`).getTime()
  return Number.isNaN(ts) ? undefined : ts
}

// Edits require an explicit confirmation before writing to Firestore.
const showConfirmEdit = ref(false)
let pendingAction: (() => Promise<void>) | null = null
function requestSubmit(action: () => Promise<void>) {
  if (isEditMode.value) {
    pendingAction = action
    showConfirmEdit.value = true
  } else {
    action()
  }
}
async function confirmEditSave() {
  const action = pendingAction
  pendingAction = null
  if (action) await action()
}

async function submitTinda() {
  if (!resolvedPersonId.value) return
  const items: TindaLineItem[] = activeProducts.value
    .filter((p) => (qty[p.id] || 0) > 0)
    .map((p) => ({ productId: p.id, productName: p.name, unitPrice: p.price, quantity: qty[p.id] || 0 }))
  if (items.length === 0) return
  requestSubmit(() => saveTinda(items))
}

async function saveTinda(items: TindaLineItem[]) {
  saving.value = true
  try {
    if (isEditMode.value && props.editUtang) {
      await updateUtangFull(props.editUtang.id, {
        type: 'tinda',
        amount: tindaTotal.value,
        items,
        note: tindaNote.value,
        dueDate: dueDateTimestamp(),
        createdAt: utangDateTimestamp()
      })
      toast.success('Utang updated')
      finishEditing()
    } else {
      await addUtang({ personId: resolvedPersonId.value, type: 'tinda', amount: tindaTotal.value, items, note: tindaNote.value, dueDate: dueDateTimestamp(), createdAt: utangDateTimestamp() })
      toast.success('Utang added')
      resetEntryFields('tinda')
    }
  } catch {
    toast.error(isEditMode.value ? 'Could not update utang' : 'Could not save utang')
  } finally {
    saving.value = false
  }
}

async function submitCash() {
  if (!resolvedPersonId.value || !cash.amount) return
  requestSubmit(saveCash)
}

async function saveCash() {
  saving.value = true
  try {
    const interestFields = cash.hasInterest
      ? { interestType: cash.interestType, interestValue: cash.interestValue, interestFrequency: cash.interestFrequency }
      : {}
    if (isEditMode.value && props.editUtang) {
      await updateUtangFull(props.editUtang.id, {
        type: 'cash',
        amount: cash.amount as number,
        note: cash.note,
        dueDate: dueDateTimestamp(),
        createdAt: utangDateTimestamp(),
        ...interestFields
      })
      toast.success('Utang updated')
      finishEditing()
    } else {
      await addUtang({
        personId: resolvedPersonId.value,
        type: 'cash',
        amount: cash.amount as number,
        note: cash.note,
        dueDate: dueDateTimestamp(),
        createdAt: utangDateTimestamp(),
        ...interestFields
      })
      toast.success('Utang added')
      resetEntryFields('cash')
    }
  } catch {
    toast.error(isEditMode.value ? 'Could not update utang' : 'Could not save utang')
  } finally {
    saving.value = false
  }
}

async function submitGcash() {
  if (!resolvedPersonId.value || !gcash.amount) return
  requestSubmit(saveGcash)
}

async function saveGcash() {
  saving.value = true
  try {
    const interestFields = gcash.hasInterest
      ? { interestType: gcash.interestType, interestValue: gcash.interestValue, interestFrequency: gcash.interestFrequency }
      : {}
    if (isEditMode.value && props.editUtang) {
      await updateUtangFull(props.editUtang.id, {
        type: 'gcash',
        amount: gcash.amount as number,
        gcashNumber: gcash.gcashNumber,
        note: gcash.note,
        dueDate: dueDateTimestamp(),
        createdAt: utangDateTimestamp(),
        ...interestFields
      })
      toast.success('Utang updated')
      finishEditing()
    } else {
      await addUtang({
        personId: resolvedPersonId.value,
        type: 'gcash',
        amount: gcash.amount as number,
        gcashNumber: gcash.gcashNumber,
        note: gcash.note,
        dueDate: dueDateTimestamp(),
        createdAt: utangDateTimestamp(),
        ...interestFields
      })
      toast.success('Utang added')
      resetEntryFields('gcash')
    }
  } catch {
    toast.error(isEditMode.value ? 'Could not update utang' : 'Could not save utang')
  } finally {
    saving.value = false
  }
}

// Clears only the fields for the type just saved — person, date, and due date are kept so the
// same customer/date can keep receiving new entries without the modal closing in between.
function resetEntryFields(t: UtangType) {
  if (t === 'tinda') {
    Object.keys(qty).forEach((k) => delete qty[k])
    tindaNote.value = ''
    productSearch.value = ''
    showInlineAddProduct.value = false
  } else if (t === 'cash') {
    Object.assign(cash, { amount: undefined, hasInterest: false, interestType: 'percentage', interestValue: 0, interestFrequency: 'month', note: '' })
  } else {
    Object.assign(gcash, { amount: undefined, hasInterest: false, interestType: 'percentage', interestValue: 0, interestFrequency: 'month', note: '' })
  }
}

// "Done" button in add mode — fully resets and closes.
function finishAdding() {
  clearDraft(draftKey.value)
  utangDate.value = todayInputValue
  dueDate.value = ''
  resetEntryFields('tinda')
  resetEntryFields('cash')
  resetEntryFields('gcash')
  gcash.gcashNumber = ''
  selectedPersonId.value = ''
  personSearch.value = ''
  emit('saved')
  emit('update:modelValue', false)
}

// After a successful edit, just close — editing is a one-off action, not a batch-add flow.
function finishEditing() {
  emit('saved')
  emit('update:modelValue', false)
}
</script>