'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  brinquedoId: string
  nome: string
}

export function DeleteBrinquedoButton({ brinquedoId, nome }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/brinquedos/${brinquedoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Brinquedo excluido com sucesso')
      router.push('/admin/brinquedos')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir')
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 hover:border-red-500 transition-all"
      >
        <TrashIcon />
        Excluir brinquedo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-brand-text mb-2">Excluir brinquedo</h2>
            <p className="text-sm text-brand-muted mb-1">
              Tem certeza que deseja excluir <span className="font-semibold text-brand-text">{nome}</span>?
            </p>
            <p className="text-xs text-red-400 mb-6">
              Esta acao nao pode ser desfeita. O brinquedo sera removido permanentemente.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-muted hover:border-brand-accent/50 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60"
              >
                {loading ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
