'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, Search, Plus, Gift, Phone, Mail, Calendar, ChevronRight, X, Loader2, Star, Coins, Medal, Gem } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Cliente = {
  id: string; nome: string; telefone: string; email: string | null
  tipoCliente: string | null; origem: string | null
  totalEventos: number; ultimoEvento: string | null
  ativo: boolean; createdAt: string; cidade: string | null
  cashbackSaldo?: string | number | null
  cashbackTotal?: string | number | null
}

function getLoyaltyTier(totalEventos: number) {
  if (totalEventos >= 8) return { label: 'Diamante', Icon: Gem,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20'   }
  if (totalEventos >= 5) return { label: 'Ouro',     Icon: Star,  color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
  if (totalEventos >= 3) return { label: 'Prata',    Icon: Medal, color: 'text-slate-300',  bg: 'bg-slate-400/10',  border: 'border-slate-400/20'  }
  if (totalEventos >= 1) return { label: 'Bronze',   Icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
  return null
}

type Aniversario = {
  id: string; nome: string; relacao: string; data_nasc: string; ano_nasc: number | null
  cliente_id: string; cliente_nome: string; cliente_telefone: string; proximo_aniversario: string
}

interface Props {
  clientes: Cliente[]
  aniversarios: Aniversario[]
}

const TIPO_LABEL: Record<string, string> = {
  fisica: 'Pessoa Física', empresa: 'Empresa',
  cerimonialista: 'Cerimonialista', locador: 'Locador',
}

const TIPO_COLOR: Record<string, string> = {
  fisica: '#3B82F6', empresa: '#8B5CF6', cerimonialista: '#EC4899', locador: '#F59E0B',
}

function diasAte(dataStr: string) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const d = new Date(dataStr + 'T00:00:00')
  return Math.round((d.getTime() - hoje.getTime()) / 86400000)
}

function idadeAtual(dataNasc: string, anoNasc: number | null) {
  if (!anoNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  const age = hoje.getFullYear() - anoNasc
  const já = hoje.getMonth() > nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate())
  return já ? age : age - 1
}

export function ClientesClient({ clientes: inicial, aniversarios }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>(inicial)
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', telefone: '', email: '', tipoCliente: 'fisica',
    origem: 'manual', cidade: '', observacoes: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = useMemo(() => {
    return clientes.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.nome.toLowerCase().includes(q) || c.telefone.includes(q) || (c.email ?? '').toLowerCase().includes(q)
      const matchTipo = !tipoFiltro || c.tipoCliente === tipoFiltro
      return matchSearch && matchTipo
    })
  }, [clientes, search, tipoFiltro])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.telefone) { toast.error('Nome e telefone obrigatórios'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      const c = await res.json()
      setClientes(prev => [c, ...prev])
      setShowModal(false)
      setForm({ nome: '', telefone: '', email: '', tipoCliente: 'fisica', origem: 'manual', cidade: '', observacoes: '' })
      toast.success('Cliente criado!')
    } catch (err) {
      toast.error('Erro ao criar cliente')
      console.error(err)
    } finally { setSaving(false) }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <Users size={20} className="text-blue-400" /> Clientes
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">{clientes.length} clientes cadastrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Próximos aniversários */}
      {aniversarios.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} className="text-pink-400" />
            <span className="text-sm font-semibold text-brand-text">Próximos aniversários (30 dias)</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {aniversarios.slice(0, 8).map(a => {
              const dias = diasAte(a.proximo_aniversario)
              const idade = idadeAtual(a.data_nasc, a.ano_nasc)
              const idadeProx = idade !== null ? idade + 1 : null
              return (
                <Link
                  key={a.id}
                  href={`/admin/clientes/${a.cliente_id}`}
                  className="flex-shrink-0 bg-brand-surface border border-brand-border rounded-xl p-3 min-w-[160px] hover:border-pink-500/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-pink-400 text-xs font-bold">
                      {dias === 0 ? '🎂 Hoje!' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`}
                    </span>
                  </div>
                  <p className="font-semibold text-brand-text text-sm truncate">{a.nome}</p>
                  <p className="text-brand-muted text-xs truncate">{a.relacao} de {a.cliente_nome}</p>
                  {idadeProx && <p className="text-brand-muted text-xs mt-0.5">Fará {idadeProx} anos</p>}
                  <p className="text-xs text-brand-muted/60 mt-1">
                    {new Date(a.proximo_aniversario + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nome, telefone ou e-mail..."
            className="w-full pl-8 pr-3 py-2 bg-brand-surface-2 border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
          className="bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(search || tipoFiltro) && (
          <button onClick={() => { setSearch(''); setTipoFiltro('') }} className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-text px-2 py-2 rounded-lg hover:bg-brand-surface-2 transition-colors">
            <X size={12} /> Limpar
          </button>
        )}
        <span className="text-xs text-brand-muted ml-auto">{filtered.length} resultado(s)</span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou adicione um novo cliente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="group bg-brand-surface border border-brand-border rounded-2xl p-4 hover:border-blue-500/30 hover:bg-brand-surface-2/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: TIPO_COLOR[c.tipoCliente ?? 'fisica'] + '33', border: `1px solid ${TIPO_COLOR[c.tipoCliente ?? 'fisica']}44`, color: TIPO_COLOR[c.tipoCliente ?? 'fisica'] }}
                  >
                    {c.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-text text-sm group-hover:text-blue-400 transition-colors">{c.nome}</p>
                    <p className="text-xs text-brand-muted">{TIPO_LABEL[c.tipoCliente ?? 'fisica'] ?? c.tipoCliente}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-brand-muted group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all mt-1" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  <Phone size={11} /> {c.telefone}
                </div>
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-brand-muted truncate">
                    <Mail size={11} /> {c.email}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-brand-border/50 space-y-2">
                {/* Cashback saldo */}
                {(() => {
                  const saldo = parseFloat(String(c.cashbackSaldo ?? '0'))
                  const tier = getLoyaltyTier(c.totalEventos)
                  return (
                    <div className="flex items-center justify-between gap-2">
                      {/* Tier badge */}
                      {tier ? (
                        <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', tier.color, tier.bg, tier.border)}>
                          <tier.Icon size={10} /> {tier.label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-brand-muted/60">
                          <Star size={10} /> {c.totalEventos} festa{c.totalEventos !== 1 ? 's' : ''}
                        </span>
                      )}

                      {/* Cashback saldo */}
                      {saldo > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full tabular-nums">
                          <Coins size={10} /> R$ {saldo.toFixed(2)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-brand-muted/50">
                          <Coins size={10} /> sem cashback
                        </span>
                      )}
                    </div>
                  )
                })()}

                {/* Último evento */}
                <div className="flex items-center justify-between">
                  {c.totalEventos > 0 && (
                    <span className="text-[10px] text-brand-muted">{c.totalEventos} evento{c.totalEventos !== 1 ? 's' : ''}</span>
                  )}
                  {c.ultimoEvento && (
                    <div className="flex items-center gap-1 text-[10px] text-brand-muted ml-auto">
                      <Calendar size={9} />
                      {new Date(c.ultimoEvento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-brand-border sticky top-0 bg-brand-surface z-10">
              <h2 className="font-semibold text-brand-text">Novo Cliente</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-brand-surface-2 hover:bg-red-500/10 hover:text-red-400 text-brand-muted flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Nome *</label>
                  <input value={form.nome} onChange={set('nome')} required placeholder="Nome completo"
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Telefone *</label>
                  <input value={form.telefone} onChange={set('telefone')} required placeholder="(12) 99999-9999"
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">E-mail</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com"
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Tipo</label>
                  <select value={form.tipoCliente} onChange={set('tipoCliente')}
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-blue-500/50">
                    {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Origem</label>
                  <select value={form.origem} onChange={set('origem')}
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-blue-500/50">
                    <option value="manual">Manual</option>
                    <option value="site">Site</option>
                    <option value="instagram">Instagram</option>
                    <option value="indicacao">Indicação</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Cidade</label>
                <input value={form.cidade} onChange={set('cidade')} placeholder="São José dos Campos"
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Observações</label>
                <textarea value={form.observacoes} onChange={set('observacoes')} rows={2} placeholder="Notas adicionais..."
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface-2 text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
