'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { toWebP, uploadImage } from '@/lib/cloudinary/upload'

interface Props {
  fotos: string[]
  fotoDestaque: string | null
  onChange: (fotos: string[], destaque: string | null) => void
}

export function ImageUpload({ fotos, fotoDestaque, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    setUploading(true)
    setProgress({ done: 0, total: fileArray.length })

    const uploaded: string[] = []
    for (const file of fileArray) {
      try {
        const webp = await toWebP(file)
        const url = await uploadImage(webp)
        uploaded.push(url)
        setProgress(p => ({ ...p, done: p.done + 1 }))
      } catch {
        toast.error(`Erro ao enviar ${file.name}`)
        setProgress(p => ({ ...p, done: p.done + 1 }))
      }
    }

    const newFotos = [...fotos, ...uploaded]
    const newDestaque = fotoDestaque ?? (uploaded[0] ?? null)
    onChange(newFotos, newDestaque)
    setUploading(false)
    setProgress({ done: 0, total: 0 })
    // Reset input so same files can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (url: string) => {
    const newFotos = fotos.filter(f => f !== url)
    const newDestaque = fotoDestaque === url ? (newFotos[0] ?? null) : fotoDestaque
    onChange(newFotos, newDestaque)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className={cn(
          'w-full flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed py-10 transition-colors cursor-pointer',
          uploading
            ? 'border-zinc-700 cursor-not-allowed'
            : 'border-zinc-700 hover:border-brand-accent/60 hover:bg-brand-accent/5 text-zinc-400 hover:text-brand-accent',
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-7 animate-spin text-brand-accent" />
            <span className="text-sm text-zinc-400">
              Convertendo e enviando… {progress.done}/{progress.total}
            </span>
            <span className="text-xs text-zinc-600">PNG/JPG → WebP automático</span>
          </>
        ) : (
          <>
            <ImagePlus className="size-7" />
            <span className="text-sm font-medium">Clique ou arraste imagens aqui</span>
            <span className="text-xs text-zinc-600">PNG, JPG, WEBP — convertidas para WebP automaticamente</span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Photo grid */}
      {fotos.length > 0 && (
        <>
          <p className="text-xs text-zinc-500 -mb-1">
            Clique em uma foto para definir como <span className="text-brand-accent font-semibold">capa</span>. A capa é exibida no catálogo e na home.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {fotos.map(url => {
              const isCover = fotoDestaque === url
              return (
                <div
                  key={url}
                  onClick={() => onChange(fotos, url)}
                  className={cn(
                    'relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-150',
                    isCover
                      ? 'border-brand-accent ring-2 ring-brand-accent/30'
                      : 'border-zinc-700 hover:border-zinc-500',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Foto" className="w-full h-full object-cover" />

                  {/* Hover overlay — "Definir capa" */}
                  {!isCover && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-brand-accent px-2 py-1 rounded-lg">
                        Definir capa
                      </span>
                    </div>
                  )}

                  {/* Cover badge */}
                  {isCover && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-brand-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="size-2.5" />
                      CAPA
                    </div>
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleRemove(url) }}
                    className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remover foto"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
