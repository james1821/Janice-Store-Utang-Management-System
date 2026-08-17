const isDark = ref(false)
let initialized = false

export function useDarkMode() {
  function apply(dark: boolean) {
    isDark.value = dark
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      localStorage.setItem('darkMode', dark ? '1' : '0')
    }
  }

  function init() {
    if (initialized || !import.meta.client) return
    initialized = true
    const stored = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    apply(stored ? stored === '1' : !!prefersDark)
  }

  function toggle() {
    apply(!isDark.value)
  }

  return { isDark, init, toggle }
}
