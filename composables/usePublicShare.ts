import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import type { Payment, Person, Utang } from '~/types'

const DAY_MS = 24 * 60 * 60 * 1000

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function usePublicShare() {
  const person = ref<Person | null>(null)
  const utangs = ref<Utang[]>([])
  const payments = ref<Payment[]>([])
  const loading = ref(true)
  const notFound = ref(false)

  async function attemptLoad(personId: string): Promise<boolean> {
    const { $db } = useNuxtApp()
    const personSnap = await getDoc(doc($db as any, 'people', personId))
    const data = personSnap.exists() ? (personSnap.data() as Omit<Person, 'id'>) : null

    // Mirrors the Firestore rules' own expiry check — a share only counts as
    // active if it's enabled, has an activation timestamp, and is under 24h old.
    const isActive = !!data && !data.isDeleted && data.shareEnabled === true && typeof data.shareEnabledAt === 'number' && Date.now() < data.shareEnabledAt + DAY_MS

    if (!data || !isActive) {
      return false
    }
    person.value = { id: personSnap.id, ...data }

    const [utangsSnap, paymentsSnap] = await Promise.all([
      getDocs(query(collection($db as any, 'utangs'), where('personId', '==', personId))),
      getDocs(query(collection($db as any, 'payments'), where('personId', '==', personId)))
    ])

    utangs.value = utangsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Utang, 'id'>) }))
      .sort((a, b) => b.createdAt - a.createdAt)

    payments.value = paymentsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) }))
      .sort((a, b) => b.createdAt - a.createdAt)

    return true
  }

  async function load(personId: string) {
    loading.value = true
    notFound.value = false
    person.value = null
    utangs.value = []
    payments.value = []

    // A share that was *just* turned on can, very rarely, hit a brief window
    // where Firestore's rules evaluation hasn't caught up yet. Retry a couple
    // times with a short backoff before concluding the link really isn't valid,
    // so a customer scanning right after the store enables it doesn't get a
    // false "not available" on the first try.
    const attempts = [0, 700, 1500]
    let ok = false
    for (let i = 0; i < attempts.length; i++) {
      const delay = attempts[i]
      if (delay) await wait(delay)
      try {
        ok = await attemptLoad(personId)
        if (ok) break
      } catch {
        ok = false
      }
    }

    notFound.value = !ok
    loading.value = false
  }

  return { person, utangs, payments, loading, notFound, load }
}
