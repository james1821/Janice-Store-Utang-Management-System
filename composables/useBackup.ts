import { collection, getDocs, writeBatch, doc } from 'firebase/firestore'
import type { BackupData, Person, Product, Utang, Payment } from '~/types'

export function useBackup() {
  const { $db } = useNuxtApp()

  async function exportBackup(): Promise<BackupData> {
    const [peopleSnap, productsSnap, utangsSnap, paymentsSnap] = await Promise.all([
      getDocs(collection($db as any, 'people')),
      getDocs(collection($db as any, 'products')),
      getDocs(collection($db as any, 'utangs')),
      getDocs(collection($db as any, 'payments'))
    ])

    return {
      exportedAt: Date.now(),
      version: 1,
      people: peopleSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Person),
      products: productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
      utangs: utangsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Utang),
      payments: paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment)
    }
  }

  function downloadBackup(data: BackupData) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date(data.exportedAt).toISOString().slice(0, 10)
    a.href = url
    a.download = `janice-store-utang-backup-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /**
   * Restores a backup by writing each record back with its original ID (upsert).
   * Uses batched writes (max 500 ops/batch per Firestore limits).
   */
  async function restoreBackup(data: BackupData) {
    const collections: Array<[string, any[]]> = [
      ['people', data.people],
      ['products', data.products],
      ['utangs', data.utangs],
      ['payments', data.payments]
    ]

    for (const [name, records] of collections) {
      for (let i = 0; i < records.length; i += 450) {
        const batch = writeBatch($db as any)
        const chunk = records.slice(i, i + 450)
        for (const record of chunk) {
          const { id, ...rest } = record
          batch.set(doc($db as any, name, id), rest)
        }
        await batch.commit()
      }
    }
  }

  return { exportBackup, downloadBackup, restoreBackup }
}
