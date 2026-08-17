import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import type { Product } from '~/types'

const products = ref<Product[]>([])
let unsub: (() => void) | null = null

export function useProducts() {
  const { $db } = useNuxtApp()

  function init() {
    if (unsub) return
    const q = query(collection($db as any, 'products'), orderBy('name'))
    unsub = onSnapshot(q, (snap) => {
      products.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
    })
  }

  const activeProducts = computed(() => products.value.filter((p) => !p.isDeleted))

  async function addProduct(data: Omit<Product, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now()
    await addDoc(collection($db as any, 'products'), stripUndefined({ ...data, isDeleted: false, createdAt: now, updatedAt: now }))
  }

  async function updateProduct(id: string, data: Partial<Product>) {
    await updateDoc(doc($db as any, 'products', id), stripUndefined({ ...data, updatedAt: Date.now() }))
  }

  async function softDeleteProduct(id: string) {
    await updateDoc(doc($db as any, 'products', id), { isDeleted: true, updatedAt: Date.now() })
  }

  async function toggleFavorite(id: string) {
    const product = products.value.find((p) => p.id === id)
    if (!product) return
    await updateDoc(doc($db as any, 'products', id), { isFavorite: !product.isFavorite, updatedAt: Date.now() })
  }

  return { products, activeProducts, init, addProduct, updateProduct, softDeleteProduct, toggleFavorite }
}
