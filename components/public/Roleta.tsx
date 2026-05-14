'use client'

import { useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'
import { useConfetti } from '@/hooks/useConfetti'

export interface Premio {
  id: string; nome: string; descricao: string; cor: string; peso: number
  valorCredito?: number    // fixo: credita este R$ ao ganhar
  percentual?: number      // percentual: credita X% do cashbackTotal do cliente
  tipo?: 'fixo' | 'percentual'  // default 'fixo'
}

interface Props {
  premios: Premio[]
  codigo: string
  girosDisponiveis: number
  onGiroCompleto?: (premio: Premio, girosRestantes: number) => void
}

/* ── SVG Wheel ──────────────────────────────────────────── */
function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function buildSegmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = polarToXY(cx, cy, r, startAngle)
  const e = polarToXY(cx, cy, r, endAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${large} 1 ${e.x},${e.y} Z`
}

function WheelSVG({ premios, spinning }: { premios: Premio[]; spinning: boolean }) {
  const cx = 150; const cy = 150; const R = 138; const Ri = 30
  const n = premios.length
  const slice = 360 / n

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl" aria-label="Roleta de prêmios">
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={R + 6} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />

      {/* Segments */}
      {premios.map((p, i) => {
        const start = i * slice
        const end = (i + 1) * slice
        const mid = start + slice / 2
        const textR = R * 0.65
        const t = polarToXY(cx, cy, textR, mid)
        const smallSlice = slice < 45

        return (
          <g key={p.id}>
            <path
              d={buildSegmentPath(cx, cy, R, start, end)}
              fill={p.cor}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="1.5"
              className={cn(spinning ? '' : 'transition-opacity hover:opacity-90')}
            />
            {/* Segment label */}
            <text
              x={t.x} y={t.y}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${mid}, ${t.x}, ${t.y})`}
              fill="white"
              fontSize={smallSlice ? '7' : '9'}
              fontWeight="700"
              fontFamily="system-ui"
              style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              {p.nome.length > 12 ? p.nome.slice(0, 11) + '…' : p.nome}
            </text>
          </g>
        )
      })}

      {/* Dividers */}
      {premios.map((_, i) => {
        const angle = i * slice
        const p1 = polarToXY(cx, cy, Ri, angle)
        const p2 = polarToXY(cx, cy, R, angle)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
      })}

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={Ri} fill="#1e293b" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={Ri - 8} fill="rgba(255,255,255,0.05)" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="system-ui">
        TWIX
      </text>
    </svg>
  )
}

/* ── Prize Modal ────────────────────────────────────────── */
function PrizeModal({ premio, valorCreditado, onClose }: { premio: Premio; valorCreditado: number; onClose: () => void }) {
  const fmtR = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative bg-[#0f172a] border-2 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-prize-in"
        style={{ borderColor: premio.cor + '60' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-3xl" style={{ background: `radial-gradient(circle at 50% 0%, ${premio.cor}20 0%, transparent 70%)` }} />

        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2"
            style={{ backgroundColor: premio.cor + '20', borderColor: premio.cor + '50' }}>
            <span className="text-4xl">🎉</span>
          </div>

          <p className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-1">Você ganhou!</p>
          <h2 className="text-3xl font-black mb-2" style={{ color: premio.cor }}>{premio.nome}</h2>
          <p className="text-white/60 text-sm mb-6">{premio.descricao}</p>

          {valorCreditado > 0 ? (
            <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-4 mb-6 text-left">
              <p className="text-emerald-400 text-xs font-semibold mb-1">✅ Creditado automaticamente!</p>
              <p className="text-white/80 text-sm">
                <span className="text-emerald-400 font-bold text-lg">{fmtR(valorCreditado)}</span> foram adicionados ao seu saldo de cashback agora mesmo. Use na próxima festa!
              </p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
              <p className="text-white/50 text-xs mb-1">Como resgatar?</p>
              <p className="text-white/80 text-sm">Entre em contato via WhatsApp e informe seu código de acesso para aplicar o prêmio.</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: premio.cor, boxShadow: `0 4px 20px ${premio.cor}60` }}
          >
            Incrível! Entendi 🎊
          </button>
        </div>

        <style>{`
          @keyframes prize-in {
            0%   { opacity:0; transform: scale(0.7) translateY(20px); }
            60%  { transform: scale(1.05) translateY(-4px); }
            100% { opacity:1; transform: scale(1) translateY(0); }
          }
          .animate-prize-in { animation: prize-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        `}</style>
      </div>
    </div>
  )
}

/* ── Main Roleta Component ──────────────────────────────── */
export function Roleta({ premios, codigo, girosDisponiveis: initialGiros, onGiroCompleto }: Props) {
  const wheelRef  = useRef<HTMLDivElement>(null)
  const rotRef    = useRef(0)   // accumulated rotation
  const [spinning,       setSpinning]       = useState(false)
  const [giros,          setGiros]          = useState(initialGiros)
  const [winner,         setWinner]         = useState<Premio | null>(null)
  const [valorCreditado, setValorCreditado] = useState(0)
  const { fire: fireConfetti }              = useConfetti()

  const n = premios.length
  const slice = 360 / n

  const spin = useCallback(async () => {
    if (spinning || giros <= 0 || !wheelRef.current) return
    setSpinning(true)

    try {
      const res = await fetch(`/api/cliente/${codigo}/roleta`, { method: 'POST' })
      if (!res.ok) { setSpinning(false); return }
      const data = await res.json() as { premio: Premio; valorCreditado?: number }
      const { premio } = data

      // Calculate angle to land on winning prize
      const winIdx = premios.findIndex(p => p.id === premio.id)
      const centerOfWinner = (winIdx + 0.5) * slice
      const extraSpins = 5 * 360
      const targetRot = rotRef.current + extraSpins + (360 - (rotRef.current % 360)) + (360 - centerOfWinner)

      gsap.to(wheelRef.current, {
        rotation: targetRot,
        duration: 4.5,
        ease: 'power4.out',
        onComplete: () => {
          rotRef.current = targetRot
          setSpinning(false)
          setGiros(g => g - 1)
          setWinner(premio)
          setValorCreditado(data.valorCreditado ?? 0)
          fireConfetti('win')
          setTimeout(() => fireConfetti('stars'), 600)
          onGiroCompleto?.(premio, giros - 1)
        },
      })
    } catch {
      setSpinning(false)
    }
  }, [spinning, giros, codigo, premios, slice, onGiroCompleto, fireConfetti])

  if (!premios.length) return null

  return (
    <>
      {winner && !spinning && (
        <PrizeModal premio={winner} valorCreditado={valorCreditado} onClose={() => setWinner(null)} />
      )}

      <div className="relative bg-[#0a0f1e] border border-white/10 rounded-3xl overflow-hidden">
        {/* Header glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6">
          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/25 rounded-full px-4 py-1.5 mb-3">
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Giros disponíveis</span>
              <span className="bg-yellow-400 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">{giros}</span>
            </div>
            <h2 className="text-2xl font-black text-white">🎡 Roleta de Prêmios</h2>
            <p className="text-white/50 text-sm mt-1">Sua fidelidade tem recompensas!</p>
          </div>

          {/* Wheel container */}
          <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
            {/* Pointer (arrow at top) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <svg width="24" height="32" viewBox="0 0 24 32">
                <polygon points="12,28 0,0 24,0" fill="#FFD700" stroke="#0a0f1e" strokeWidth="2" />
                <circle cx="12" cy="4" r="3" fill="#FFD700" />
              </svg>
            </div>

            {/* Wheel */}
            <div ref={wheelRef} className="w-full h-full" style={{ transformOrigin: 'center center' }}>
              <WheelSVG premios={premios} spinning={spinning} />
            </div>

            {/* Center shadow ring */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)' }} />
          </div>

          {/* Spin button */}
          <div className="mt-6 text-center">
            <button
              onClick={spin}
              disabled={spinning || giros <= 0}
              className={cn(
                'relative overflow-hidden font-black text-lg px-10 py-4 rounded-2xl transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
                !spinning && giros > 0
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/30'
                  : 'bg-white/10 text-white/40'
              )}
            >
              {spinning ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Girando…
                </span>
              ) : giros > 0 ? (
                '🎡 GIRAR AGORA!'
              ) : (
                'Sem giros disponíveis'
              )}
            </button>

            {giros > 0 && !spinning && (
              <p className="text-white/30 text-xs mt-3">
                Você tem {giros} giro{giros !== 1 ? 's' : ''} — boa sorte! 🍀
              </p>
            )}
          </div>

          {/* Prizes legend */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {premios.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.cor }} />
                <span className="text-white/60 text-xs truncate">{p.nome}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
