'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import {
  Copy, Check, Calendar, ChevronRight, PartyPopper, Clock,
  CheckCircle2, XCircle, Star, ArrowLeft, Coins, History,
  TrendingUp, Gift, Gem, Medal, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Roleta } from './Roleta'
import type { Premio } from './Roleta'

/* ── Types ─────────────────────────────────────────────── */
interface Reserva {
  id: string; nome_cliente: string; data_evento: string
  horario_inicio: string; horario_fim: string | null
  endereco_completo: string; valor_total: string | null
  status: string; status_pagamento: string
  cashback_ganho: number; brinquedos_nomes: string
}
interface CashbackItem {
  id: string; tipo: string; valor: number
  percentualAplicado: number | null; descricao: string | null
  eventoId: string | null; createdAt: string
}
interface Cliente {
  nome: string; primeiroNome: string; telefone: string; email?: string
  codigoAcesso: string; cashbackSaldo: number; cashbackTotal: number
  totalEventos: number; membroDesde: string
}
interface GiroItem {
  id: string; premioNome: string; premioDesc: string; createdAt: string
}
interface Props {
  cliente: Cliente
  reservas: Reserva[]
  historicoCashback: CashbackItem[]
  historicoGiros: GiroItem[]
  config: {
    cashbackAtivo: boolean; cashbackPct: number; cashbackMin: number
    roletaAtiva: boolean; roletaMin: number; roletaPremios: Premio[]
  }
  girosDisponiveis: number
}

/* ── Helpers ─────────────────────────────────────────────── */
const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => { const [y, m, dia] = d.split('-'); return `${dia}/${m}/${y}` }
const fmtMes  = (d: string) => new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
const isUpcoming = (d: string) => new Date(d) >= new Date(new Date().toISOString().slice(0, 10))

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  confirmado: { label: 'Confirmado', icon: CheckCircle2, color: '#34D399', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25' },
  realizado:  { label: 'Realizado',  icon: Star,         color: '#818CF8', bg: 'bg-violet-400/10',  border: 'border-violet-400/25'  },
  orcamento:  { label: 'Orçamento',  icon: Clock,        color: '#F59E0B', bg: 'bg-amber-400/10',   border: 'border-amber-400/25'   },
  cancelado:  { label: 'Cancelado',  icon: XCircle,      color: '#F87171', bg: 'bg-red-400/10',     border: 'border-red-400/25'     },
}

function getLoyaltyTier(n: number) {
  if (n >= 8) return { label: 'Diamante', Icon: Gem,   color: '#22D3EE', pct: 8 }
  if (n >= 5) return { label: 'Ouro',     Icon: Star,  color: '#FBBF24', pct: 7 }
  if (n >= 3) return { label: 'Prata',    Icon: Medal, color: '#CBD5E1', pct: 6 }
  if (n >= 1) return { label: 'Bronze',   Icon: Medal, color: '#FB923C', pct: 5 }
  return       { label: 'Novo',           Icon: Star,  color: '#94A3B8', pct: 5 }
}

/* ── Animated number ────────────────────────────────────── */
function AnimNum({ value, prefix = '' }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const obj = { v: 0 }
    gsap.to(obj, {
      v: value, duration: 1.2, ease: 'power2.out',
      onUpdate: () => { if (ref.current) ref.current.textContent = prefix + obj.v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    })
  }, [value, prefix])
  return <span ref={ref}>{prefix}0,00</span>
}

/* ── SVG Ring progress ──────────────────────────────────── */
function RingProgress({ pct, color, size = 120, stroke = 10 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ - dash}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

/* ── CodigoBadge ────────────────────────────────────────── */
function CodigoBadge({ codigo }: { codigo: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(codigo).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={copy} className="group flex items-center gap-2.5 bg-white/5 border border-white/10 hover:border-brand-accent/50 rounded-2xl px-4 py-2.5 transition-all hover:bg-white/8">
      <span className="text-[10px] text-white/40 uppercase tracking-widest">Código</span>
      <span className="font-mono font-black text-white tracking-widest text-sm">{codigo}</span>
      {copied
        ? <Check className="size-3.5 text-emerald-400 shrink-0" />
        : <Copy className="size-3.5 text-white/40 group-hover:text-brand-accent shrink-0 transition-colors" />
      }
    </button>
  )
}

/* ── ReservaCard ────────────────────────────────────────── */
function ReservaCard({ reserva, delay = 0 }: { reserva: Reserva; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const cfg = STATUS_CFG[reserva.status] ?? STATUS_CFG['orcamento']
  const Icon = cfg.icon
  const upcoming = isUpcoming(reserva.data_evento)
  const mes = MESES[Number(reserva.data_evento.split('-')[1]) - 1]

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: delay * 0.08, ease: 'power2.out' })
  }, [delay])

  return (
    <div ref={ref} className={cn(
      'relative bg-white/4 border rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl overflow-hidden',
      upcoming ? 'border-brand-accent/40 bg-brand-accent/5' : 'border-white/8'
    )}>
      {upcoming && <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/70 to-transparent" />}

      <div className="flex items-start gap-4">
        {/* Date box */}
        <div className={cn(
          'shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold border',
          upcoming ? 'bg-brand-accent/20 border-brand-accent/40 text-brand-accent' : 'bg-white/6 border-white/10 text-white/50'
        )}>
          <span className="text-xl leading-none">{reserva.data_evento.split('-')[2]}</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">{mes}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border', cfg.bg, cfg.border)} style={{ color: cfg.color }}>
              <Icon className="size-3" />{cfg.label}
            </span>
            {upcoming && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-brand-accent">
                <PartyPopper className="size-3" />Em breve!
              </span>
            )}
          </div>

          <p className="text-white font-bold text-sm">{reserva.nome_cliente}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {reserva.horario_inicio}{reserva.horario_fim ? ` – ${reserva.horario_fim}` : ''}
            {' · '}{reserva.endereco_completo.slice(0, 45)}{reserva.endereco_completo.length > 45 ? '…' : ''}
          </p>

          {reserva.brinquedos_nomes && (
            <p className="text-white/30 text-xs mt-1 line-clamp-1">🎪 {reserva.brinquedos_nomes}</p>
          )}

          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            {reserva.valor_total && (
              <span className="text-white text-sm font-bold">{fmtBRL(parseFloat(reserva.valor_total))}</span>
            )}
            {reserva.cashback_ganho > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <Gift className="size-3" />+{fmtBRL(reserva.cashback_ganho)} cashback
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────── */
export function AreaClienteDashboard({ cliente, reservas, historicoCashback, historicoGiros, config, girosDisponiveis }: Props) {
  const [tab, setTab] = useState<'reservas' | 'cashback' | 'roleta'>('reservas')
  const [girosLeft, setGirosLeft] = useState(girosDisponiveis)

  const headerRef = useRef<HTMLDivElement>(null)
  const cashbackRef = useRef<HTMLDivElement>(null)

  const proximas = reservas.filter(r => isUpcoming(r.data_evento) && r.status !== 'cancelado')
  const passadas  = reservas.filter(r => !isUpcoming(r.data_evento) || r.status === 'cancelado')
  const tier      = getLoyaltyTier(cliente.totalEventos)
  const TierIcon  = tier.Icon

  const canResgate = cliente.cashbackSaldo >= config.cashbackMin
  const progressPct = config.cashbackMin > 0 ? Math.min((cliente.cashbackSaldo / config.cashbackMin) * 100, 100) : 100

  // Roleta eligibility for badge
  const showRoletaBadge = config.roletaAtiva && girosLeft > 0

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.area-hero',    { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      gsap.fromTo('.area-kpi',    { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, delay: 0.2, ease: 'back.out(1.4)' })
      gsap.fromTo('.area-card',   { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.4, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020817 0%, #0a0f1e 50%, #050d1a 100%)' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        {showRoletaBadge && (
          <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.06) 0%, transparent 70%)' }} />
        )}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Top bar */}
        <div className="flex items-center justify-between area-hero">
          <Link href="/minha-area" className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm">
            <ArrowLeft className="size-4" /> Sair
          </Link>
          <CodigoBadge codigo={cliente.codigoAcesso} />
        </div>

        {/* Hero card */}
        <div ref={headerRef} className="area-hero relative rounded-3xl overflow-hidden border border-white/8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 80% 20%, ${tier.color}18 0%, transparent 60%)` }} />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-white/40 text-sm">Olá,</p>
                <h1 className="text-4xl font-black text-white mt-0.5">{cliente.primeiroNome}! 👋</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                    style={{ color: tier.color, backgroundColor: tier.color + '18', borderColor: tier.color + '35' }}>
                    <TierIcon className="size-3" /> {tier.label}
                  </span>
                  <span className="text-white/30 text-xs">{cliente.totalEventos} {cliente.totalEventos === 1 ? 'festa' : 'festas'}</span>
                </div>
              </div>

              {/* Cashback ring */}
              {config.cashbackAtivo && (
                <div className="relative shrink-0">
                  <RingProgress pct={progressPct} color={canResgate ? '#34D399' : '#3B82F6'} size={90} stroke={8} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-black text-xs tabular-nums leading-none">
                      {Math.round(progressPct)}%
                    </span>
                    <span className="text-white/40 text-[8px] uppercase tracking-wider">saldo</span>
                  </div>
                </div>
              )}
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                { label: 'Festas', val: String(cliente.totalEventos), color: 'white' },
                { label: 'Próximas', val: String(proximas.length), color: '#818CF8' },
                { label: 'Cashback', val: fmtBRL(cliente.cashbackSaldo).replace('R$ ', 'R$'), color: '#34D399' },
              ].map(k => (
                <div key={k.label} className="area-kpi bg-white/4 border border-white/8 rounded-2xl p-3 text-center">
                  <p className="font-black text-lg leading-none" style={{ color: k.color }}>{k.val}</p>
                  <p className="text-white/35 text-[10px] uppercase tracking-wider mt-1">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Roleta teaser */}
            {showRoletaBadge && (
              <button
                onClick={() => setTab('roleta')}
                className="mt-4 w-full flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-3 hover:bg-yellow-400/15 transition-colors group"
              >
                <span className="text-2xl">🎡</span>
                <div className="flex-1 text-left">
                  <p className="text-yellow-400 font-bold text-sm">Você tem {girosLeft} giro{girosLeft !== 1 ? 's' : ''} disponível!</p>
                  <p className="text-yellow-400/60 text-xs">Clique para girar a roleta de prêmios</p>
                </div>
                <ChevronRight className="size-4 text-yellow-400/60 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Cashback saldo card */}
        {config.cashbackAtivo && (
          <div className="area-card relative rounded-3xl overflow-hidden border border-white/8 p-6"
            style={{ background: canResgate ? 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)' : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 100%)' }}>
            <div className={cn('absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent', canResgate ? 'via-emerald-400/50' : 'via-blue-400/50')} />

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Saldo de Cashback</p>
                <p className="text-3xl font-black text-white mt-1 tabular-nums">
                  <AnimNum value={cliente.cashbackSaldo} prefix="R$ " />
                </p>
                <p className="text-white/30 text-xs mt-1">{fmtBRL(cliente.cashbackTotal)} acumulado total · {config.cashbackPct}% por festa</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                style={{ backgroundColor: canResgate ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.15)', borderColor: canResgate ? 'rgba(52,211,153,0.3)' : 'rgba(59,130,246,0.3)' }}>
                <Coins className="size-6" style={{ color: canResgate ? '#34D399' : '#60A5FA' }} />
              </div>
            </div>

            {/* Progress to min resgate */}
            {!canResgate && (
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-white/40 mb-2">
                  <span>Faltam {fmtBRL(config.cashbackMin - cliente.cashbackSaldo)} para resgatar</span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            {canResgate ? (
              <div className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl px-4 py-3">
                <Gift className="size-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-emerald-400 font-bold text-sm">Saldo disponível para resgate!</p>
                  <p className="text-emerald-400/60 text-xs mt-0.5">Fale via WhatsApp e use seu cashback na próxima festa.</p>
                </div>
              </div>
            ) : (
              <p className="text-white/30 text-xs">
                A cada festa realizada você ganha <span className="text-brand-accent font-semibold">{config.cashbackPct}%</span> de volta. Mínimo para resgate: <span className="text-white/60">{fmtBRL(config.cashbackMin)}</span>.
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="area-card flex gap-1 bg-white/4 border border-white/8 rounded-2xl p-1">
          {([
            { id: 'reservas', label: 'Reservas',  icon: Calendar    },
            { id: 'cashback', label: 'Cashback',  icon: TrendingUp  },
            ...(config.roletaAtiva ? [{ id: 'roleta', label: `Roleta${girosLeft > 0 ? ` (${girosLeft})` : ''}`, icon: Star }] : []),
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                tab === t.id
                  ? t.id === 'roleta'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black shadow-lg'
                    : 'bg-brand-accent text-white shadow-lg shadow-brand-accent/25'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Reservas */}
        {tab === 'reservas' && (
          <div className="space-y-4">
            {proximas.length > 0 && (
              <div>
                <p className="text-white/60 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <PartyPopper className="size-3.5 text-brand-accent" /> Próximas festas ({proximas.length})
                </p>
                <div className="space-y-3">
                  {proximas.map((r, i) => <ReservaCard key={r.id} reserva={r} delay={i} />)}
                </div>
              </div>
            )}
            {passadas.length > 0 && (
              <div>
                <p className="text-white/40 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <History className="size-3.5" /> Histórico ({passadas.length})
                </p>
                <div className="space-y-3">
                  {passadas.map((r, i) => <ReservaCard key={r.id} reserva={r} delay={i} />)}
                </div>
              </div>
            )}
            {reservas.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="size-7 text-white/30" />
                </div>
                <p className="text-white font-semibold">Nenhuma reserva ainda</p>
                <p className="text-white/40 text-sm mt-1">Faça sua primeira reserva e ganhe cashback!</p>
                <Link href="/brinquedos"
                  className="inline-flex items-center gap-2 mt-5 bg-brand-accent text-white font-bold px-6 py-3 rounded-2xl hover:bg-brand-accent-hover transition-colors">
                  Ver brinquedos <ChevronRight className="size-4" />
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
              <div className="area-card bg-white/4 border border-white/8 rounded-2xl p-4 text-center">
                <TrendingUp className="size-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-white font-black text-xl tabular-nums">{fmtBRL(cliente.cashbackTotal)}</p>
                <p className="text-white/35 text-xs mt-1">Total acumulado</p>
              </div>
              <div className="area-card bg-white/4 border border-white/8 rounded-2xl p-4 text-center">
                <Coins className="size-5 text-brand-accent mx-auto mb-2" />
                <p className="text-white font-black text-xl tabular-nums">{fmtBRL(cliente.cashbackSaldo)}</p>
                <p className="text-white/35 text-xs mt-1">Disponível</p>
              </div>
            </div>

            {/* Como funciona */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <p className="text-white font-bold text-sm mb-3">Como funciona?</p>
              <div className="space-y-2.5">
                {[
                  { n: 1, text: <>Cada festa <strong className="text-white">realizada</strong> gera <strong className="text-brand-accent">{config.cashbackPct}%</strong> de cashback.</> },
                  { n: 2, text: <>Saldo mínimo para resgate: <strong className="text-white">{fmtBRL(config.cashbackMin)}</strong>.</> },
                  { n: 3, text: 'Fale via WhatsApp e aplique como desconto no próximo evento.' },
                  ...(config.roletaAtiva ? [{ n: 4, text: <>A cada <strong className="text-yellow-400">{fmtBRL(config.roletaMin)}</strong> acumulados ganhe 1 giro na roleta de prêmios! 🎡</> }] : []),
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] font-black flex items-center justify-center shrink-0 mt-px">{s.n}</span>
                    <p className="text-white/50 text-xs leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Extrato */}
            {historicoCashback.length > 0 ? (
              <div>
                <p className="text-white/60 font-bold text-xs uppercase tracking-widest mb-3">Extrato</p>
                <div className="space-y-2">
                  {historicoCashback.map(h => (
                    <div key={h.id} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', h.tipo === 'credito' ? 'bg-emerald-400/10' : 'bg-red-400/10')}>
                        {h.tipo === 'credito'
                          ? <ArrowDownLeft className="size-4 text-emerald-400" />
                          : <ArrowUpRight className="size-4 text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{h.descricao ?? h.tipo}</p>
                        <p className="text-white/30 text-[10px]">{fmtMes(h.createdAt)}</p>
                      </div>
                      <p className={cn('font-black text-sm tabular-nums shrink-0', h.tipo === 'credito' ? 'text-emerald-400' : 'text-red-400')}>
                        {h.tipo === 'credito' ? '+' : ''}{fmtBRL(Math.abs(h.valor))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <Coins className="size-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Nenhum cashback ainda.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Roleta */}
        {tab === 'roleta' && config.roletaAtiva && (
          <div className="space-y-6">
            {girosLeft > 0 ? (
              <Roleta
                premios={config.roletaPremios}
                codigo={cliente.codigoAcesso}
                girosDisponiveis={girosLeft}
                onGiroCompleto={(_, restantes) => setGirosLeft(restantes)}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎡</div>
                <p className="text-white font-bold text-lg">Sem giros no momento</p>
                <p className="text-white/40 text-sm mt-2">
                  A cada <strong className="text-yellow-400">{fmtBRL(config.roletaMin)}</strong> em cashback acumulado você ganha 1 giro!
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Seu total atual: <strong className="text-white/60">{fmtBRL(cliente.cashbackTotal)}</strong>
                </p>
              </div>
            )}

            {/* Histórico de prêmios ganhos */}
            {historicoGiros.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="size-4 text-yellow-400" />
                  <h3 className="text-white font-bold text-sm">Seus prêmios ganhos</h3>
                  <span className="ml-auto bg-yellow-400/15 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {historicoGiros.length} prêmio{historicoGiros.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {historicoGiros.map((g, i) => {
                    const dt = new Date(g.createdAt)
                    const dataFormatada = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
                    // Encontra a cor do prêmio na lista de prêmios configurados
                    const premioConf = config.roletaPremios.find(p => p.nome === g.premioNome)
                    const cor = premioConf?.cor ?? '#FFD700'
                    return (
                      <div key={g.id} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-2xl px-4 py-3"
                        style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: cor + '25', border: `1.5px solid ${cor}50` }}>
                          <Gift className="size-3.5" style={{ color: cor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{g.premioNome}</p>
                          {g.premioDesc && <p className="text-white/40 text-xs truncate">{g.premioDesc}</p>}
                        </div>
                        <span className="text-white/30 text-xs shrink-0">{dataFormatada}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  )
}
