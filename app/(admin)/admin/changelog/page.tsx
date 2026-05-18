import { CHANGELOG, CURRENT_VERSION, type ChangeType } from '@/lib/changelog'
import { Tag, Wrench, Zap, Shield } from 'lucide-react'

export const metadata = { title: 'Histórico de Versões — Twix Eventos Admin' }

const TYPE_CONFIG: Record<ChangeType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  feature:     { label: 'Novo',       color: '#10B981', bg: 'rgba(16,185,129,.12)',  icon: <Zap    size={11} /> },
  improvement: { label: 'Melhoria',   color: '#3B82F6', bg: 'rgba(59,130,246,.12)',  icon: <Tag    size={11} /> },
  fix:         { label: 'Correção',   color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  icon: <Wrench size={11} /> },
  security:    { label: 'Segurança',  color: '#8B5CF6', bg: 'rgba(139,92,246,.12)',  icon: <Shield size={11} /> },
}

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-black text-brand-text">Histórico de Versões</h1>
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(var(--brand-accent-rgb, 249 115 22) / .15)', color: 'var(--brand-accent)', border: '1px solid rgba(var(--brand-accent-rgb, 249 115 22) / .3)' }}
          >
            v{CURRENT_VERSION}
          </span>
        </div>
        <p className="text-sm text-brand-muted">
          Registro de todas as atualizações, correções e melhorias do sistema.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col gap-0">
        {/* Linha vertical */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-brand-border" />

        {CHANGELOG.map((version, vIdx) => {
          const isLatest = vIdx === 0
          return (
            <div key={version.version} className="relative pl-8 pb-10">
              {/* Dot */}
              <div
                className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-brand-surface flex items-center justify-center"
                style={{
                  background: isLatest ? 'var(--brand-accent)' : 'var(--brand-border)',
                  boxShadow: isLatest ? '0 0 0 3px rgba(249,115,22,.25)' : 'none',
                }}
              />

              {/* Card da versão */}
              <div
                className="rounded-2xl border p-5"
                style={{
                  background: isLatest ? 'rgba(249,115,22,.04)' : 'var(--brand-surface)',
                  borderColor: isLatest ? 'rgba(249,115,22,.25)' : 'var(--brand-border)',
                }}
              >
                {/* Header da versão */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-base font-black text-brand-text font-mono">v{version.version}</span>
                  {isLatest && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-brand-accent text-white">
                      atual
                    </span>
                  )}
                  <span className="text-xs text-brand-muted ml-auto">
                    {new Date(version.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h2 className="text-sm font-semibold text-brand-text mb-4">{version.title}</h2>

                {/* Lista de mudanças */}
                <ul className="flex flex-col gap-2">
                  {version.changes.map((change, cIdx) => {
                    const cfg = TYPE_CONFIG[change.type]
                    return (
                      <li key={cIdx} className="flex items-start gap-2.5 text-sm">
                        <span
                          className="flex-shrink-0 mt-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        <span className="text-brand-muted leading-snug">{change.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
