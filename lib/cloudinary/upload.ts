/** Convert any image to WebP in the browser via Canvas before upload */
export async function toWebP(file: File, maxWidth = 1400, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const ratio = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not available')); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('WebP conversion failed')); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

/** Upload a file to our server-side API route (handles Cloudinary / Vercel Blob / local) */
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { error?: string }).error ?? 'Falha no upload'
    throw new Error(msg)
  }
  const data = await res.json() as { url: string; storage?: string; originalSize?: number; finalSize?: number }
  if (data.originalSize && data.finalSize) {
    const saving = Math.round((1 - data.finalSize / data.originalSize) * 100)
    if (saving > 0) console.info(`[upload] WebP: ${Math.round(data.originalSize/1024)}KB → ${Math.round(data.finalSize/1024)}KB (−${saving}%) via ${data.storage}`)
  }
  return data.url
}
