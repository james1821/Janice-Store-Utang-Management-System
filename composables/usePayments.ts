import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import type { Payment, Utang } from '~/types'
import { getOutstandingBalance } from './useUtangCalc'
import { useUtangs } from './useUtangs'

const payments = ref<Payment[]>([])
let unsub: (() => void) | null = null

export function usePayments() {
  const { $db } = useNuxtApp()
  const { updateUtangAfterPayment } = useUtangs()

  function init() {
    if (unsub) return
    const q = query(collection($db as any, 'payments'), orderBy('createdAt', 'desc'))
    unsub = onSnapshot(q, (snap) => {
      payments.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment)
    })
  }

  function forPerson(personId: string) {
    return computed(() => payments.value.filter((p) => p.personId === personId))
  }

  function forUtang(utangId: string) {
    return computed(() => payments.value.filter((p) => p.utangId === utangId))
  }

  /**
   * Records a payment against a specific utang and updates its paid/outstanding status.
   * Supports partial payments; caps the recorded amount at what's actually owed.
   */
  async function recordPayment(utang: Utang, amount: number, note?: string) {
    const outstanding = getOutstandingBalance(utang)
    const applied = Math.min(amount, outstanding)
    if (applied <= 0) return

    await addDoc(collection($db as any, 'payments'), {
      personId: utang.personId,
      utangId: utang.id,
      amount: applied,
      note: note || '',
      createdAt: Date.now()
    })

    const newAmountPaid = +(utang.amountPaid + applied).toFixed(2)
    const stillOwed = getOutstandingBalance({ ...utang, amountPaid: newAmountPaid })
    const newStatus: Utang['status'] = stillOwed <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid'

    await updateUtangAfterPayment(utang.id, newAmountPaid, newStatus)
  }

  return { payments, init, forPerson, forUtang, recordPayment }
}
