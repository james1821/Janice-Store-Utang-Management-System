interface ToastMsg {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<ToastMsg[]>([])
let nextId = 1

export function useToast() {
  function show(text: string, type: ToastMsg['type'] = 'info') {
    const id = nextId++
    toasts.value.push({ id, text, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 3000)
  }

  return {
    toasts,
    success: (text: string) => show(text, 'success'),
    error: (text: string) => show(text, 'error'),
    info: (text: string) => show(text, 'info')
  }
}
