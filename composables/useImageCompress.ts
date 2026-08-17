/**
 * Compresses an image file into a small base64 JPEG data URL entirely in the
 * browser (canvas resize + quality reduction). The result is small enough
 * (tens of KB) to store directly as a Firestore document field, so no
 * Firebase Storage bucket is needed — keeps everything on the free Firestore tier.
 */
export function useImageCompress() {
  async function compressImageFile(
    file: File,
    opts: { maxDimension?: number; targetKB?: number } = {}
  ): Promise<string> {
    const maxDimension = opts.maxDimension ?? 480
    const targetKB = opts.targetKB ?? 60

    const dataUrl = await readFileAsDataUrl(file)
    const img = await loadImage(dataUrl)

    let width = img.naturalWidth
    let height = img.naturalHeight
    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width)
        width = maxDimension
      } else {
        width = Math.round((width * maxDimension) / height)
        height = maxDimension
      }
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.8
    let output = canvas.toDataURL('image/jpeg', quality)

    // Step 1: reduce JPEG quality until under target size (or floor reached).
    while (estimateKB(output) > targetKB && quality > 0.35) {
      quality -= 0.1
      output = canvas.toDataURL('image/jpeg', quality)
    }

    // Step 2: if still too large, shrink dimensions further and retry.
    let attempts = 0
    while (estimateKB(output) > targetKB && attempts < 4) {
      width = Math.round(width * 0.8)
      height = Math.round(height * 0.8)
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      output = canvas.toDataURL('image/jpeg', 0.6)
      attempts++
    }

    return output
  }

  function estimateKB(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] || ''
    return (base64.length * 0.75) / 1024
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsDataURL(file)
    })
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = src
    })
  }

  return { compressImageFile, estimateKB }
}
