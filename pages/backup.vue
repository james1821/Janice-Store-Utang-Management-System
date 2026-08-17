<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl lg:text-3xl font-bold dark:text-slate-100">Data Backup</h1>
      <p class="hidden lg:block text-slate-500 dark:text-slate-400 mt-1 text-sm">Export or restore your store's records.</p>
    </div>

    <div class="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:max-w-4xl">
      <div class="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 space-y-2 lg:flex lg:flex-col">
        <span class="hidden lg:flex w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 items-center justify-center mb-1">
          <Download :size="20" />
        </span>
        <h2 class="font-semibold text-sm lg:text-base dark:text-slate-100">Export backup</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 lg:flex-1">
          Download a full JSON copy of your customers, products, utang, and payment records.
        </p>
        <button @click="doExport" :disabled="exporting" class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 mt-2 active:opacity-80 lg:hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5">
          <Download :size="16" /> {{ exporting ? 'Preparing…' : 'Download backup (.json)' }}
        </button>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 space-y-2 lg:flex lg:flex-col">
        <span class="hidden lg:flex w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 items-center justify-center mb-1">
          <Upload :size="20" />
        </span>
        <h2 class="font-semibold text-sm lg:text-base dark:text-slate-100">Restore backup</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 lg:flex-1">
          Upload a previously exported JSON file. Existing records with the same ID will be overwritten.
        </p>
        <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="handleFile" />
        <button @click="fileInput?.click()" class="w-full rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-3 mt-2 active:bg-slate-50 dark:active:bg-slate-700 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-700 flex items-center justify-center gap-1.5">
          <Upload :size="16" /> Choose backup file
        </button>
        <p v-if="pendingFileName" class="text-xs text-slate-500 dark:text-slate-400">Selected: {{ pendingFileName }}</p>
      </div>
    </div>

    <p class="text-xs text-slate-400 dark:text-slate-500 text-center px-4 lg:max-w-4xl lg:text-left lg:px-0">
      Tip: back up regularly, especially before large edits. Restoring does not delete records that aren't in the backup file.
    </p>

    <ConfirmDialog
      v-model="confirmRestore"
      title="Restore this backup?"
      message="This will overwrite any existing records that share the same ID with the data in this file. This can't be undone."
      confirm-label="Restore"
      danger
      @confirm="doRestore"
    />
  </div>
</template>

<script setup lang="ts">
import { Download, Upload } from 'lucide-vue-next'
import type { BackupData } from '~/types'

definePageMeta({ layout: 'default' })

const { exportBackup, downloadBackup, restoreBackup } = useBackup()
const toast = useToast()

const exporting = ref(false)
async function doExport() {
  exporting.value = true
  try {
    const data = await exportBackup()
    downloadBackup(data)
    toast.success('Backup downloaded')
  } catch {
    toast.error('Could not create backup')
  } finally {
    exporting.value = false
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
const pendingFileName = ref('')
const pendingData = ref<BackupData | null>(null)
const confirmRestore = ref(false)

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  pendingFileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result as string) as BackupData
      if (!parsed.people || !parsed.products || !parsed.utangs || !parsed.payments) {
        throw new Error('invalid')
      }
      pendingData.value = parsed
      confirmRestore.value = true
    } catch {
      toast.error('That file doesn\'t look like a valid backup')
    }
  }
  reader.readAsText(file)
}

async function doRestore() {
  if (!pendingData.value) return
  try {
    await restoreBackup(pendingData.value)
    toast.success('Backup restored')
  } catch {
    toast.error('Restore failed partway through')
  } finally {
    pendingData.value = null
    pendingFileName.value = ''
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>
