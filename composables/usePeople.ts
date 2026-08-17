import {
  collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import type { Person } from '~/types'

const people = ref<Person[]>([])
let unsub: (() => void) | null = null

export function usePeople() {
  const { $db } = useNuxtApp()

  function init() {
    if (unsub) return
    const q = query(collection($db as any, 'people'), orderBy('fullName'))
    unsub = onSnapshot(q, (snap) => {
      people.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Person)
    })
  }

  const activePeople = computed(() => people.value.filter((p) => !p.isDeleted))

  async function addPerson(data: Omit<Person, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now()
    await addDoc(collection($db as any, 'people'), stripUndefined({ ...data, isDeleted: false, createdAt: now, updatedAt: now }))
  }

  async function updatePerson(id: string, data: Partial<Person>) {
    await updateDoc(doc($db as any, 'people', id), stripUndefined({ ...data, updatedAt: Date.now() }))
  }

  async function softDeletePerson(id: string) {
    await updateDoc(doc($db as any, 'people', id), { isDeleted: true, updatedAt: Date.now() })
  }

  async function restorePerson(id: string) {
    await updateDoc(doc($db as any, 'people', id), { isDeleted: false, updatedAt: Date.now() })
  }

  async function toggleFavorite(id: string) {
    const person = people.value.find((p) => p.id === id)
    if (!person) return
    await updateDoc(doc($db as any, 'people', id), { isFavorite: !person.isFavorite, updatedAt: Date.now() })
  }

  function getPerson(id: string) {
    return computed(() => people.value.find((p) => p.id === id) || null)
  }

  return { people, activePeople, init, addPerson, updatePerson, softDeletePerson, restorePerson, toggleFavorite, getPerson }
}
