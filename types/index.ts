export type UtangType = 'tinda' | 'cash' | 'gcash'
export type InterestType = 'percentage' | 'fixed'
export type InterestFrequency = 'day' | 'week' | 'month'

export interface Person {
  id: string
  fullName: string
  /** Compressed base64 JPEG data URL, stored directly in the Firestore document. */
  photoUrl?: string
  isFavorite?: boolean
  /** All of the following are optional contact details. */
  phoneNumber?: string
  gcashName?: string
  gcashNumber?: string
  address?: string
  /** When true, this person's utang history is readable (read-only) via their public /share/{id} link/QR. */
  shareEnabled?: boolean
  /** Timestamp (ms) sharing was last turned on — access expires 24h after this. */
  shareEnabledAt?: number
  isDeleted: boolean
  createdAt: number
  updatedAt: number
}

export interface Product {
  id: string
  name: string
  price: number
  /** Compressed base64 JPEG data URL, stored directly in the Firestore document. */
  imageUrl?: string
  isFavorite?: boolean
  isDeleted: boolean
  createdAt: number
  updatedAt: number
}

export interface TindaLineItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
}

export interface Utang {
  id: string
  personId: string
  type: UtangType
  note?: string
  amount: number // principal amount at creation (for tinda: sum of line items)
  status: 'unpaid' | 'partial' | 'paid'
  amountPaid: number
  dueDate?: number
  createdAt: number
  updatedAt: number

  // tinda
  items?: TindaLineItem[]

  // interest (available on cash and gcash utangs)
  interestType?: InterestType
  interestValue?: number
  interestFrequency?: InterestFrequency

  // gcash
  gcashNumber?: string
}

export interface Payment {
  id: string
  personId: string
  utangId: string
  amount: number
  note?: string
  createdAt: number
}

export interface BackupData {
  exportedAt: number
  version: 1
  people: Person[]
  products: Product[]
  utangs: Utang[]
  payments: Payment[]
}
