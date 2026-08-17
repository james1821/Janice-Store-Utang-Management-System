import type { Utang } from '~/types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function periodsElapsed(createdAt: number, frequency: 'day' | 'week' | 'month'): number {
  const days = Math.floor((Date.now() - createdAt) / MS_PER_DAY)
  if (frequency === 'day') return Math.max(0, days)
  if (frequency === 'week') return Math.max(0, Math.floor(days / 7))
  return Math.max(0, Math.floor(days / 30)) // month approximated as 30 days
}

/** Simple (non-compounding) interest, calculated on-demand from elapsed time. Applies to cash and gcash utangs. */
export function calculateAccruedInterest(utang: Utang): number {
  if (!utang.interestType || !utang.interestValue || !utang.interestFrequency) return 0
  const periods = periodsElapsed(utang.createdAt, utang.interestFrequency)
  if (periods <= 0) return 0
  if (utang.interestType === 'percentage') {
    return +(utang.amount * (utang.interestValue / 100) * periods).toFixed(2)
  }
  return +(utang.interestValue * periods).toFixed(2)
}

/** Total owed for this utang right now: principal + accrued interest - amount already paid. */
export function getOutstandingBalance(utang: Utang): number {
  const total = utang.amount + calculateAccruedInterest(utang)
  return Math.max(0, +(total - utang.amountPaid).toFixed(2))
}

export function formatCurrency(value: number): string {
  return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Full date and time (e.g. "Aug 14, 2026, 3:45 PM") for activity/log entries. */
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/** Date only, no time (e.g. "Aug 14, 2026") — used for due dates. */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export type DueStatus = 'none' | 'paid' | 'overdue' | 'approaching' | 'upcoming'

/** How urgent a utang's due date is, used to color-code cards and calendar dots. */
export function getDueStatus(utang: Utang): DueStatus {
  if (!utang.dueDate) return 'none'
  if (utang.status === 'paid') return 'paid'
  const daysLeft = Math.ceil((utang.dueDate - Date.now()) / MS_PER_DAY)
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 3) return 'approaching'
  return 'upcoming'
}

/** "Today", "Yesterday", or a full date like "August 13, 2026" — used as list section headers. */
export function getDateGroupLabel(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / MS_PER_DAY)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Buckets an already date-sorted list into { label, items } sections by day. */
export function groupByDateLabel<T>(items: T[], getTimestamp: (item: T) => number): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = []
  for (const item of items) {
    const label = getDateGroupLabel(getTimestamp(item))
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(item)
    } else {
      groups.push({ label, items: [item] })
    }
  }
  return groups
}

export function useUtangCalc() {
  return {
    calculateAccruedInterest,
    getOutstandingBalance,
    formatCurrency,
    formatDateTime,
    formatDate,
    getDueStatus,
    getDateGroupLabel,
    groupByDateLabel
  }
}
