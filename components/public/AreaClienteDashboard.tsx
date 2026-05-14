'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Ticket, Gift, Calendar, ChevronRight, Copy, Check,
  PartyPopper, TrendingUp, Clock, CheckCircle2, XCircle,
  Star, Share2, ArrowLeft, Coins, History, CircleDollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ─────────────────────────────────────────────── */
interface Reserva {
  id: string
  nome_cliente: string
  data_evento: string
  horario_inicio: string
  horario_fim: string | null
  endereco_completo: string
  valor_total: string | null
  status: string
  status_pagamento: string
  cashback_ganho: number
  brinquedos_nomes: string
}

interface CashbackItem {
  id: string
  tipo: string
  valor: number
  percentualAplicado: number | null
  descricao: string | null
  eventoId: string | null
  createdAt: string
}

interface Cliente {
  nome: string; primeiroNome: string; telefone: string; email?: string
  codigoAcesso: string; cashbackSaldo: number; cashbackTotal: number
  totalEventos: number; membroDesde: string
}

interface Props {
  cliente: Cliente
  reservas: Reserva[]
  historicoCashback: CashbackItem[]
  config: { cashbackAtivo: boolean; cashbackPct: number; cashbackMin: number }
}

/* ── Helpers ─────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  confirmado: { label: 'Confirmado',  icon: CheckCircle2, color: '#34D399', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25' },
  realizado:  { label: 'Realizado',   icon: Star,         color: '#818CF8', bg: 'bg-violet-400/10',  border: 'border-violet-400/25'  },
  orcamento:  { label: 'Orçamento',   icon: Clock,        color: '#F59E0B', bg: 'bg-amber-400/10',   border: 'border-amber-400/25'   },
  cancelado:  { label: 'Cancelado',   icon: XCircle,      color: '#F87171', bg: 'bg-red-400/10',     border: 'border-red-400/25'     },
}

function fmtDate(d: string) {
  const [y, m, dia] = d.split('-')
  return `${dia}/${m}/${y}`
}
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}
function fmtMes(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
function isUpcoming(d: string) {
  return new Date(d) >= new Date(new Date().toISOString().slice(0, 10))
}

/* ── Sub-components ─────────────────────────────────────── */
function CodigoBadge({ codigo }: { codigo: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(codigo).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="group flex items-center gap-2 bg-brand-surface-2 border border-brand-border hover:border-brand-accent rounded-xl px-4 py-2.5 transition-all"
    >
      <span className="font-mono font-bold text-brand-text tracking-widest text-sm">{codigo}</span>
      {copied
        ? <Check className="size-3.5 text-emerald-400" />
        : <Copy className="size-3.5 text-brand-muted group-hover:text-brand-accent transition-colors" />
      }
    </button>
  )
}

function CashbackCard({ saldo, total, pct, min, ativo }: {
  saldo: number; total: number; pct: number; min: number; ativo: boolean
}) {
  const canRedeem = saldo >= min
  const progress  = min > 0 ? Math.min((saldo / min) * 100, 100) : 100

  if (!ativo) return null
  return (
    <div className="relative bg-brand-surface border border-brand-border rounded-3xl p-6 overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/8 via-transparent to-violet-500/5 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-brand-muted text-xs uppercase tracking-widest font-semibold">Saldo de Cashback</p>
          <p className="text-4xl font-extrabold text-brand-text mt-1 tabular-nums">{fmtBRL(saldo)}</p>
          <p className="text-brand-muted text-xs mt-1">{fmtBRL(total)} acumulado no total</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-accent/15 border border-brand-accent/25 flex items-center justify-center">
          <Coins className="size-6 text-brand-accent" />
        </div>
      </div>

      {/* Barra de progresso até resgate */}
      {!canRedeem && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-brand-muted mb-1.5">
            <span>Faltam {fmtBRL(min - saldo)} para resgatar</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-brand-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--color-brand-accent), #818CF8)' }}
            />
          </div>
        </div>
      )}

      {canRedeem ? (
        <div className="flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/25 rounded-xl px-4 py-3">
          <Gift className="size-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-400 font-bold text-sm">Saldo disponível para resgate!</p>
            <p className="text-emerald-400/70 text-xs">Fale conosco via WhatsApp para usar seu cashback.</p>
          </div>
        </div>
      ) : (
        <p className="text-brand-muted text-xs">
          Você ganha <span className="text-brand-accent font-semibold">{pct}%</span> de cashback em cada festa realizada.
        </p>
      )}
    </div>
  )
}

function ReservaCard({ reserva }: { reserva: Reserva }) {
  const cfg = STATUS_CFG[reserva.status] ?? STATUS_CFG['orcamento']
  const Icon = cfg.icon
  const upcoming = isUpcoming(reserva.data_evento)

  return (
    <div className={cn(
      'relative bg-brand-surface border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg overflow-hidden',
      upcoming ? 'border-brand-accent/30' : 'border-brand-border'
    )}>
      {upcoming && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent" />
      )}

      <div className="flex items-start gap-4">
        {/* Data */}
        <div className={cn(
          'shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-bold',
          upcoming ? 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent' : 'bg-brand-surface-2 border-brand-border text-brand-muted'
        )}>
          <span className="text-lg leading-none">{reserva.data_evento.split('-')[2]}</span>
          <span className="text-[10px] uppercase tracking-wider mt-0.5">
            {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][Number(reserva.data_evento.split('-')[1]) - 1]}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.bg, cfg.border)} style={{ color: cfg.color }}>
              <Icon className="size-3" />
              {cfg.label}
            </span>
            {upcoming && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/25 text-brand-accent">
                <PartyPopper className="size-3" />
                Em breve!
              </span>
            )}
          </div>

          <p className="text-brand-text font-bold">{reserva.nome_cliente}</p>
          <p className="text-brand-muted text-xs mt-1">
            {reserva.horario_inicio}
            {reserva.horario_fim ? ` – ${reserva.horario_fim}` : ''}
            {' · '}{reserva.endereco_completo.slice(0, 50)}{reserva.endereco_completo.length > 50 ? '…' : ''}
          </p>

          {reserva.brinquedos_nomes && (
            <p className="text-brand-muted text-xs mt-1.5 line-clamp-1">
              🎪 {reserva.brinquedos_nomes}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {reserva.valor_total && (
              <span className="text-brand-text text-sm font-semibold">
                {fmtBRL(parseFloat(reserva.valor_total))}
              </span>
            )}
            {reserva.cashback_ganho > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <Gift className="size-3" />
                +{fmtBRL(reserva.cashback_ganho)} cashback
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────── */
export function AreaClienteDashboard({ cliente, reservas, historicoCashback, config }: Props) {
  const [tab, setTab] = useState<'reservas' | 'cashback'>('reservas')

  const proximas  = reservas.filter(r => isUpcoming(r.data_evento) && r.status !== 'cancelado')
  const passadas  = reservas.filter(r => !isUpcoming(r.data_evento) || r.status === 'cancelado')
  const mesesDesde = Math.max(1, Math.round((Date.now() - new Date(cliente.membroDesde).getTime()) / (30 * 86400000)))

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-accent/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/minha-area" className="flex items-center gap-2 text-brand-muted hover:text-brand-text transition-colors text-sm">
            <ArrowLeft className="size-4" />
            Sair
          </Link>
          <div className="flex items-center gap-2">
            <Share2 className="size-4 text-brand-muted" />
            <span className="text-brand-muted text-xs">Compartilhar</span>
          </div>
        </div>

        {/* Boas-vindas */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-brand-muted text-sm">Olá,</p>
              <h1 className="text-brand-text text-3xl font-extrabold">{cliente.primeiroNome}! 👋</h1>
              <p className="text-brand-muted text-xs mt-1">
                Cliente há {mesesDesde} {mesesDesde === 1 ? 'mês' : 'meses'} · {cliente.totalEventos} {cliente.totalEventos === 1 ? 'festa' : 'festas'}
              </p>
            </div>
            <CodigoBadge codigo={cliente.codigoAcesso} />
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-brand-surface-2 rounded-2xl p-3 text-center border border-brand-border">
              <p className="text-brand-text font-extrabold text-xl tabular-nums">{cliente.totalEventos}</p>
              <p className="text-brand-muted text-[10px] uppercase tracking-wider mt-0.5">Festas</p>
            </div>
            <div className="bg-brand-surface-2 rounded-2xl p-3 text-center border border-brand-border">
              <p className="text-brand-text font-extrabold text-xl tabular-nums">{proximas.length}</p>
              <p className="text-brand-muted text-[10px] uppercase tracking-wider mt-0.5">Próximas</p>
            </div>
            <div className="bg-brand-surface-2 rounded-2xl p-3 text-center border border-brand-border">
              <p className="text-emerald-400 font-extrabold text-xl tabular-nums">
                {fmtBRL(cliente.cashbackSaldo).replace('R$ ', 'R$')}
              </p>
              <p className="text-brand-muted text-[10px] uppercase tracking-wider mt-0.5">Cashback</p>
            </div>
          </div>
        </div>

        {/* Cashback Card */}
        {config.cashbackAtivo && (
          <CashbackCard
            saldo={cliente.cashbackSaldo}
            total={cliente.cashbackTotal}
            pct={config.cashbackPct}
            min={config.cashbackMin}
            ativo={config.cashbackAtivo}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-2xl p-1">
          {([
            { id: 'reservas',  label: 'Minhas Reservas', icon: Calendar },
            { id: 'cashback',  label: 'Cashback',        icon: TrendingUp },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                tab === t.id
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/25'
                  : 'text-brand-muted hover:text-brand-text'
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Reservas */}
        {tab === 'reservas' && (
          <div className="space-y-5">

            {/* Próximas festas */}
            {proximas.length > 0 && (
              <div>
                <p className="text-brand-text font-bold text-sm mb-3 flex items-center gap-2">
                  <PartyPopper className="size-4 text-brand-accent" />
                  Próximas festas ({proximas.length})
                </p>
                <div className="space-y-3">
                  {proximas.map(r => <ReservaCard key={r.id} reserva={r} />)}
                </div>
              </div>
            )}

            {/* Histórico */}
            {passadas.length > 0 && (
              <div>
                <p className="text-brand-text font-bold text-sm mb-3 flex items-center gap-2">
                  <History className="size-4 text-brand-muted" />
                  Histórico ({passadas.length})
                </p>
                <div className="space-y-3">
                  {passadas.map(r => <ReservaCard key={r.id} reserva={r} />)}
                </div>
              </div>
            )}

            {reservas.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-3xl bg-brand-surface-2 border border-brand-border flex items-center justify-center mx-auto mb-4">
                  <Ticket className="size-7 text-brand-muted" />
                </div>
                <p className="text-brand-text font-semibold">Nenhuma reserva ainda</p>
                <p className="text-brand-muted text-sm mt-1">Faça sua primeira reserva e ganhe cashback!</p>
                <Link
                  href="/brinquedos"
                  className="inline-flex items-center gap-2 mt-4 bg-brand-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-accent-hover transition-colors"
                >
                  Ver brinquedos
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab: Cashback */}
        {tab === 'cashback' && (
          <div className="space-y-4">

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 text-center">
                <CircleDollarSign className="size-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-brand-text font-extrabold text-xl tabular-nums">{fmtBRL(cliente.cashbackTotal)}</p>
                <p className="text-brand-muted text-xs mt-1">Total acumulado</p>
              </div>
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 text-center">
                <Gift className="size-6 text-brand-accent mx-auto mb-2" />
                <p className="text-brand-text font-extrabold text-xl tabular-nums">{fmtBRL(cliente.cashbackSaldo)}</p>
                <p className="text-brand-muted text-xs mt-1">Disponível</p>
              </div>
            </div>

            {/* Regras */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 space-y-2">
              <p className="text-brand-text font-bold text-sm">Como funciona?</p>
              <div className="space-y-2 text-xs text-brand-muted">
                <div className="flex items-start gap-2"><span className="text-brand-accent font-bold shrink-0">1.</span><span>A cada festa <strong className="text-brand-text">realizada</strong>, você ganha <strong className="text-brand-accent">{config.cashbackPct}%</strong> do valor total de cashback.</span></div>
                <div className="flex items-start gap-2"><span className="text-brand-accent font-bold shrink-0">2.</span><span>O saldo mínimo para resgate é <strong className="text-brand-text">{fmtBRL(config.cashbackMin)}</strong>.</span></div>
                <div className="flex items-start gap-2"><span className="text-brand-accent font-bold shrink-0">3.</span><span>Para resgatar, fale com a gente via WhatsApp e aplique no próximo evento.</span></div>
              </div>
            </div>

            {/* Histórico de transações */}
            {historicoCashback.length > 0 ? (
              <div>
                <p className="text-brand-text font-bold text-sm mb-3">Extrato</p>
                <div className="space-y-2">
                  {historicoCashback.map(h => (
                    <div key={h.id} className="flex items-center gap-3 bg-brand-surface border border-brand-border rounded-xl px-4 py-3">
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                        h.tipo === 'credito' ? 'bg-emerald-400/10' : 'bg-red-400/10'
                      )}>
                        {h.tipo === 'credito'
                          ? <TrendingUp className="size-4 text-emerald-400" />
                          : <CircleDollarSign className="size-4 text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-brand-text text-sm font-medium truncate">{h.descricao ?? h.tipo}</p>
                        <p className="text-brand-muted text-xs">{fmtMes(h.createdAt)}</p>
                      </div>
                      <p className={cn(
                        'font-bold text-sm tabular-nums shrink-0',
                        h.tipo === 'credito' ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {h.tipo === 'credito' ? '+' : '-'}{fmtBRL(h.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Coins className="size-10 text-brand-muted mx-auto mb-3 opacity-40" />
                <p className="text-brand-muted text-sm">Nenhum cashback ainda.</p>
                <p className="text-brand-muted text-xs mt-1">Complete sua primeira festa para começar a acumular!</p>
              </div>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
