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

/**
 * Upload image:
 * - PRODUCTION: direct browser → Vercel Blob via @vercel/blob/client (bypasses 4.5MB serverless limit)
 * - DEV fallback: POSTs FormData to /api/upload (filesystem storage)
 */
export async function uploadImage(file: File): Promise<string> {
  // 1) Converte para WebP no browser (mantém SVG/GIF intactos)
  let finalFile = file
  if (file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
    try {
      finalFile = await toWebP(file)
    } catch (err) {
      console.warn('[upload] WebP falhou, enviando original:', err)
    }
  }

  const originalKB = Math.round(file.size / 1024)
  const finalKB    = Math.round(finalFile.size / 1024)
  const saving     = Math.max(0, Math.round((1 - finalFile.size / file.size) * 100))

  // 2) Tenta upload direto cliente → Vercel Blob (produção)
  try {
    const { upload } = await import('@vercel/blob/client')
    const ext = finalFile.type === 'image/svg+xml' ? 'svg'
             : finalFile.type === 'image/gif'     ? 'gif'
             : 'webp'
    const pathname = `twix-eventos/brinquedos/${crypto.randomUUID()}.${ext}`

    const blob = await upload(pathname, finalFile, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      contentType: finalFile.type,
    })

    console.info(`[upload] ✅ Vercel Blob: ${originalKB}KB → ${finalKB}KB (−${saving}%) | ${blob.url}`)
    return blob.url
  } catch (clientErr) {
    console.warn('[upload] Vercel Blob (cliente) falhou — tentando fallback FormData:', clientErr)
  }

  // 3) Fallback: FormData → /api/upload (dev / filesystem)
  const fd = new FormData()
  fd.append('file', finalFile)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { error?: string }).error ?? 'Falha no upload'
    throw new Error(msg)
  }
  const data = await res.json() as { url: string; storage?: string }
  console.info(`[upload] ✅ ${data.storage}: ${originalKB}KB → ${finalKB}KB (−${saving}%)`)
  return data.url
}
