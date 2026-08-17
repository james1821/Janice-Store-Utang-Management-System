<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl lg:text-3xl font-bold dark:text-slate-100">Customers</h1>
        <p class="hidden lg:block text-slate-500 dark:text-slate-400 mt-1 text-sm">{{ sorted.length }} {{ sorted.length === 1 ? 'customer' : 'customers' }} on record</p>
      </div>
      <button @click="openAdd" class="text-sm lg:text-base font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 lg:bg-emerald-600 lg:text-white lg:px-4 lg:py-2.5 lg:rounded-xl lg:hover:opacity-90">
        <Plus :size="16" /> Add customer
      </button>
    </div>

    <div class="sticky top-14 lg:top-0 z-30 -mx-4 px-4 lg:mx-0 lg:px-0 py-2 bg-slate-50 dark:bg-slate-900 flex gap-2">
      <input
        v-model="search"
        type="text"
        placeholder="Search customers…"
        class="flex-1 min-w-0 lg:max-w-xs rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
      />
      <SortToggle v-model="sortBy" :options="sortOptions" />
    </div>

    <div v-if="sorted.length === 0" class="text-sm text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
      No customers found.
    </div>

    <template v-else>
      <!-- Mobile / tablet: card list -->
      <div class="space-y-2 lg:hidden">
        <div
          v-for="p in sorted"
          :key="p.id"
          class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5"
        >
          <NuxtLink :to="`/people/${p.id}`" class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"
              :class="p.photoUrl ? 'cursor-zoom-in' : ''"
              @click.prevent.stop="p.photoUrl && openLightbox(p.photoUrl, p.fullName)"
            >
              <img v-if="p.photoUrl" :src="p.photoUrl" class="w-full h-full object-cover" alt="" />
              <User v-else :size="16" class="text-slate-400 dark:text-slate-500" />
            </div>
            <p class="font-medium text-sm truncate dark:text-slate-100">{{ p.fullName }}</p>
          </NuxtLink>
          <div class="flex items-center gap-2 shrink-0 ml-2">
            <div class="text-right">
              <p class="font-semibold text-sm" :class="outstandingForPerson(p.id).value > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
                {{ formatCurrency(outstandingForPerson(p.id).value) }}
              </p>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ outstandingForPerson(p.id).value > 0 ? 'owes' : 'fully paid' }}</p>
            </div>
            <button
              type="button"
              @click="toggleFavorite(p.id)"
              class="w-7 h-7 flex items-center justify-center rounded-full"
              :class="p.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'"
              :aria-label="p.isFavorite ? 'Remove from favorites' : 'Mark as favorite'"
            >
              <Star :size="18" :fill="p.isFavorite ? 'currentColor' : 'none'" />
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop: data table -->
      <div class="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <th class="px-5 py-3 font-semibold w-10"></th>
              <th class="px-2 py-3 font-semibold">Customer</th>
              <th class="px-4 py-3 font-semibold">Phone</th>
              <th class="px-4 py-3 font-semibold text-right">Balance</th>
              <th class="px-4 py-3 font-semibold text-right">Status</th>
              <th class="px-5 py-3 font-semibold w-12 text-right">★</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr
              v-for="p in sorted"
              :key="p.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
              @click="$router.push(`/people/${p.id}`)"
            >
              <td class="pl-5 py-2.5">
                <div
                  class="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                  :class="p.photoUrl ? 'cursor-zoom-in' : ''"
                  @click.stop="p.photoUrl && openLightbox(p.photoUrl, p.fullName)"
                >
                  <img v-if="p.photoUrl" :src="p.photoUrl" class="w-full h-full object-cover" alt="" />
                  <User v-else :size="16" class="text-slate-400 dark:text-slate-500" />
                </div>
              </td>
              <td class="px-2 py-2.5 font-medium dark:text-slate-100">{{ p.fullName }}</td>
              <td class="px-4 py-2.5 text-slate-500 dark:text-slate-400">{{ p.phoneNumber || '—' }}</td>
              <td class="px-4 py-2.5 text-right font-semibold" :class="outstandingForPerson(p.id).value > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
                {{ formatCurrency(outstandingForPerson(p.id).value) }}
              </td>
              <td class="px-4 py-2.5 text-right">
                <span
                  class="text-[11px] uppercase font-semibold px-2 py-1 rounded-full"
                  :class="outstandingForPerson(p.id).value > 0 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'"
                >{{ outstandingForPerson(p.id).value > 0 ? 'Owes' : 'Paid' }}</span>
              </td>
              <td class="pr-5 py-2.5 text-right">
                <button
                  type="button"
                  @click.stop="toggleFavorite(p.id)"
                  class="w-7 h-7 inline-flex items-center justify-center rounded-full"
                  :class="p.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'"
                  :aria-label="p.isFavorite ? 'Remove from favorites' : 'Mark as favorite'"
                >
                  <Star :size="16" :fill="p.isFavorite ? 'currentColor' : 'none'" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <Modal v-model="showAdd" title="Add Customer">
      <form @submit.prevent="submitAdd" class="space-y-4 lg:max-w-lg">
        <ImageUploader v-model="form.photoUrl" :max-dimension="320" :target-k-b="35" />
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Full name *</label>
          <input v-model="form.fullName" required class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Phone number <span class="text-slate-400 font-normal">(optional)</span></label>
          <input v-model="form.phoneNumber" placeholder="09xx xxx xxxx" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">GCash name <span class="text-slate-400 font-normal">(optional)</span></label>
            <input v-model="form.gcashName" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">GCash number <span class="text-slate-400 font-normal">(optional)</span></label>
            <input v-model="form.gcashNumber" placeholder="09xx xxx xxxx" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Address <span class="text-slate-400 font-normal">(optional)</span></label>
          <input v-model="form.address" class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 px-4 py-2.5 outline-none focus:border-emerald-500" />
        </div>
        <button type="submit" :disabled="saving" class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 mt-2 active:opacity-80 disabled:opacity-50">
          {{ saving ? 'Saving…' : 'Save customer' }}
        </button>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { Plus, User, ArrowDownAZ, ArrowUpAZ, Clock } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { activePeople, init, addPerson, toggleFavorite } = usePeople()
const { init: initUtangs, outstandingForPerson } = useUtangs()
const { formatCurrency } = useUtangCalc()
const { open: openLightbox } = useLightbox()
const toast = useToast()
const { bindDraft, clear: clearDraft } = useDraftStorage()

onMounted(() => {
  init()
  initUtangs()
  if (route.query.new === '1') {
    showAdd.value = true
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
  activePeople.value.filter((p) => p.fullName.toLowerCase().includes(search.value.toLowerCase()))
)

// Favorites always float to the top; the chosen sort applies within each group.
const sorted = computed(() => {
  const arr = [...filtered.value]
  arr.sort((a, b) => {
    if (!!b.isFavorite !== !!a.isFavorite) return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
    switch (sortBy.value) {
      case 'name-asc':
        return a.fullName.localeCompare(b.fullName)
      case 'name-desc':
        return b.fullName.localeCompare(a.fullName)
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

const showAdd = ref(false)
const saving = ref(false)
const form = reactive({ fullName: '', photoUrl: '', phoneNumber: '', gcashName: '', gcashNumber: '', address: '' })

// Restore any draft left over from an accidentally-closed "Add Person" modal.
bindDraft('person-add', form)

function openAdd() {
  // Intentionally does not reset the form — preserves a draft left from an
  // accidentally closed modal so nothing already typed is lost.
  showAdd.value = true
}

async function submitAdd() {
  saving.value = true
  try {
    await addPerson({ ...form })
    toast.success('Customer added')
    clearDraft('person-add')
    Object.assign(form, { fullName: '', photoUrl: '', phoneNumber: '', gcashName: '', gcashNumber: '', address: '' })
    showAdd.value = false
  } catch {
    toast.error('Could not save customer')
  } finally {
    saving.value = false
  }
}
</script>
