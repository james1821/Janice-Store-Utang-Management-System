<template>
  <div class="space-y-4 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
    <div class="flex items-center justify-between shrink-0">
      <div>
        <h1 class="text-xl lg:text-3xl font-bold dark:text-slate-100">Products</h1>
        <p class="hidden lg:block text-slate-500 dark:text-slate-400 mt-1 text-sm">{{ sorted.length }} {{ sorted.length === 1 ? 'product' : 'products' }} in your catalog</p>
      </div>
      <button @click="openAdd" class="text-sm lg:text-base font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 lg:bg-emerald-600 lg:text-white lg:px-4 lg:py-2.5 lg:rounded-xl lg:hover:opacity-90">
        <Plus :size="16" /> Add product
      </button>
    </div>

    <div class="sticky top-14 lg:static lg:top-auto z-30 -mx-4 px-4 lg:mx-0 lg:px-0 py-2 bg-slate-50 dark:bg-slate-900 flex gap-2 shrink-0">
      <input
        v-model="search"
        type="text"
        placeholder="Search products…"
        class="flex-1 min-w-0 lg:max-w-xs rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
      />
      <SortToggle v-model="sortBy" :options="sortOptions" />
    </div>

    <div v-if="sorted.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center shrink-0">
      No products found.
    </div>

    <template v-else>
      <!-- Mobile / tablet: card list -->
      <div class="space-y-2 lg:hidden">
        <div
          v-for="p in sorted"
          :key="p.id"
          class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
        >
          <button type="button" @click="openEdit(p)" class="flex items-center gap-3 min-w-0 flex-1 text-left">
            <div
              class="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"
              :class="p.imageUrl ? 'cursor-zoom-in' : ''"
              @click.stop="p.imageUrl && openLightbox(p.imageUrl, p.name)"
            >
              <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="w-full h-full object-cover" />
              <Package v-else :size="18" class="text-slate-400 dark:text-slate-500" />
            </div>
            <div class="min-w-0">
              <p class="font-medium text-sm truncate dark:text-slate-100">{{ p.name }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatCurrency(p.price) }}</p>
            </div>
          </button>
          <button
            type="button"
            @click="toggleFavorite(p.id)"
            class="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
            :class="p.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'"
            :aria-label="p.isFavorite ? 'Remove from favorites' : 'Mark as favorite'"
          >
            <Star :size="18" :fill="p.isFavorite ? 'currentColor' : 'none'" />
          </button>
        </div>
      </div>

      <!-- Desktop: catalog grid -->
      <div class="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:content-start lg:auto-rows-max lg:pr-1 lg:pb-4">
        <div
          v-for="p in sorted"
          :key="p.id"
          class="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition"
        >
          <button
            type="button"
            @click="toggleFavorite(p.id)"
            class="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur"
            :class="p.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'"
            :aria-label="p.isFavorite ? 'Remove from favorites' : 'Mark as favorite'"
          >
            <Star :size="16" :fill="p.isFavorite ? 'currentColor' : 'none'" />
          </button>
          <button type="button" @click="openEdit(p)" class="block w-full text-left">
            <div class="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
              <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="w-full h-full object-cover" />
              <Package v-else :size="28" class="text-slate-300 dark:text-slate-500" />
            </div>
            <div class="p-3.5">
              <p class="font-medium text-sm truncate dark:text-slate-100">{{ p.name }}</p>
              <p class="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{{ formatCurrency(p.price) }}</p>
            </div>
          </button>
        </div>
      </div>
    </template>

    <Modal v-model="showModal" :title="editingId ? 'Edit Product' : 'Add Product'">
      <form @submit.prevent="submit" class="space-y-4 lg:max-w-lg">
        <ImageUploader v-model="form.imageUrl" :round="false" :max-dimension="480" :target-k-b="45" />
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
          <input v-model="form.name" required class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Price (₱) *</label>
          <CurrencyInput v-model="form.price" required class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <button type="submit" :disabled="saving" class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 mt-2 active:opacity-80 disabled:opacity-50">
          {{ saving ? 'Saving…' : 'Save product' }}
        </button>
        <button
          v-if="editingId"
          type="button"
          @click="confirmDelete = true"
          class="w-full rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-semibold py-3 active:bg-rose-50 dark:active:bg-rose-900/30"
        >
          Delete product
        </button>
      </form>
    </Modal>

    <ConfirmDialog
      v-model="confirmDelete"
      title="Delete product?"
      message="This product will be hidden from new utang entries. Existing utang records are unaffected."
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { Plus, Package, Star, ArrowDownAZ, ArrowUpAZ, Clock } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { activeProducts, init, addProduct, updateProduct, softDeleteProduct, toggleFavorite } = useProducts()
const { formatCurrency } = useUtangCalc()
const { open: openLightbox } = useLightbox()
const toast = useToast()
const { load, save, clear } = useDraftStorage()

onMounted(() => {
  init()
  if (route.query.new === '1') {
    openAdd()
    router.replace({ query: {} })
  }
})

const search = ref('')
const sortBy = ref<'name-asc' | 'name-desc' | 'new' | 'old'>('name-asc')
const sortOptions = [
  { value: 'name-asc', label: 'Name (A–Z)', icon: ArrowDownAZ },
  { value: 'name-desc', label: 'Name (Z–A)', icon: ArrowUpAZ },
  { value: 'new', label: 'Newest first', icon: Clock },
  { value: 'old', label: 'Oldest first', icon: Clock }
]

const filtered = computed(() =>
  activeProducts.value.filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase()))
)

const sorted = computed(() => {
  const arr = [...filtered.value]
  arr.sort((a, b) => {
    if (!!b.isFavorite !== !!a.isFavorite) return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
    switch (sortBy.value) {
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'new':
        return b.createdAt - a.createdAt
      case 'old':
        return a.createdAt - b.createdAt
      default:
        return 0
    }
  })
  return arr
})

const showModal = ref(false)
const saving = ref(false)
const confirmDelete = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', price: 0 as number | undefined, imageUrl: '' })

let stopDraftWatch: (() => void) | null = null
function draftKey() {
  return editingId.value ? `product-edit:${editingId.value}` : 'product-add'
}
function attachDraftWatch() {
  if (stopDraftWatch) stopDraftWatch()
  const draft = load<typeof form>(draftKey())
  if (draft) Object.assign(form, draft)
  stopDraftWatch = watch(form, (val) => save(draftKey(), val), { deep: true })
}

function openAdd() {
  editingId.value = null
  Object.assign(form, { name: '', price: 0, imageUrl: '' })
  attachDraftWatch()
  showModal.value = true
}

function openEdit(p: { id: string; name: string; price: number; imageUrl?: string }) {
  editingId.value = p.id
  Object.assign(form, { name: p.name, price: p.price, imageUrl: p.imageUrl || '' })
  attachDraftWatch()
  showModal.value = true
}

async function submit() {
  saving.value = true
  try {
    if (editingId.value) {
      await updateProduct(editingId.value, { ...form, price: form.price ?? 0 })
      toast.success('Product updated')
    } else {
      await addProduct({ ...form, price: form.price ?? 0 })
      toast.success('Product added')
    }
    clear(draftKey())
    showModal.value = false
  } catch {
    toast.error('Could not save product')
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  if (!editingId.value) return
  await softDeleteProduct(editingId.value)
  toast.success('Product deleted')
  clear(draftKey())
  showModal.value = false
}
</script>
