'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Gift, Plus, Trash2, Edit3, Save, X, Loader2, ExternalLink, Star, Clock, Key, Send, Copy, Check, Coins, AlertCircle, Dices } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { useConfetti } from '@/hooks/useConfetti'

type DataComecorativa = {
  id: string; nome: string; relacao: string; dataNasc: string; anoNasc: number | null; observacoes: string | null
}

type Cliente = {
  id: string; nome: string; telefone: string; email: string | null
  cpf: string | null; dataNascimento: string | null
  endereco: string | null; cidade: string | null
  origem: string | null; tipoCliente: string | null; nomeEmpresa: string | null
  observacoes: string | null; ativo: boolean
  totalEventos: number; ultimoEvento: string | null
  codigoAcesso?: string | null
  cashbackSaldo?: number
  cashbackTotal?: number
  girosDisponiveis?: number
  girosBonus?: number
  createdAt: string
  datasComecorativas: DataComecorativa[]
}

type Evento = {
  id: string; nomeCliente: string; dataEvento: string; horarioInicio: string
  status: string; statusPagamento: string
  valorTotal: string | null; enderecoCompleto: string
}

interface Props {
  cliente: Cliente
  eventos: Evento[]
}

const STATUS_COLOR: Record<string, string> = {
  orcamento: '#6B7280', confirmado: '#3B82F6', realizado: '#10B981', cancelado: '#EF4444',
}

const STATUS_PAG_COLOR: Record<string, string> = {
  pendente: '#F59E0B', parcial: '#3B82F6', pago: '#10B981', cancelado: '#EF4444',
}

const TIPO_LABEL: Record<string, string> = {
  fisica: 'Pessoa Física', empresa: 'Empresa', cerimonialista: 'Cerimonialista', locador: 'Locador',
}

const RELACAO_OPTIONS = ['filho', 'filha', 'conjuge', 'proprio', 'mae', 'pai', 'neto', 'neta', 'sobrinho', 'sobrinha', 'amigo', 'outro']

export function ClienteDetailClient({ cliente: initial, eventos }: Props) {
  const [cliente, setCliente] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    nome: initial.nome, telefone: initial.telefone, email: initial.email ?? '',
    cpf: initial.cpf ?? '', dataNascimento: initial.dataNascimento ?? '',
    endereco: initial.endereco ?? '', cidade: initial.cidade ?? '',
    tipoCliente: initial.tipoCliente ?? 'fisica', nomeEmpresa: initial.nomeEmpresa ?? '',
    observacoes: initial.observacoes ?? '',
  })

  // Datas comemorativas
  const [showAddData, setShowAddData] = useState(false)
  const [dataForm, setDataForm] = useState({ nome: '', relacao: 'filho', dataNasc: '', anoNasc: '', observacoes: '' })
  const [savingData, setSavingData] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setEditForm(f => ({ ...f, [k]: e.target.value }))

  const setD = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDataForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clientes/${cliente.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCliente(c => ({ ...c, ...updated }))
      setEditing(false)
      toast.success('Cliente atualizado!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataForm.nome || !dataForm.dataNasc) { toast.error('Nome e data são obrigatórios'); return }
    setSavingData(true)
    try {
      const res = await fetch(`/api/admin/clientes/${cliente.id}/datas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: dataForm.nome, relacao: dataForm.relacao,
          dataNasc: dataForm.dataNasc,
          anoNasc: dataForm.anoNasc ? Number(dataForm.anoNasc) : null,
          observacoes: dataForm.observacoes || null,
        }),
      })
      if (!res.ok) throw new Error()
      const nova = await res.json()
      setCliente(c => ({ ...c, datasComecorativas: [...c.datasComecorativas, nova] }))
      setDataForm({ nome: '', relacao: 'filho', dataNasc: '', anoNasc: '', observacoes: '' })
      setShowAddData(false)
      toast.success('Data comemorativa adicionada!')
    } catch { toast.error('Erro ao adicionar data') }
    finally { setSavingData(false) }
  }

  const handleDeleteData = async (id: string) => {
    if (!confirm('Remover esta data comemorativa?')) return
    try {
      await fetch(`/api/admin/clientes/${id}/datas`, { method: 'DELETE' })
      setCliente(c => ({ ...c, datasComecorativas: c.datasComecorativas.filter(d => d.id !== id) }))
      toast.success('Data removida')
    } catch { toast.error('Erro ao remover') }
  }

  // Área do Cliente — código de acesso
  const [codigoAcesso, setCodigoAcesso] = useState(cliente.codigoAcesso ?? null)
  const [enviandoCodigo, setEnviandoCodigo] = useState(false)
  const [codigoCopiado, setCodigoCopiado] = useState(false)

  // Cashback — saldo e resgate (decimal do DB chega como string)
  const [cashbackSaldo, setCashbackSaldo] = useState(parseFloat(String(cliente.cashbackSaldo ?? '0')))
  const [cashbackTotal] = useState(parseFloat(String(cliente.cashbackTotal ?? '0')))
  const [showResgate, setShowResgate] = useState(false)
  const [resgateValor, setResgateValor] = useState('')
  const [resgateDesc, setResgateDesc] = useState('')
  const [resgatando, setResgatando] = useState(false)

  // Roleta — giros extras
  const [girosDisponiveis, setGirosDisponiveis] = useState(cliente.girosDisponiveis ?? 0)
  const [showDarGiros, setShowDarGiros] = useState(false)
  const [qtyGiros, setQtyGiros] = useState(1)
  const [dandoGiros, setDandoGiros] = useState(false)

  const { fire: fireConfetti } = useConfetti()

  const handleResgate = async (e: React.FormEvent) => {
    e.preventDefault()
    const valor = parseFloat(resgateValor.replace(',', '.'))
    if (!valor || valor <= 0) { toast.error('Informe um valor válido'); return }
    if (valor > cashbackSaldo) { toast.error(`Saldo insuficiente (R$ ${cashbackSaldo.toFixed(2)})`); return }
    setResgatando(true)
    try {
      const res = await fetch(`/api/admin/clientes/${cliente.id}/resgate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor, descricao: resgateDesc || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao resgatar')
      setCashbackSaldo(data.novoSaldo)
      setShowResgate(false)
      setResgateValor('')
      setResgateDesc('')
      toast.success(`R$ ${valor.toFixed(2)} resgatados! Novo saldo: R$ ${data.novoSaldo.toFixed(2)}`)
      fireConfetti('cashback')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao resgatar')
    } finally { setResgatando(false) }
  }

  const handleDarGiros = async () => {
    if (qtyGiros < 1) return
    setDandoGiros(true)
    try {
      const res = await fetch(`/api/admin/clientes/${cliente.id}/giros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidade: qtyGiros }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao dar giros')
      setGirosDisponiveis(data.girosDisponiveis)
      setShowDarGiros(false)
      setQtyGiros(1)
      toast.success(`🎡 ${qtyGiros} giro${qtyGiros > 1 ? 's' : ''} adicionado${qtyGiros > 1 ? 's' : ''} para ${cliente.nome}!`)
      fireConfetti('sides')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao dar giros')
    } finally { setDandoGiros(false) }
  }

  const handleEnviarCodigo = async () => {
    setEnviandoCodigo(true)
    try {
      const res = await fetch(`/api/admin/clientes/${cliente.id}/codigo`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setCodigoAcesso(data.codigo)
      toast.success(data.enviado ? 'Código enviado via WhatsApp!' : `Código gerado: ${data.codigo}`)
    } catch { toast.error('Erro ao gerar código') }
    finally { setEnviandoCodigo(false) }
  }

  const handleCopiarCodigo = () => {
    if (!codigoAcesso) return
    navigator.clipboard.writeText(codigoAcesso)
    setCodigoCopiado(true)
    setTimeout(() => setCodigoCopiado(false), 2000)
  }

  const whatsappLink = `https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-10">
      {/* Back */}
      <Link href="/admin/clientes" className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-text text-sm transition-colors">
        <ArrowLeft size={14} /> Voltar para clientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white bg-blue-500/20 border border-blue-500/30 text-blue-400">
            {cliente.nome.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-text">{cliente.nome}</h1>
            <p className="text-sm text-brand-muted">{TIPO_LABEL[cliente.tipoCliente ?? 'fisica'] ?? cliente.tipoCliente}</p>
            <div className="flex items-center gap-3 mt-1">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors">
                <Phone size={11} /> {cliente.telefone}
              </a>
              {cliente.email && (
                <span className="flex items-center gap-1 text-xs text-brand-muted">
                  <Mail size={11} /> {cliente.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="w-9 h-9 rounded-xl bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-brand-text text-sm px-4 py-2 rounded-xl transition-colors">
              <Edit3 size={14} /> Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dados do cliente */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <h2 className="font-semibold text-brand-text mb-4 text-sm">Informações</h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: 'nome', l: 'Nome', type: 'text', span: 2 },
                  { k: 'telefone', l: 'Telefone', type: 'text', span: 1 },
                  { k: 'email', l: 'E-mail', type: 'email', span: 1 },
                  { k: 'cpf', l: 'CPF', type: 'text', span: 1 },
                  { k: 'dataNascimento', l: 'Data de Nascimento', type: 'date', span: 1 },
                  { k: 'endereco', l: 'Endereço', type: 'text', span: 2 },
                  { k: 'cidade', l: 'Cidade', type: 'text', span: 1 },
                  { k: 'nomeEmpresa', l: 'Nome da empresa', type: 'text', span: 1 },
                ].map(f => (
                  <div key={f.k} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-brand-muted mb-1.5">{f.l}</label>
                    <input type={f.type} value={(editForm as Record<string, string>)[f.k]} onChange={set(f.k)}
                      className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Tipo</label>
                  <select value={editForm.tipoCliente} onChange={set('tipoCliente')}
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none">
                    {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Observações</label>
                  <textarea value={editForm.observacoes} onChange={set('observacoes')} rows={3}
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                  />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { l: 'Telefone', v: <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 flex items-center gap-1">{cliente.telefone} <ExternalLink size={10} /></a> },
                  { l: 'E-mail', v: cliente.email },
                  { l: 'CPF', v: cliente.cpf },
                  { l: 'Nascimento', v: cliente.dataNascimento ? new Date(cliente.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : null },
                  { l: 'Endereço', v: cliente.endereco },
                  { l: 'Cidade', v: cliente.cidade },
                  { l: 'Tipo', v: TIPO_LABEL[cliente.tipoCliente ?? 'fisica'] },
                  { l: 'Origem', v: cliente.origem },
                  { l: 'Empresa', v: cliente.nomeEmpresa },
                  { l: 'Cliente desde', v: new Date(cliente.createdAt).toLocaleDateString('pt-BR') },
                ].filter(d => d.v).map(d => (
                  <div key={d.l}>
                    <dt className="text-xs text-brand-muted mb-0.5">{d.l}</dt>
                    <dd className="text-brand-text font-medium">{d.v as React.ReactNode}</dd>
                  </div>
                ))}
                {cliente.observacoes && (
                  <div className="col-span-2">
                    <dt className="text-xs text-brand-muted mb-0.5">Observações</dt>
                    <dd className="text-brand-text text-sm">{cliente.observacoes}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Histórico de eventos */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-text text-sm flex items-center gap-2">
                <Star size={14} className="text-yellow-400" /> Histórico de Eventos
              </h2>
              <span className="text-xs text-brand-muted bg-brand-surface-2 px-2.5 py-1 rounded-lg border border-brand-border">
                {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
              </span>
            </div>
            {eventos.length === 0 ? (
              <p className="text-center text-brand-muted text-sm py-8">Nenhum evento encontrado para este cliente</p>
            ) : (
              <div className="space-y-2">
                {eventos.map(ev => (
                  <Link key={ev.id} href={`/admin/eventos/${ev.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface-2 hover:bg-brand-surface border border-brand-border hover:border-blue-500/30 transition-all group">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[ev.status] ?? '#6B7280' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-text group-hover:text-blue-400 transition-colors truncate">{ev.nomeCliente}</span>
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: STATUS_PAG_COLOR[ev.statusPagamento] + '20', color: STATUS_PAG_COLOR[ev.statusPagamento] }}>
                          {ev.statusPagamento}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-brand-muted flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(ev.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-brand-muted flex items-center gap-1">
                          <Clock size={10} /> {ev.horarioInicio}
                        </span>
                      </div>
                    </div>
                    {ev.valorTotal && (
                      <span className="text-sm font-bold text-green-400 flex-shrink-0">
                        {formatCurrency(Number(ev.valorTotal))}
                      </span>
                    )}
                    <ExternalLink size={14} className="text-brand-muted group-hover:text-blue-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área do Cliente */}
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <h2 className="font-semibold text-brand-text text-sm flex items-center gap-2 mb-4">
              <Key size={14} className="text-brand-accent" /> Área do Cliente
            </h2>

            {/* Cashback KPIs */}
            {(cashbackSaldo > 0 || cashbackTotal > 0) && (
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-emerald-400 font-bold text-lg tabular-nums">
                      R$ {cashbackSaldo.toFixed(2)}
                    </p>
                    <p className="text-brand-muted text-[10px] mt-0.5">Saldo disponível</p>
                  </div>
                  <div className="bg-brand-surface-2 border border-brand-border rounded-xl p-3 text-center">
                    <p className="text-brand-text font-bold text-lg tabular-nums">
                      R$ {cashbackTotal.toFixed(2)}
                    </p>
                    <p className="text-brand-muted text-[10px] mt-0.5">Total acumulado</p>
                  </div>
                </div>

                {/* Botão Resgatar */}
                {cashbackSaldo > 0 && !showResgate && (
                  <button
                    onClick={() => setShowResgate(true)}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    <Coins size={13} />
                    Usar como desconto / pagamento
                  </button>
                )}

                {/* Modal inline de resgate */}
                {showResgate && (
                  <form onSubmit={handleResgate} className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <Coins size={13} /> Resgatar cashback
                      </p>
                      <button type="button" onClick={() => { setShowResgate(false); setResgateValor(''); setResgateDesc('') }}
                        className="text-brand-muted hover:text-brand-text transition-colors">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-500/8 rounded-lg px-3 py-1.5">
                      <AlertCircle size={11} className="text-amber-400 shrink-0" />
                      <p className="text-[10px] text-amber-300">Saldo disponível: <strong>R$ {cashbackSaldo.toFixed(2)}</strong></p>
                    </div>

                    <div>
                      <label className="text-[10px] text-brand-muted mb-1 block">Valor a resgatar (R$)</label>
                      <div className="flex gap-2">
                        <input
                          type="number" step="0.01" min="0.01" max={cashbackSaldo}
                          value={resgateValor}
                          onChange={e => setResgateValor(e.target.value)}
                          placeholder="0,00"
                          className="flex-1 bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2 text-sm font-mono text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-amber-500/50"
                          required
                        />
                        <button type="button" onClick={() => setResgateValor(cashbackSaldo.toFixed(2))}
                          className="text-[10px] font-semibold px-3 rounded-xl bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-brand-text transition-colors whitespace-nowrap">
                          Tudo
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-brand-muted mb-1 block">Observação (opcional)</label>
                      <input
                        type="text"
                        value={resgateDesc}
                        onChange={e => setResgateDesc(e.target.value)}
                        placeholder="ex: desconto na festa de junho"
                        className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <button
                      type="submit" disabled={resgatando}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                      {resgatando ? <Loader2 size={13} className="animate-spin" /> : <Coins size={13} />}
                      Confirmar resgate
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Roleta — giros extras */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-brand-muted text-xs font-medium flex items-center gap-1.5">
                  <Dices size={12} className="text-yellow-400" /> Roleta de prêmios
                </p>
                <span className="text-yellow-400 font-bold text-sm tabular-nums">
                  {girosDisponiveis} giro{girosDisponiveis !== 1 ? 's' : ''} disponível{girosDisponiveis !== 1 ? 'is' : ''}
                </span>
              </div>

              {!showDarGiros ? (
                <button
                  onClick={() => setShowDarGiros(true)}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400/40 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <Dices size={13} />
                  Dar giro(s) extra na roleta
                </button>
              ) : (
                <div className="bg-yellow-400/5 border border-yellow-400/25 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
                      <Dices size={13} /> Giros extras
                    </p>
                    <button type="button" onClick={() => setShowDarGiros(false)} className="text-brand-muted hover:text-brand-text transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-muted mb-1.5 block">Quantos giros dar?</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQtyGiros(q => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl bg-brand-surface-2 border border-brand-border text-brand-text font-bold hover:border-yellow-400/40 transition-colors flex items-center justify-center text-lg"
                      >−</button>
                      <span className="flex-1 text-center text-2xl font-black text-yellow-400 tabular-nums">{qtyGiros}</span>
                      <button
                        type="button"
                        onClick={() => setQtyGiros(q => Math.min(20, q + 1))}
                        className="w-9 h-9 rounded-xl bg-brand-surface-2 border border-brand-border text-brand-text font-bold hover:border-yellow-400/40 transition-colors flex items-center justify-center text-lg"
                      >+</button>
                    </div>
                  </div>
                  <button
                    onClick={handleDarGiros}
                    disabled={dandoGiros}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    {dandoGiros ? <Loader2 size={13} className="animate-spin" /> : <Dices size={13} />}
                    Confirmar — dar {qtyGiros} giro{qtyGiros > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>

            {/* Código de acesso */}
            {codigoAcesso ? (
              <div className="space-y-3">
                <div>
                  <p className="text-brand-muted text-xs mb-1.5">Código de acesso</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 font-mono font-bold text-brand-text tracking-widest text-sm text-center">
                      {codigoAcesso}
                    </div>
                    <button
                      onClick={handleCopiarCodigo}
                      className="w-10 h-10 rounded-xl bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 flex items-center justify-center transition-colors"
                    >
                      {codigoCopiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEnviarCodigo}
                    disabled={enviandoCodigo}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-600/10 border border-green-600/20 text-green-400 hover:bg-green-600/20 text-xs font-semibold py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {enviandoCodigo ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Reenviar via WhatsApp
                  </button>
                  <a
                    href={`/minha-area/${codigoAcesso}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-brand-accent flex items-center justify-center transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-brand-muted text-xs mb-3">Cliente ainda não tem código de acesso</p>
                <button
                  onClick={handleEnviarCodigo}
                  disabled={enviandoCodigo}
                  className="flex items-center justify-center gap-2 w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {enviandoCodigo ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Gerar e enviar código
                </button>
              </div>
            )}
          </div>

          {/* Datas comemorativas */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-text text-sm flex items-center gap-2">
                <Gift size={14} className="text-pink-400" /> Aniversários
              </h2>
              <button onClick={() => setShowAddData(!showAddData)}
                className="w-7 h-7 rounded-lg bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-blue-400 hover:border-blue-500/30 flex items-center justify-center transition-colors">
                <Plus size={13} />
              </button>
            </div>

            {/* Add form */}
            {showAddData && (
              <form onSubmit={handleAddData} className="mb-4 p-3 bg-brand-surface-2 border border-brand-border rounded-xl space-y-2.5">
                <div>
                  <label className="text-xs font-medium text-brand-muted mb-1 block">Nome *</label>
                  <input value={dataForm.nome} onChange={setD('nome')} required placeholder="Nome do aniversariante"
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-2.5 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-brand-muted mb-1 block">Relação</label>
                    <select value={dataForm.relacao} onChange={setD('relacao')}
                      className="w-full bg-brand-surface border border-brand-border rounded-lg px-2.5 py-2 text-xs text-brand-text focus:outline-none">
                      {RELACAO_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-brand-muted mb-1 block">Ano de nasc.</label>
                    <input type="number" value={dataForm.anoNasc} onChange={setD('anoNasc')} placeholder="2020"
                      min="1920" max={new Date().getFullYear()}
                      className="w-full bg-brand-surface border border-brand-border rounded-lg px-2.5 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-muted mb-1 block">Data de nasc. *</label>
                  <input type="date" value={dataForm.dataNasc} onChange={setD('dataNasc')} required
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-2.5 py-2 text-xs text-brand-text focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddData(false)} className="flex-1 py-1.5 text-xs rounded-lg border border-brand-border text-brand-muted hover:bg-brand-surface">Cancelar</button>
                  <button type="submit" disabled={savingData} className="flex-1 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-1">
                    {savingData ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Adicionar
                  </button>
                </div>
              </form>
            )}

            {cliente.datasComecorativas.length === 0 ? (
              <p className="text-center text-brand-muted text-xs py-6">Nenhuma data cadastrada</p>
            ) : (
              <div className="space-y-2">
                {cliente.datasComecorativas.map(d => {
                  const data = new Date(d.dataNasc + 'T00:00:00')
                  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
                  const getProxAno = () => {
                    const thisYear = new Date(hoje.getFullYear(), data.getMonth(), data.getDate())
                    return thisYear >= hoje ? thisYear : new Date(hoje.getFullYear() + 1, data.getMonth(), data.getDate())
                  }
                  const prox = getProxAno()
                  const dias = Math.round((prox.getTime() - hoje.getTime()) / 86400000)
                  const idadeAgora = d.anoNasc ? hoje.getFullYear() - d.anoNasc - (hoje < new Date(hoje.getFullYear(), data.getMonth(), data.getDate()) ? 0 : 0) : null
                  return (
                    <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-brand-surface-2 border border-brand-border group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-pink-400 bg-pink-500/10 flex-shrink-0">
                        <Gift size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-text truncate">{d.nome}</p>
                        <p className="text-xs text-brand-muted">
                          {d.relacao} · {data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          {d.anoNasc && ` · ${idadeAgora} anos`}
                        </p>
                        <p className="text-xs text-pink-400">
                          {dias === 0 ? '🎂 Hoje!' : `Em ${dias} dia${dias !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteData(d.id)}
                        className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 text-brand-muted hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        {/* fim coluna direita */}
      </div>
    </div>
  )
}
