/**
 * Image pipeline — client-side compression + server-side storage.
 *
 * 1. toWebP(file)      → converts/resizes via Canvas API, returns a new File
 * 2. uploadImage(file) → POSTs the binary to /api/upload, returns the public path
 *
 * The returned URL is a relative path like "/uploads/1234-abc.webp" that is
 * served by Next.js static file serving from public/uploads/.
 * This path is stored directly in the PostgreSQL columns (TEXT / text[]).
 */

/** Converts any image to WebP in the browser via Canvas API */
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
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

/**
 * Uploads a file to /api/upload and returns the public relative path.
 * The server saves the binary to public/uploads/ (Docker volume: twix_uploads).
 */
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)

  const res = await fetch('/api/upload', { method: 'POST', body: fd })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Upload failed')
  }

  const data = await res.json() as { url: string }
  console.info(`[upload] ✅ Saved: ${data.url}`)
  return data.url
}
