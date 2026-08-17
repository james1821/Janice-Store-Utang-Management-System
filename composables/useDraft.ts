/**
 * Persists in-progress form input to localStorage, keyed by a caller-chosen
 * string. Used so that closing a modal without saving (backdrop click, the
 * × button, accidentally navigating away) doesn't clear whatever was typed —
 * reopening the same form restores the draft. Drafts are cleared explicitly
 * once the form is actually saved.
 */
export function useDraftStorage() {
  function load<T = any>(key: string): T | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(`draft:${key}`)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  function save(key: string, data: unknown) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(`draft:${key}`, JSON.stringify(data))
    } catch {
      // storage full/unavailable — not critical, just skip persisting
    }
  }

  function clear(key: string) {
    if (!import.meta.client) return
    try {
      localStorage.removeItem(`draft:${key}`)
    } catch {}
  }

  /** Loads any existing draft for `key` on top of `state`, then keeps saving changes to it. */
  function bindDraft<T extends Record<string, any>>(key: string, state: T) {
    const existing = load<Partial<T>>(key)
    if (existing) Object.assign(state, existing)
    watch(
      state,
      (val) => save(key, val),
      { deep: true }
    )
  }

  return { load, save, clear, bindDraft }
}
