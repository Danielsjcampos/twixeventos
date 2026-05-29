/**
 * Pipeline de imagens 100% client-side, sem cloud storage.
 *
 * 1. toWebP(file)      → converte/redimensiona via Canvas, retorna um novo File
 * 2. uploadImage(file) → lê o File e retorna a string base64 data URL
 *
 * O "URL" retornado é uma data URL (data:image/webp;base64,…) que vai direto
 * pro banco PostgreSQL (colunas `fotos text[]` e `foto_destaque text`).
 *
 * Sem dependência de Vercel Blob / Cloudinary / S3.
 */

/** Converte qualquer imagem para WebP no browser via Canvas API */
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
      if (!ctx) { reject(new Error('Canvas indisponível')); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Falha ao converter para WebP')); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
        },
        'image/webp',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Falha ao carregar imagem')) }
    img.src = objectUrl
  })
}

/**
 * Envia o arquivo de imagem para o Vercel Blob e retorna a URL permanente pública CDN.
 * A URL retornada vai direto para a coluna do banco (TEXT/text[]).
 */
export async function uploadImage(file: File): Promise<string> {
  const originalKB = Math.round(file.size / 1024)
  console.info(`[upload] ⏳ Enviando para o Vercel Blob: nome=${file.name} · tamanho=${originalKB}KB`)

  const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    body: file,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || 'Erro ao realizar upload para o Vercel Blob')
  }

  const data = await res.json()
  console.info(`[upload] ✅ Upload concluído com sucesso: ${data.url}`)
  return data.url
}
