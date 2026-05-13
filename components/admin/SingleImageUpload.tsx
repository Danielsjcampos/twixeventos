'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { toWebP, uploadImage } from '@/lib/cloudinary/upload'

interface Props {
  value: string
  onChange: (url: string) => void
  onRemove: () => void
  label?: string
  accept?: string
}

export function SingleImageUpload({ value, onChange, onRemove, label = 'Clique ou arraste uma imagem aqui', accept = 'image/*' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setUploading(true)

    try {
      const webp = await toWebP(file)
      const url = await uploadImage(webp)
      onChange(url)
    } catch {
      toast.error(`Erro ao enviar ${file.name}`)
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      {!value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className={cn(
            'w-full flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed py-8 transition-colors cursor-pointer bg-brand-surface',
            uploading
              ? 'border-brand-border cursor-not-allowed'
              : 'border-brand-border hover:border-brand-accent/60 hover:bg-brand-accent/5 text-brand-muted hover:text-brand-accent',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-brand-accent" />
              <span className="text-sm text-brand-muted">Enviando imagem…</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-6" />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-brand-muted/70">PNG, JPG, WEBP — convertido para WebP (max 5MB)</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative rounded-xl border border-brand-border bg-brand-surface-2 p-2 overflow-hidden flex items-center justify-center min-h-[100px] group">
          <img src={value} alt="Preview" className="max-h-[200px] w-auto object-contain rounded-md" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-3 py-1.5 rounded-lg text-sm transition-colors border border-white/20 backdrop-blur-md"
            >
              Trocar imagem
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="bg-red-500/80 hover:bg-red-500 text-white font-medium px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-500/50 backdrop-blur-md"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}
