import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import type { Utang } from '~/types'
import { getOutstandingBalance, calculateAccruedInterest } from './useUtangCalc'

const utangs = ref<Utang[]>([])
let unsub: (() => void) | null = null

export function useUtangs() {
  const { $db } = useNuxtApp()

  function init() {
    if (unsub) return
    const q = query(collection($db as any, 'utangs'), orderBy('createdAt', 'desc'))
    unsub = onSnapshot(q, (snap) => {
      utangs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Utang)
    })
  }

  function forPerson(personId: string) {
    return computed(() => utangs.value.filter((u) => u.personId === personId))
  }

  function getUtang(id: string) {
    return computed(() => utangs.value.find((u) => u.id === id) || null)
  }

  function outstandingForPerson(personId: string) {
    return computed(() =>
      utangs.value
        .filter((u) => u.personId === personId && u.status !== 'paid')
        .reduce((sum, u) => sum + getOutstandingBalance(u), 0)
    )
  }

  const totalOutstanding = computed(() =>
    utangs.value.filter((u) => u.status !== 'paid').reduce((sum, u) => sum + getOutstandingBalance(u), 0)
  )

  const activeDebtorCount = computed(() => {
    const ids = new Set(
      utangs.value.filter((u) => u.status !== 'paid' && getOutstandingBalance(u) > 0).map((u) => u.personId)
    )
    return ids.size
  })

  const byCategory = computed(() => {
    const result = { tinda: 0, cash: 0, gcash: 0 }
    for (const u of utangs.value) {
      if (u.status === 'paid') continue
      result[u.type] += getOutstandingBalance(u)
    }
    return result
  })

  async function addUtang(data: Omit<Utang, 'id' | 'status' | 'amountPaid' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now()
    await addDoc(collection($db as any, 'utangs'), stripUndefined({
      ...data,
      status: 'unpaid',
      amountPaid: 0,
      createdAt: now,
      updatedAt: now
    }))
  }

  async function updateUtangAfterPayment(id: string, newAmountPaid: number, newStatus: Utang['status']) {
    await updateDoc(doc($db as any, 'utangs', id), {
      amountPaid: newAmountPaid,
      status: newStatus,
      updatedAt: Date.now()
    })
  }

  async function updateUtang(id: string, data: Partial<Utang>) {
    await updateDoc(doc($db as any, 'utangs', id), stripUndefined({ ...data, updatedAt: Date.now() }))
  }

  async function markUtangPaid(id: string, utang: Utang) {
    const total = +(utang.amount + calculateAccruedInterest(utang)).toFixed(2)
    await updateDoc(doc($db as any, 'utangs', id), {
      status: 'paid',
      amountPaid: total,
      updatedAt: Date.now()
    })
  }

  return {
    utangs,
    init,
    forPerson,
    getUtang,
    outstandingForPerson,
    totalOutstanding,
    activeDebtorCount,
    byCategory,
    addUtang,
    updateUtangAfterPayment,
    updateUtang,
    markUtangPaid
  }
}
