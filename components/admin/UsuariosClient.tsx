'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Shield, UserCheck, Eye, DollarSign, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'admin' | 'operador' | 'financeiro' | 'viewer'

interface Usuario {
  id: string
  email: string
  nome: string
  cargo: string | null
  role: string
  ativo: boolean
  ultimoAcesso: Date | null
  createdAt: Date
}

const ROLES: Record<Role, { label: string; cor: string; icon: React.ReactNode }> = {
  admin: { label: 'Administrador', cor: '#EF4444', icon: <Shield className="size-3.5" /> },
  operador: { label: 'Operador', cor: '#3B82F6', icon: <UserCheck className="size-3.5" /> },
  financeiro: { label: 'Financeiro', cor: '#10B981', icon: <DollarSign className="size-3.5" /> },
  viewer: { label: 'Visualizador', cor: '#6B7280', icon: <Eye className="size-3.5" /> },
}

const PERMISSOES_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads / CRM',
  brinquedos: 'Brinquedos',
  eventos: 'Eventos',
  monitores: 'Monitores',
  financeiro: 'Financeiro',
  usuarios: 'Usuários',
  configuracoes: 'Configurações',
}

const ROLE_PERMISSOES: Record<Role, string[]> = {
  admin: ['dashboard', 'leads', 'brinquedos', 'eventos', 'monitores', 'financeiro', 'usuarios', 'configuracoes'],
  operador: ['dashboard', 'leads', 'brinquedos', 'eventos', 'monitores'],
  financeiro: ['dashboard', 'financeiro', 'eventos'],
  viewer: ['dashboard'],
}

function RoleBadge({ role }: { role: string }) {
  const r = ROLES[role as Role]
  if (!r) return <span className="text-brand-muted text-xs">{role}</span>
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: r.cor, backgroundColor: `${r.cor}18`, borderColor: `${r.cor}40` }}
    >
      {r.icon}
      {r.label}
    </span>
  )
}

interface FormState {
  nome: string
  email: string
  cargo: string
  role: Role
}

function UsuarioModal({
  usuario,
  onClose,
  onSave,
}: {
  usuario?: Usuario
  onClose: () => void
  onSave: (data: FormState & { id?: string }) => Promise<void>
}) {
  const [form, setForm] = useState<FormState>({
    nome: usuario?.nome ?? '',
    email: usuario?.email ?? '',
    cargo: usuario?.cargo ?? '',
    role: (usuario?.role as Role) ?? 'operador',
  })
  const [saving, setSaving] = useState(false)

  const permissoes = ROLE_PERMISSOES[form.role]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ ...form, id: usuario?.id })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <h2 className="text-brand-text font-semibold">
            {usuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-brand-muted uppercase tracking-wider">Nome</label>
            <input
              required
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3.5 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-brand-muted uppercase tracking-wider">E-mail</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3.5 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
              placeholder="email@empresa.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-brand-muted uppercase tracking-wider">Cargo</label>
            <input
              value={form.cargo}
              onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
              className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3.5 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
              placeholder="Ex: Gerente de Eventos"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-brand-muted uppercase tracking-wider">Perfil de Acesso</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLES) as Role[]).map(r => {
                const info = ROLES[r]
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                      form.role === r
                        ? 'border-opacity-100'
                        : 'border-brand-border text-brand-muted hover:border-brand-border/80 hover:text-brand-text',
                    )}
                    style={form.role === r ? {
                      borderColor: `${info.cor}60`,
                      color: info.cor,
                      backgroundColor: `${info.cor}10`,
                    } : {}}
                  >
                    {info.icon}
                    {info.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Permissões preview */}
          <div className="bg-brand-surface-2 border border-brand-border rounded-xl p-3.5">
            <p className="text-xs text-brand-muted uppercase tracking-wider mb-2.5">Permissões incluídas</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(PERMISSOES_LABELS).map(p => {
                const has = permissoes.includes(p)
                return (
                  <span
                    key={p}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border',
                      has
                        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                        : 'text-brand-muted/40 bg-brand-surface border-brand-border/40 line-through',
                    )}
                  >
                    {has && <Check className="size-2.5" />}
                    {PERMISSOES_LABELS[p]}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Salvando…' : usuario ? 'Salvar' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UsuariosClient({ usuariosInicial }: { usuariosInicial: Usuario[] }) {
  const [usuarios, setUsuarios] = useState(usuariosInicial)
  const [modal, setModal] = useState<{ open: boolean; usuario?: Usuario }>({ open: false })
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleSave(data: FormState & { id?: string }) {
    const res = await fetch('/api/admin/usuarios' + (data.id ? `/${data.id}` : ''), {
      method: data.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return
    const saved = await res.json()
    if (data.id) {
      setUsuarios(prev => prev.map(u => u.id === data.id ? saved : u))
    } else {
      setUsuarios(prev => [saved, ...prev])
    }
    setModal({ open: false })
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este usuário?')) return
    setDeleting(id)
    await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
    setUsuarios(prev => prev.filter(u => u.id !== id))
    setDeleting(null)
  }

  async function toggleAtivo(u: Usuario) {
    const res = await fetch(`/api/admin/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    })
    if (!res.ok) return
    const saved = await res.json()
    setUsuarios(prev => prev.map(x => x.id === u.id ? saved : x))
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase tracking-wide">
            Usuários
          </h1>
          <p className="text-brand-muted text-sm mt-1">Gerencie acessos e permissões do sistema</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          Novo Usuário
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(ROLES) as Role[]).map(r => {
          const count = usuarios.filter(u => u.role === r).length
          const info = ROLES[r]
          return (
            <div key={r} className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ color: info.cor, backgroundColor: `${info.cor}18` }}>
                {info.icon}
              </div>
              <div>
                <p className="text-brand-text font-bold text-xl leading-none">{count}</p>
                <p className="text-brand-muted text-xs mt-0.5">{info.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* User list */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border flex items-center gap-2">
          <Users className="size-4 text-brand-muted" />
          <span className="text-brand-text font-semibold text-sm">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}</span>
        </div>

        {usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-brand-muted">
            <Users className="size-10 mb-3 opacity-30" />
            <p className="font-medium">Nenhum usuário cadastrado</p>
            <p className="text-xs mt-1">Clique em &ldquo;Novo Usuário&rdquo; para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {usuarios.map(u => (
              <div
                key={u.id}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 transition-colors hover:bg-brand-surface-2',
                  !u.ativo && 'opacity-50',
                )}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: `${ROLES[u.role as Role]?.cor ?? '#6B7280'}18`,
                    color: ROLES[u.role as Role]?.cor ?? '#6B7280',
                  }}
                >
                  {u.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-brand-text font-semibold text-sm">{u.nome}</p>
                    {!u.ativo && (
                      <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 px-1.5 py-0.5 rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-brand-muted text-xs mt-0.5">{u.email}</p>
                  {u.cargo && <p className="text-brand-muted/60 text-xs">{u.cargo}</p>}
                </div>

                {/* Role badge */}
                <div className="hidden md:block shrink-0">
                  <RoleBadge role={u.role} />
                </div>

                {/* Last access */}
                <div className="hidden lg:block shrink-0 text-right">
                  <p className="text-brand-muted text-xs">
                    {u.ultimoAcesso
                      ? new Date(u.ultimoAcesso).toLocaleDateString('pt-BR')
                      : 'Nunca acessou'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleAtivo(u)}
                    className={cn(
                      'p-1.5 rounded-lg text-xs font-medium transition-colors',
                      u.ativo
                        ? 'text-emerald-400 hover:bg-emerald-400/10'
                        : 'text-brand-muted hover:bg-brand-surface-2',
                    )}
                    title={u.ativo ? 'Desativar' : 'Ativar'}
                  >
                    <Check className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setModal({ open: true, usuario: u })}
                    className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 transition-colors"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deleting === u.id}
                    className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <UsuarioModal
          usuario={modal.usuario}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
