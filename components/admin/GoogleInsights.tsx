'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Search as SearchIcon, BarChart3, LineChart, Link2, Unlink, Settings2,
  CheckCircle2, AlertCircle, Loader2, MousePointerClick, Eye, ArrowUpRight, RefreshCw,
  Copy, Check, ExternalLink, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { salvarConfigGoogle, desconectarContaGoogle, reenviarSitemapAgora } from '@/app/actions/configuracoes'
import type { GoogleStatus, GscResumo, Ga4Resumo } from '@/lib/google/data'

interface Props {
  status: GoogleStatus
  gsc: GscResumo | null
  ga4: Ga4Resumo | null
}

const fmt = (n: number) => n.toLocaleString('pt-BR')
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`

export function GoogleInsights({ status, gsc, ga4 }: Props) {
  const [gscSite, setGscSite] = useState(status.gscSite ?? '')
  const [ga4Property, setGa4Property] = useState(status.ga4Property ?? '')
  const [salvando, startSalvar] = useTransition()
  const [desconectando, startDesconectar] = useTransition()
  const [reenviando, startReenviar] = useTransition()

  const salvar = () => {
    startSalvar(async () => {
      try {
        await salvarConfigGoogle({ gscSite, ga4Property })
        toast.success('Configurações do Google salvas.')
      } catch {
        toast.error('Falha ao salvar.')
      }
    })
  }

  const reenviarSitemap = () => {
    startReenviar(async () => {
      try {
        const r = await reenviarSitemapAgora()
        toast.success(`Sitemap reenviado — Google: ${r.google ? 'ok' : 'falhou'}, IndexNow: ${r.indexnow ? 'ok' : 'falhou'}.`)
      } catch {
        toast.error('Falha ao reenviar o sitemap.')
      }
    })
  }

  const desconectar = () => {
    if (!confirm('Desconectar a conta Google? Os dados deixarão de ser carregados.')) return
    startDesconectar(async () => {
      try {
        await desconectarContaGoogle()
        toast.success('Conta Google desconectada.')
      } catch {
        toast.error('Falha ao desconectar.')
      }
    })
  }

  // 1) Sem credenciais de cliente configuradas no ambiente
  if (!status.configurado) {
    return (
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
          <SearchIcon className="size-4 text-brand-accent" />
          Google Search Console & Analytics
        </h2>
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-brand-muted">
            <p className="font-semibold text-brand-text">Credenciais do Google ainda não configuradas.</p>
            <p className="text-xs">Siga o passo a passo abaixo (você faz isso só uma vez). Depois é só clicar em “Conectar com Google” e fica conectado para sempre.</p>
          </div>
        </div>
        <GuiaConexao iniciaAberto />
      </section>
    )
  }

  // 2) Credenciais ok, mas não conectado ainda
  if (!status.conectado) {
    return (
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
          <SearchIcon className="size-4 text-brand-accent" />
          Google Search Console & Analytics
        </h2>
        <p className="text-sm text-brand-muted">
          Conecte sua conta Google (com acesso ao Search Console e Analytics) para ver dados reais de busca e tráfego aqui no painel.
        </p>
        <a
          href="/api/admin/google/connect"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <Link2 className="size-4" />
          Conectar com Google
        </a>
        <GuiaConexao />
      </section>
    )
  }

  // 3) Conectado — mostra dados + configurações
  return (
    <section className="space-y-5">
      {/* Cabeçalho de conexão */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center size-9 rounded-lg bg-green-500/10 text-green-500">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-brand-text">Google conectado</h2>
            <p className="text-xs text-brand-muted">
              {status.email || 'conta conectada'}
              {status.conectadoEm && ` · desde ${new Date(status.conectadoEm).toLocaleDateString('pt-BR')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reenviarSitemap}
            disabled={reenviando}
            className="inline-flex items-center gap-2 bg-brand-surface-2 border border-brand-border hover:border-brand-accent text-brand-text font-bold text-sm px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            {reenviando ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Reenviar sitemap
          </button>
          <button
            onClick={desconectar}
            disabled={desconectando}
            className="inline-flex items-center gap-2 text-brand-muted hover:text-red-500 font-bold text-sm px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            {desconectando ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
            Desconectar
          </button>
        </div>
      </div>

      {/* Configurações de site/propriedade */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
          <Settings2 className="size-4 text-brand-accent" />
          Configurar fontes de dados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-brand-muted">Site do Search Console</span>
            <input
              value={gscSite}
              onChange={e => setGscSite(e.target.value)}
              placeholder="https://twixeventos.com.br/ ou sc-domain:twixeventos.com"
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text focus:border-brand-accent outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-brand-muted">ID da propriedade GA4</span>
            <input
              value={ga4Property}
              onChange={e => setGa4Property(e.target.value)}
              placeholder="ex: 123456789"
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text focus:border-brand-accent outline-none"
            />
          </label>
        </div>
        <button
          onClick={salvar}
          disabled={salvando}
          className="inline-flex items-center gap-2 bg-brand-surface-2 border border-brand-border hover:border-brand-accent text-brand-text font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
        >
          {salvando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Salvar fontes
        </button>
        <GuiaConexao />
      </div>

      {/* Search Console */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
          <SearchIcon className="size-4 text-brand-accent" />
          Search Console <span className="text-xs font-normal text-brand-muted">(últimos 28 dias)</span>
        </h3>
        {!gsc ? (
          <p className="text-sm text-brand-muted">
            {gscSite ? 'Sem dados ainda ou site não verificado nesta conta.' : 'Informe o site do Search Console acima e salve.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniCard icon={MousePointerClick} label="Cliques" valor={fmt(gsc.totalClicks)} />
              <MiniCard icon={Eye} label="Impressões" valor={fmt(gsc.totalImpressions)} />
              <MiniCard icon={ArrowUpRight} label="CTR médio" valor={fmtPct(gsc.ctrMedio)} />
              <MiniCard icon={BarChart3} label="Posição média" valor={gsc.posicaoMedia.toFixed(1)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <RankTabela
                titulo="Principais palavras-chave"
                linhas={gsc.topQueries.slice(0, 10).map(q => ({ nome: q.query, valor: fmt(q.clicks), sub: `pos ${q.position.toFixed(0)}` }))}
              />
              <RankTabela
                titulo="Páginas mais buscadas"
                linhas={gsc.topPaginas.slice(0, 10).map(p => ({ nome: caminho(p.page), valor: fmt(p.clicks), sub: `${fmt(p.impressions)} impr.` }))}
              />
            </div>
          </>
        )}
      </div>

      {/* Analytics GA4 */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
          <LineChart className="size-4 text-brand-accent" />
          Google Analytics (GA4) <span className="text-xs font-normal text-brand-muted">(últimos 28 dias)</span>
        </h3>
        {!ga4 ? (
          <p className="text-sm text-brand-muted">
            {ga4Property ? 'Sem dados ainda ou propriedade sem acesso nesta conta.' : 'Informe o ID da propriedade GA4 acima e salve.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniCard icon={BarChart3} label="Usuários ativos" valor={fmt(ga4.usuariosAtivos)} />
              <MiniCard icon={LineChart} label="Sessões" valor={fmt(ga4.sessoes)} />
              <MiniCard icon={Eye} label="Visualizações" valor={fmt(ga4.pageviews)} />
              <MiniCard icon={ArrowUpRight} label="Duração média" valor={`${Math.round(ga4.duracaoMedia)}s`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <RankTabela
                titulo="Páginas mais vistas"
                linhas={ga4.topPaginas.slice(0, 10).map(p => ({ nome: caminho(p.path), valor: fmt(p.views) }))}
              />
              <RankTabela
                titulo="Canais de aquisição"
                linhas={ga4.canais.slice(0, 10).map(c => ({ nome: c.canal, valor: fmt(c.sessoes) }))}
              />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function caminho(url: string): string {
  try {
    return new URL(url).pathname || url
  } catch {
    return url
  }
}

function MiniCard({ icon: Icon, label, valor }: { icon: React.ComponentType<{ className?: string }>; label: string; valor: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg/40 p-3 flex items-center gap-3">
      <span className="flex items-center justify-center size-8 rounded-lg bg-brand-accent/10 text-brand-accent shrink-0">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide truncate">{label}</p>
        <p className="text-lg font-black text-brand-text leading-tight">{valor}</p>
      </div>
    </div>
  )
}

function RankTabela({ titulo, linhas }: { titulo: string; linhas: { nome: string; valor: string; sub?: string }[] }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg/40 p-4">
      <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">{titulo}</h4>
      {linhas.length === 0 ? (
        <p className="text-sm text-brand-muted">Sem dados.</p>
      ) : (
        <ul className="space-y-2">
          {linhas.map((l, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-sm border-b border-brand-border/50 pb-1.5 last:border-0 last:pb-0">
              <span className="text-brand-text truncate flex-1" title={l.nome}>{l.nome}</span>
              <span className="flex items-center gap-2 shrink-0">
                {l.sub && <span className="text-[10px] text-brand-muted">{l.sub}</span>}
                <span className="font-bold text-brand-accent">{l.valor}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Botão de copiar texto para a área de transferência
function CopyButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      /* clipboard indisponível */
    }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      aria-label="Copiar"
      className="inline-flex items-center justify-center size-7 shrink-0 rounded-md border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-accent hover:border-brand-accent transition-colors"
    >
      {copiado ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
    </button>
  )
}

// Linha com valor monoespaçado + botão copiar
function CampoCopiavel({ valor }: { valor: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-md bg-brand-bg border border-brand-border px-2.5 py-1.5 text-xs font-mono text-brand-text">
        {valor}
      </code>
      <CopyButton texto={valor} />
    </div>
  )
}

/**
 * Passo a passo, embutido no painel, para criar as credenciais OAuth do Google
 * (Search Console + Analytics) e conectar. Feito uma única vez.
 */
function GuiaConexao({ iniciaAberto = false }: { iniciaAberto?: boolean }) {
  const [aberto, setAberto] = useState(iniciaAberto)
  const [origin, setOrigin] = useState('https://twixeventos.vercel.app')

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  const callbackProd = `${origin}/api/admin/google/callback`
  const callbackLocal = 'http://localhost:3000/api/admin/google/callback'

  return (
    <div className="rounded-xl border border-brand-border bg-brand-bg/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-brand-text flex items-center gap-2">
          <Settings2 className="size-4 text-brand-accent" />
          Passo a passo para conectar (uma única vez)
        </span>
        <ChevronDown className={`size-4 text-brand-muted transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="px-4 pb-5 pt-1 space-y-5 border-t border-brand-border">
          <Passo n={1} titulo="Criar/escolher o projeto no Google Cloud">
            <p>Abra o Google Cloud Console e crie um projeto (ex.: “Twix Eventos”).</p>
            <LinkExterno href="https://console.cloud.google.com/projectcreate">Abrir Google Cloud Console</LinkExterno>
          </Passo>

          <Passo n={2} titulo="Habilitar as 2 APIs necessárias">
            <p>Em “APIs e serviços → Biblioteca”, habilite:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><b>Google Search Console API</b></li>
              <li><b>Google Analytics Data API</b></li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <LinkExterno href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com">Search Console API</LinkExterno>
              <LinkExterno href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com">Analytics Data API</LinkExterno>
            </div>
          </Passo>

          <Passo n={3} titulo="Tela de consentimento OAuth">
            <p>“APIs e serviços → Tela de consentimento OAuth”. Tipo <b>Externo</b>. Pode deixar em modo <b>Teste</b>. Em “Usuários de teste”, adicione o seu e-mail do Google (o mesmo que tem acesso ao Search Console e Analytics).</p>
            <LinkExterno href="https://console.cloud.google.com/apis/credentials/consent">Abrir tela de consentimento</LinkExterno>
          </Passo>

          <Passo n={4} titulo="Criar o ID do cliente OAuth (Aplicativo da Web)">
            <p>“Credenciais → Criar credenciais → ID do cliente OAuth” → tipo <b>Aplicativo da Web</b>. Em “URIs de redirecionamento autorizados”, adicione os dois abaixo:</p>
            <div className="space-y-2 pt-1">
              <CampoCopiavel valor={callbackProd} />
              <CampoCopiavel valor={callbackLocal} />
            </div>
            <p className="text-[11px]">Ao salvar, copie o <b>Client ID</b> e o <b>Client Secret</b>.</p>
            <LinkExterno href="https://console.cloud.google.com/apis/credentials">Abrir Credenciais</LinkExterno>
          </Passo>

          <Passo n={5} titulo="Colar as credenciais na Vercel (Environment Variables)">
            <p>No seu projeto na Vercel: Settings → Environment Variables. Adicione (Production e Preview):</p>
            <div className="space-y-2 pt-1">
              <CampoCopiavel valor="GOOGLE_CLIENT_ID" />
              <CampoCopiavel valor="GOOGLE_CLIENT_SECRET" />
            </div>
            <p className="text-[11px]">Depois faça um <b>Redeploy</b> para carregar as variáveis.</p>
          </Passo>

          <Passo n={6} titulo="Conectar e configurar as fontes">
            <p>Volte aqui, clique em <b>“Conectar com Google”</b> e autorize. Depois preencha o <b>site do Search Console</b> e o <b>ID da propriedade GA4</b> (só números) e salve. Pronto — fica conectado para sempre.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <LinkExterno href="https://search.google.com/search-console">Search Console</LinkExterno>
              <LinkExterno href="https://analytics.google.com">Google Analytics (GA4)</LinkExterno>
            </div>
          </Passo>
        </div>
      )}
    </div>
  )
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex items-center justify-center size-6 shrink-0 rounded-full bg-brand-accent text-white text-xs font-black">
        {n}
      </span>
      <div className="space-y-1.5 text-xs text-brand-muted leading-relaxed">
        <h4 className="text-sm font-bold text-brand-text">{titulo}</h4>
        {children}
      </div>
    </div>
  )
}

function LinkExterno({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:underline"
    >
      {children}
      <ExternalLink className="size-3" />
    </a>
  )
}
