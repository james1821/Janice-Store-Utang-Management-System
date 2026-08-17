const lightboxSrc = ref('')
const lightboxAlt = ref('')

export function useLightbox() {
  function open(src: string, alt = '') {
    if (!src) return
    lightboxSrc.value = src
    lightboxAlt.value = alt
  }
  function close() {
    lightboxSrc.value = ''
    lightboxAlt.value = ''
  }
  return { lightboxSrc, lightboxAlt, open, close }
}
