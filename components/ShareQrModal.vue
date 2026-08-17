<template>
  <Modal :model-value="modelValue" title="Share access" @update:model-value="$emit('update:modelValue', $event)">
    <div v-if="person" class="space-y-4">
      <div class="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
        <Lock :size="16" class="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Anyone with this link or QR code can view a read-only summary of <strong>{{ person.fullName }}'s</strong> own
          utang history — nothing about anyone else. Access automatically expires 24 hours after you turn it on, or
          you can turn it off anytime to revoke it instantly.
        </p>
      </div>

      <div class="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3">
        <div class="min-w-0">
          <p class="text-sm font-medium dark:text-slate-100">Sharing</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 truncate">{{ localShareEnabled ? expiresLabel || 'Anyone with the link can view' : 'Access is off' }}</p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="localShareEnabled"
          @click="toggleSharing"
          :disabled="toggling"
          class="shrink-0 w-12 h-7 rounded-full relative transition-colors disabled:opacity-50"
          :class="localShareEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'"
          :aria-label="localShareEnabled ? 'Turn off sharing' : 'Turn on sharing'"
        >
          <span
            class="absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-150"
            :class="localShareEnabled ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>

      <div v-if="localShareEnabled" class="space-y-3">
        <div class="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR code" class="w-44 h-44" />
          <div v-else class="w-44 h-44 flex items-center justify-center text-slate-300">
            <QrCode :size="32" />
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">Customer scans this to see their own utang history</p>
        </div>

        <div class="flex items-center gap-2">
          <input :value="shareUrl" readonly class="flex-1 min-w-0 text-xs rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 px-3 py-2 truncate" @focus="($event.target as HTMLInputElement).select()" />
          <button type="button" @click="copyLink" class="shrink-0 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold px-3 py-2 flex items-center gap-1">
            <Copy :size="13" /> {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
      </div>

      <div v-else-if="wasSharedBefore" class="text-xs text-slate-400 dark:text-slate-500 text-center">
        The previous link has expired or was turned off. Turn sharing back on to generate a fresh one.
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { Lock, QrCode, Copy } from 'lucide-vue-next'
import QRCode from 'qrcode'
import type { Person } from '~/types'

const DAY_MS = 24 * 60 * 60 * 1000

const props = defineProps<{ modelValue: boolean; person: Person | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const { updatePerson } = usePeople()
const toast = useToast()

const toggling = ref(false)
const copied = ref(false)
const qrDataUrl = ref('')

// Ticks every 30s so the expiry countdown and the on/off state both stay
// accurate while the modal is left open.
const nowTick = ref(Date.now())
let tickInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  tickInterval = setInterval(() => {
    nowTick.value = Date.now()
  }, 30000)
})
onBeforeUnmount(() => {
  if (tickInterval) clearInterval(tickInterval)
})

const expiresAt = computed(() => (props.person?.shareEnabledAt ? props.person.shareEnabledAt + DAY_MS : null))
const isExpired = computed(() => !!expiresAt.value && nowTick.value >= expiresAt.value)
// The "true" access state factoring in expiry — this is what actually governs
// whether the customer's link works, per the Firestore rules. A person shared
// under the old (pre-expiry) version of this feature has shareEnabled=true but
// no shareEnabledAt, which the rules now treat as not shared — mirror that here
// so the toggle never shows "on" for a link that's actually been denied.
const actuallyShared = computed(() => !!props.person?.shareEnabled && !!props.person?.shareEnabledAt && !isExpired.value)
const wasSharedBefore = computed(() => !!props.person?.shareEnabledAt)

// Local, optimistic copy of the toggle state. The real Firestore write + the
// listener round-trip can take a moment; without this the toggle appears to
// do nothing for a beat, which invites a second tap that flips it right back.
const localShareEnabled = ref(false)
watch(actuallyShared, (v) => (localShareEnabled.value = v), { immediate: true })

const expiresLabel = computed(() => {
  if (!localShareEnabled.value || !expiresAt.value) return ''
  const msLeft = expiresAt.value - nowTick.value
  if (msLeft <= 0) return 'Expiring…'
  const hours = Math.floor(msLeft / 3600000)
  const mins = Math.floor((msLeft % 3600000) / 60000)
  return hours >= 1 ? `Expires in ${hours}h ${mins}m` : `Expires in ${mins}m`
})

const shareUrl = computed(() => {
  if (!props.person || !import.meta.client) return ''
  return `${window.location.origin}/share/${props.person.id}`
})

async function generateQr() {
  if (!localShareEnabled.value || !shareUrl.value) {
    qrDataUrl.value = ''
    return
  }
  try {
    qrDataUrl.value = await QRCode.toDataURL(shareUrl.value, { width: 320, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
  } catch {
    qrDataUrl.value = ''
  }
}

watch(
  [() => props.modelValue, localShareEnabled],
  ([open]) => {
    if (open) generateQr()
  },
  { immediate: true }
)

async function toggleSharing() {
  if (!props.person || toggling.value) return
  const next = !localShareEnabled.value
  localShareEnabled.value = next // optimistic
  toggling.value = true
  try {
    if (next) {
      // Re-enabling (including after expiry) always issues a fresh 24h window.
      await updatePerson(props.person.id, { shareEnabled: true, shareEnabledAt: Date.now() })
      toast.success('Sharing enabled — valid for 24 hours')
    } else {
      await updatePerson(props.person.id, { shareEnabled: false })
      toast.success('Sharing turned off')
    }
  } catch {
    localShareEnabled.value = !next // revert on failure
    toast.error('Could not update sharing')
  } finally {
    toggling.value = false
  }
}

async function copyLink() {
  if (!shareUrl.value) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl.value)
    } else {
      copyViaFallback(shareUrl.value)
    }
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Clipboard API can still throw in some in-app browsers/webviews even when present —
    // fall back to the classic select+execCommand approach before giving up.
    try {
      copyViaFallback(shareUrl.value)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    } catch {
      toast.error('Could not copy — press and hold the link above to copy it manually')
    }
  }
}

function copyViaFallback(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!ok) throw new Error('execCommand copy failed')
}
</script>
