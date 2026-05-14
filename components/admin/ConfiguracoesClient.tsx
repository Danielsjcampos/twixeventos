'use client'

import { useState, useTransition } from 'react'
import {
  Globe, Search, Zap, MessageCircle, Layout, Share2, Settings,
  Save, Check, Eye, EyeOff, ChevronRight, Layers, Bot, Map,
  ExternalLink, RefreshCw, CheckCircle2, XCircle, Gift,
  Plus, Trash2, GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveConfigs } from '@/app/actions/configuracoes'
import { SingleImageUpload } from '@/components/admin/SingleImageUpload'
import { HeroSlidesEditor } from '@/components/admin/HeroSlidesEditor'

/* ── types ── */
type ConfigMap = Record<string, string>

interface Tab {
  id: string
  label: string
  icon: React.ElementType
  description: string
}

const TABS: Tab[] = [
  { id: 'geral',       label: 'Geral',        icon: Globe,          description: 'Identidade visual e dados básicos do site' },
  { id: 'seo',         label: 'SEO',           icon: Search,         description: 'Meta tags, títulos e indexação para buscadores' },
  { id: 'integracoes', label: 'Integrações',   icon: Zap,            description: 'Analytics, Pixel e motor de IA/busca' },
  { id: 'whatsapp',    label: 'WhatsApp / API',icon: MessageCircle,  description: 'Número, mensagem padrão e integração 0API' },
  { id: 'hero',        label: 'Hero / Slides', icon: Layers,         description: 'Slides do banner principal da home — imagens, vídeos ou gradientes' },
  { id: 'conteudo',    label: 'Conteúdo',      icon: Layout,         description: 'Vídeo, banners e textos do site público' },
  { id: 'social',      label: 'Redes Sociais', icon: Share2,         description: 'Links das redes sociais exibidos no footer' },
  { id: 'automacoes',  label: 'Automações',    icon: Bot,            description: 'WhatsApp automático: aniversários, pesquisas e avaliações' },
  { id: 'sitemap',     label: 'Sitemap / GSC', icon: Map,            description: 'Sitemap dinâmico e indexação no Google Search Console' },
  { id: 'cashback',    label: 'Área do Cliente', icon: Gift,         description: 'Programa de cashback e configurações do portal do cliente' },
  { id: 'sistema',     label: 'Sistema',       icon: Settings,       description: 'SLA, alertas e parâmetros operacionais' },
]

/* ── helpers ── */
function Field({
  label, hint, children, required,
}: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-brand-text">
        {label}{required && <span className="text-brand-accent ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-brand-muted">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', mono = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors',
        mono && 'font-mono'
      )}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors resize-none"
    />
  )
}

function Toggle({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const on = value === 'true'
  return (
    <button
      type="button"
      onClick={() => onChange(on ? 'false' : 'true')}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        on ? 'bg-brand-accent' : 'bg-brand-surface-2 border border-brand-border'
      )}
      aria-label={label}
    >
      <span className={cn(
        'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
        on ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

function SecretInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 pr-10 text-brand-text placeholder:text-brand-muted text-sm font-mono focus:outline-none focus:border-brand-accent transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center justify-end pt-6 border-t border-brand-border mt-8">
      <button
        onClick={onSave}
        disabled={saving}
        className={cn(
          'inline-flex items-center gap-2 font-semibold text-sm px-6 py-2.5 rounded-lg transition-all duration-200',
          saved
            ? 'bg-green-500/15 text-green-600 border border-green-500/30'
            : 'bg-brand-accent hover:bg-brand-accent-hover text-white disabled:opacity-60'
        )}
      >
        {saving ? (
          <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : saved ? (
          <Check className="size-4" />
        ) : (
          <Save className="size-4" />
        )}
        {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar alterações'}
      </button>
    </div>
  )
}

function SectionTitle({ children, description }: { children: React.ReactNode; description?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-brand-text font-semibold text-base">{children}</h3>
      {description && <p className="text-brand-muted text-sm mt-0.5">{description}</p>}
    </div>
  )
}

function Divider() {
  return <hr className="border-brand-border my-6" />
}

/* ── Roleta Prize Editor ─────────────────────────────────── */
interface Premio { id: string; nome: string; descricao: string; cor: string; peso: number; valorCredito?: number; percentual?: number; tipo?: 'fixo' | 'percentual' }

const CORES_PRESET = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#EC4899','#F97316','#06B6D4','#84CC16','#6366F1']

function PremioEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [premios, setPremios] = useState<Premio[]>(() => {
    try { return JSON.parse(value) } catch { return [] }
  })
  const [editId, setEditId] = useState<string | null>(null)

  const sync = (next: Premio[]) => {
    setPremios(next)
    onChange(JSON.stringify(next))
  }

  const addPremio = () => {
    const novo: Premio = {
      id: String(Date.now()),
      nome: 'Novo Prêmio',
      descricao: 'Descrição do prêmio',
      cor: CORES_PRESET[premios.length % CORES_PRESET.length],
      peso: 10,
      tipo: 'fixo',
      valorCredito: 0,
      percentual: 0,
    }
    const next = [...premios, novo]
    sync(next)
    setEditId(novo.id)
  }

  const updatePremio = (id: string, field: keyof Premio, val: string | number) => {
    sync(premios.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  const removePremio = (id: string) => {
    sync(premios.filter(p => p.id !== id))
    if (editId === id) setEditId(null)
  }

  const totalPeso = premios.reduce((s, p) => s + p.peso, 0)

  return (
    <div className="space-y-3">
      {premios.length === 0 && (
        <div className="text-center py-8 bg-brand-surface-2 rounded-xl border border-dashed border-brand-border text-brand-muted text-sm">
          Nenhum prêmio configurado. Adicione ao menos 2 prêmios.
        </div>
      )}

      {premios.map((p) => (
        <div key={p.id} className="bg-brand-surface-2 border border-brand-border rounded-xl overflow-hidden">
          {/* Header row */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/5 transition-colors"
            onClick={() => setEditId(editId === p.id ? null : p.id)}
          >
            <GripVertical className="size-4 text-brand-muted shrink-0" />
            <div className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white/10" style={{ backgroundColor: p.cor }} />
            <span className="font-medium text-brand-text text-sm flex-1 truncate">{p.nome || 'Sem nome'}</span>
            <span className="text-brand-muted text-xs shrink-0">
              Peso {p.peso} ({totalPeso > 0 ? Math.round(p.peso / totalPeso * 100) : 0}%)
            </span>
            <ChevronRight className={cn('size-4 text-brand-muted transition-transform', editId === p.id && 'rotate-90')} />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removePremio(p.id) }}
              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-red-400/10"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          {/* Expanded edit form */}
          {editId === p.id && (
            <div className="border-t border-brand-border px-4 py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-brand-muted">Nome do prêmio</label>
                  <input
                    type="text"
                    value={p.nome}
                    onChange={e => updatePremio(p.id, 'nome', e.target.value)}
                    maxLength={30}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                  />
                  <p className="text-xs text-brand-muted text-right">{p.nome.length}/30</p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-brand-muted">Peso (probabilidade relativa)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={p.peso}
                    onChange={e => updatePremio(p.id, 'peso', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                  />
                  <p className="text-xs text-brand-muted">
                    Chance: ~{totalPeso > 0 ? Math.round(p.peso / totalPeso * 100) : 0}%
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-medium text-brand-muted">Tipo de crédito automático</label>
                  <div className="flex gap-2">
                    {(['manual','fixo','percentual'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updatePremio(p.id, 'tipo', t === 'manual' ? 'fixo' : t)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                          (t === 'manual' && !p.tipo || t === 'manual' && (p.valorCredito ?? 0) === 0 && (p.percentual ?? 0) === 0 && p.tipo !== 'percentual')
                            ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent'
                            : t !== 'manual' && p.tipo === t
                            ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent'
                            : 'border-brand-border text-brand-muted hover:border-brand-accent/30'
                        )}
                      >
                        {t === 'manual' ? '📞 Manual' : t === 'fixo' ? '💰 Fixo (R$)' : '📊 % do cashback'}
                      </button>
                    ))}
                  </div>
                  {p.tipo === 'fixo' && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-brand-muted text-sm">R$</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={p.valorCredito ?? 0}
                        onChange={e => updatePremio(p.id, 'valorCredito', Math.max(0, parseFloat(e.target.value) || 0))}
                        className="flex-1 bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                        placeholder="0,00"
                      />
                      <span className="text-xs text-emerald-400 whitespace-nowrap">→ credita R$ {(p.valorCredito ?? 0).toFixed(2)}</span>
                    </div>
                  )}
                  {p.tipo === 'percentual' && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number" min="1" max="100"
                        value={p.percentual ?? 10}
                        onChange={e => updatePremio(p.id, 'percentual', Math.max(1, Math.min(100, parseFloat(e.target.value) || 10)))}
                        className="w-20 bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                      />
                      <span className="text-brand-muted text-sm">% do cashback total acumulado</span>
                    </div>
                  )}
                  {(!p.tipo || p.tipo === 'fixo' && (p.valorCredito ?? 0) === 0) && (
                    <p className="text-xs text-brand-muted mt-1">📞 O cliente precisará contatar via WhatsApp para resgatar.</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-brand-muted">Descrição (exibida no modal ao ganhar)</label>
                <input
                  type="text"
                  value={p.descricao}
                  onChange={e => updatePremio(p.id, 'descricao', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-brand-muted">Cor do segmento na roleta</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {CORES_PRESET.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updatePremio(p.id, 'cor', c)}
                      className={cn(
                        'w-7 h-7 rounded-full ring-2 transition-transform hover:scale-110',
                        p.cor === c ? 'ring-white scale-110' : 'ring-white/20'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={p.cor}
                    onChange={e => updatePremio(p.id, 'cor', e.target.value)}
                    className="w-7 h-7 rounded-full border-0 cursor-pointer bg-transparent"
                    title="Cor personalizada"
                  />
                  <span className="text-brand-muted text-xs font-mono">{p.cor}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addPremio}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-accent/50 transition-colors text-sm font-medium"
      >
        <Plus className="size-4" />
        Adicionar prêmio
      </button>

      {premios.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-brand-muted">
          <p className="font-semibold text-brand-text mb-1">📊 Probabilidades</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {premios.map(p => (
              <span key={p.id} className="flex items-center gap-1.5 bg-brand-surface rounded-full px-2.5 py-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.cor }} />
                {p.nome}: {totalPeso > 0 ? Math.round(p.peso / totalPeso * 100) : 0}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export function ConfiguracoesClient({ initialConfigs }: { initialConfigs: ConfigMap }) {
  const [activeTab, setActiveTab] = useState('geral')
  const [configs, setConfigs] = useState<ConfigMap>(initialConfigs)
  const [pending, startTransition] = useTransition()
  const [savedTab, setSavedTab] = useState<string | null>(null)
  const [indexarStatus, setIndexarStatus] = useState<null | { ok: boolean; data: Record<string, unknown> }>(null)
  const [indexarLoading, setIndexarLoading] = useState(false)

  const set = (key: string) => (val: string) => setConfigs(c => ({ ...c, [key]: val }))
  const get = (key: string) => configs[key] ?? ''

  const save = (keys: string[]) => {
    const subset = Object.fromEntries(keys.map(k => [k, get(k)]))
    startTransition(async () => {
      await saveConfigs(subset)
      setSavedTab(activeTab)
      setTimeout(() => setSavedTab(null), 2500)
    })
  }

  /* ── Tab contents ── */
  const tabs: Record<string, { keys: string[]; content: React.ReactNode }> = {

    /* ── GERAL ── */
    geral: {
      keys: ['site_nome', 'site_descricao', 'site_telefone', 'site_endereco', 'logo_url', 'favicon_url', 'og_image_url'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Informações básicas exibidas no site e nos buscadores">Identidade do Site</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nome do site" required>
              <Input value={get('site_nome')} onChange={set('site_nome')} placeholder="Twix Eventos" />
            </Field>
            <Field label="Telefone / WhatsApp" required>
              <Input value={get('site_telefone')} onChange={set('site_telefone')} placeholder="5512996498725" mono />
            </Field>
          </div>
          <Field label="Descrição curta" hint="Usada como meta description padrão">
            <Textarea value={get('site_descricao')} onChange={set('site_descricao')} placeholder="Locação de brinquedos infláveis em São José dos Campos…" />
          </Field>
          <Field label="Endereço completo">
            <Input value={get('site_endereco')} onChange={set('site_endereco')} placeholder="R. Prof. Roberval Fróes, 390 – SJC/SP" />
          </Field>

          <Divider />
          <SectionTitle description="Faça upload das imagens principais da sua marca">Imagens e Mídia</SectionTitle>

          <Field label="Logo" hint="Exibida no header. Formatos: PNG ou SVG com fundo transparente">
            <SingleImageUpload 
              value={get('logo_url')} 
              onChange={set('logo_url')} 
              onRemove={() => set('logo_url')('')} 
              label="Fazer upload do Logo"
            />
          </Field>
          <Field label="Favicon" hint="Ícone da aba do navegador. Ideal: 32×32 PNG ou ICO">
            <SingleImageUpload 
              value={get('favicon_url')} 
              onChange={set('favicon_url')} 
              onRemove={() => set('favicon_url')('')} 
              label="Fazer upload do Favicon"
              accept=".ico,.png"
            />
          </Field>
          <Field label="Imagem de preview social (OG Image)" hint="Exibida quando o link é compartilhado no WhatsApp, Instagram, etc. Ideal: 1200×630 px">
            <SingleImageUpload 
              value={get('og_image_url')} 
              onChange={set('og_image_url')} 
              onRemove={() => set('og_image_url')('')} 
              label="Fazer upload da Imagem OG"
            />
          </Field>
        </div>
      ),
    },

    /* ── SEO ── */
    seo: {
      keys: ['seo_titulo_padrao', 'seo_template_titulo', 'seo_descricao_padrao', 'seo_palavras_chave', 'google_site_verification', 'robots_indexar'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Configure como o site aparece nos resultados de busca">Meta Tags e Indexação</SectionTitle>
          <Field label="Título padrão" hint="Exibido na aba do navegador e no Google. Máx. 60 caracteres">
            <Input value={get('seo_titulo_padrao')} onChange={set('seo_titulo_padrao')} placeholder="Twix Eventos | Locação de Brinquedos em São José dos Campos" />
            <p className="text-xs text-brand-muted text-right mt-1">{get('seo_titulo_padrao').length}/60 chars</p>
          </Field>
          <Field label="Template de título por página" hint="Use %s para o título da página. Ex: %s | Twix Eventos">
            <Input value={get('seo_template_titulo')} onChange={set('seo_template_titulo')} placeholder="%s | Twix Eventos" mono />
          </Field>
          <Field label="Descrição padrão" hint="Máx. 160 caracteres. Aparece abaixo do título no Google">
            <Textarea value={get('seo_descricao_padrao')} onChange={set('seo_descricao_padrao')} placeholder="Aluguel de brinquedos infláveis para festas em SJC…" />
            <p className="text-xs text-brand-muted text-right mt-1">{get('seo_descricao_padrao').length}/160 chars</p>
          </Field>
          <Field label="Palavras-chave" hint="Separadas por vírgula. Ex: brinquedos infláveis, locação SJC, festa infantil">
            <Textarea value={get('seo_palavras_chave')} onChange={set('seo_palavras_chave')} placeholder="brinquedos infláveis, locação, São José dos Campos…" rows={2} />
          </Field>

          <Divider />
          <SectionTitle description="Verificação de propriedade e controle de indexação">Verificação e Robôs</SectionTitle>
          <Field label="Google Search Console — código de verificação" hint="Apenas o valor do atributo content da meta tag">
            <Input value={get('google_site_verification')} onChange={set('google_site_verification')} placeholder="abc123xyz…" mono />
          </Field>
          <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
            <div>
              <p className="text-brand-text text-sm font-medium">Permitir indexação pelo Google</p>
              <p className="text-brand-muted text-xs">Desative apenas em ambiente de teste</p>
            </div>
            <Toggle value={get('robots_indexar') || 'true'} onChange={set('robots_indexar')} label="Indexação Google" />
          </div>
        </div>
      ),
    },

    /* ── INTEGRAÇÕES ── */
    integracoes: {
      keys: ['google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id', 'ia_motor_nome', 'ia_api_key', 'ia_modelo', 'hotjar_id'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="IDs de rastreamento para análise de tráfego e conversões">Analytics e Rastreamento</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Google Analytics 4 — Measurement ID" hint="Formato: G-XXXXXXXXXX">
              <Input value={get('google_analytics_id')} onChange={set('google_analytics_id')} placeholder="G-XXXXXXXXXX" mono />
            </Field>
            <Field label="Google Tag Manager — Container ID" hint="Formato: GTM-XXXXXXX">
              <Input value={get('google_tag_manager_id')} onChange={set('google_tag_manager_id')} placeholder="GTM-XXXXXXX" mono />
            </Field>
            <Field label="Facebook / Meta Pixel ID">
              <Input value={get('facebook_pixel_id')} onChange={set('facebook_pixel_id')} placeholder="1234567890123456" mono />
            </Field>
            <Field label="Hotjar ID">
              <Input value={get('hotjar_id')} onChange={set('hotjar_id')} placeholder="1234567" mono />
            </Field>
          </div>

          <Divider />
          <SectionTitle description="Motor de inteligência artificial usado para busca e atendimento no site">IA / Motor de Busca</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nome do provedor de IA" hint="Ex: OpenAI, Anthropic, Groq, Gemini, DeepSeek">
              <Input value={get('ia_motor_nome')} onChange={set('ia_motor_nome')} placeholder="OpenAI" />
            </Field>
            <Field label="Modelo a usar" hint="Ex: gpt-4o, claude-3-5-sonnet, gemini-1.5-pro">
              <Input value={get('ia_modelo')} onChange={set('ia_modelo')} placeholder="gpt-4o" mono />
            </Field>
          </div>
          <Field label="API Key do provedor de IA">
            <SecretInput value={get('ia_api_key')} onChange={set('ia_api_key')} placeholder="sk-…" />
          </Field>
        </div>
      ),
    },

    /* ── WHATSAPP / 0API ── */
    whatsapp: {
      keys: ['whatsapp_numero', 'whatsapp_mensagem_padrao', 'zapi_url', 'zapi_instance_id', 'zapi_token', 'zapi_client_token', 'whatsapp_ativo'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Número e mensagem usados nos botões de contato do site">WhatsApp Público</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Número do WhatsApp" hint="Formato internacional sem + ou espaços: 5512999990000" required>
              <Input value={get('whatsapp_numero')} onChange={set('whatsapp_numero')} placeholder="5512996498725" mono />
            </Field>
            <div className="flex items-center gap-3 pt-6">
              <Toggle value={get('whatsapp_ativo') || 'true'} onChange={set('whatsapp_ativo')} label="WhatsApp ativo" />
              <span className="text-sm text-brand-text">Botão flutuante ativo</span>
            </div>
          </div>
          <Field label="Mensagem padrão" hint="Texto pré-preenchido ao abrir o WhatsApp">
            <Textarea value={get('whatsapp_mensagem_padrao')} onChange={set('whatsapp_mensagem_padrao')} placeholder="Olá! Gostaria de reservar um brinquedo para meu evento." rows={2} />
          </Field>

          <Divider />
          <SectionTitle description="Integração com a plataforma 0API para automações e notificações via WhatsApp">Integração 0API / Z-API</SectionTitle>
          <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-lg text-xs text-blue-600 dark:text-blue-400 mb-4">
            Estas credenciais são usadas para envio automático de confirmações, lembretes de eventos e follow-ups de leads pelo WhatsApp.
          </div>
          <Field label="URL base da API" hint="Ex: https://api.z-api.io/instances/SEU_ID/token/SEU_TOKEN">
            <Input value={get('zapi_url')} onChange={set('zapi_url')} placeholder="https://api.z-api.io/instances/…" mono />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Instance ID">
              <Input value={get('zapi_instance_id')} onChange={set('zapi_instance_id')} placeholder="3ABC123…" mono />
            </Field>
            <Field label="Token de acesso">
              <SecretInput value={get('zapi_token')} onChange={set('zapi_token')} placeholder="seu-token-aqui" />
            </Field>
          </div>
          <Field label="Client-Token (header Security)">
            <SecretInput value={get('zapi_client_token')} onChange={set('zapi_client_token')} placeholder="F…" />
          </Field>
        </div>
      ),
    },

    /* ── HERO / SLIDES ── */
    hero: {
      keys: ['hero_slides'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Crie e gerencie os slides do banner principal da home. Cada slide pode ter fundo de imagem, vídeo, gradiente ou cor sólida — com título, subtítulo e botões personalizados.">
            Slides do Hero
          </SectionTitle>
          <HeroSlidesEditor initialSlidesJson={get('hero_slides')} onChange={set('hero_slides')} />
        </div>
      ),
    },

    /* ── CONTEÚDO ── */
    conteudo: {
      keys: ['video_apresentacao', 'banner_ativo', 'banner_texto', 'desconto_seg_qui', 'hero_titulo', 'hero_subtitulo'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Vídeo exibido na seção de apresentação da página inicial">Vídeo de Apresentação</SectionTitle>
          <Field label="URL do vídeo YouTube" hint="Aceita: youtube.com/watch?v=ID, youtu.be/ID ou apenas o ID do vídeo">
            <Input value={get('video_apresentacao')} onChange={set('video_apresentacao')} placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" mono />
          </Field>
          {get('video_apresentacao') && (
            <div className="rounded-xl overflow-hidden border border-brand-border aspect-video max-w-md bg-brand-surface-2">
              <iframe
                src={`https://www.youtube.com/embed/${extractYTId(get('video_apresentacao'))}`}
                className="w-full h-full border-0"
                allowFullScreen
                title="Preview vídeo"
              />
            </div>
          )}

          <Divider />
          <SectionTitle description="Banner de oferta exibido no topo de todas as páginas">Banner Promocional</SectionTitle>
          <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
            <div>
              <p className="text-brand-text text-sm font-medium">Exibir banner promocional</p>
              <p className="text-brand-muted text-xs">Faixa azul no topo do site</p>
            </div>
            <Toggle value={get('banner_ativo') || 'true'} onChange={set('banner_ativo')} label="Banner ativo" />
          </div>
          <Field label="Texto do banner" hint="Texto exibido na faixa promocional">
            <Input value={get('banner_texto')} onChange={set('banner_texto')} placeholder="Descontos especiais de segunda a quinta! Reserve agora →" />
          </Field>
          <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
            <div>
              <p className="text-brand-text text-sm font-medium">Desconto Seg–Qui</p>
              <p className="text-brand-muted text-xs">Ativa destaque de preço reduzido nos dias úteis</p>
            </div>
            <Toggle value={get('desconto_seg_qui') || 'false'} onChange={set('desconto_seg_qui')} label="Desconto Seg-Qui" />
          </div>

          <Divider />
          <SectionTitle description="Textos da seção principal (Hero) da página inicial">Hero da Página Inicial</SectionTitle>
          <Field label="Título principal" hint="Texto grande em destaque">
            <Input value={get('hero_titulo')} onChange={set('hero_titulo')} placeholder="DIVERSÃO GARANTIDA PARA O SEU EVENTO" />
          </Field>
          <Field label="Subtítulo / descrição">
            <Textarea value={get('hero_subtitulo')} onChange={set('hero_subtitulo')} placeholder="Mais de 24 brinquedos infláveis e eletrônicos para festas…" rows={2} />
          </Field>
        </div>
      ),
    },

    /* ── REDES SOCIAIS ── */
    social: {
      keys: ['social_instagram', 'social_facebook', 'social_youtube', 'social_tiktok', 'social_google_maps'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="URLs completas dos perfis. Deixe em branco para ocultar o ícone no footer.">Links das Redes Sociais</SectionTitle>
          <Field label="Instagram">
            <Input value={get('social_instagram')} onChange={set('social_instagram')} placeholder="https://instagram.com/twixeventos" />
          </Field>
          <Field label="Facebook">
            <Input value={get('social_facebook')} onChange={set('social_facebook')} placeholder="https://facebook.com/twixeventos" />
          </Field>
          <Field label="YouTube">
            <Input value={get('social_youtube')} onChange={set('social_youtube')} placeholder="https://youtube.com/@twixeventos" />
          </Field>
          <Field label="TikTok">
            <Input value={get('social_tiktok')} onChange={set('social_tiktok')} placeholder="https://tiktok.com/@twixeventos" />
          </Field>
          <Field label="Google Maps (link da empresa)" hint="Link do Google Maps para a localização da empresa">
            <Input value={get('social_google_maps')} onChange={set('social_google_maps')} placeholder="https://maps.app.goo.gl/…" />
          </Field>
        </div>
      ),
    },

    /* ── AUTOMAÇÕES WhatsApp ── */
    automacoes: {
      keys: [
        'whatsapp_api_url', 'whatsapp_token', 'whatsapp_instance', 'whatsapp_ativo',
        'aniversario_dias_antes', 'aniversario_mensagem',
        'pesquisa_ativo', 'pesquisa_horas_apos', 'pesquisa_mensagem', 'pesquisa_nota_minima',
        'google_review_link',
      ],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Configure a API do WhatsApp para envio automático de mensagens">Conexão API WhatsApp</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Ativar automação WhatsApp">
              <Toggle value={get('whatsapp_ativo') || 'false'} onChange={set('whatsapp_ativo')} label="Automação ativa" />
            </Field>
            <Field label="URL da API" hint="Ex: https://api.0api.com ou similar">
              <Input value={get('whatsapp_api_url')} onChange={set('whatsapp_api_url')} placeholder="https://api.0api.com" mono />
            </Field>
            <Field label="Instance ID">
              <Input value={get('whatsapp_instance')} onChange={set('whatsapp_instance')} placeholder="instance123" mono />
            </Field>
            <Field label="Token de autenticação">
              <Input value={get('whatsapp_token')} onChange={set('whatsapp_token')} placeholder="Bearer token..." mono type="password" />
            </Field>
          </div>

          <Divider />
          <SectionTitle description="Mensagem automática de parabéns para aniversários de clientes">🎂 Mensagens de Aniversário</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Dias de antecedência" hint="Quantos dias antes do aniversário enviar a mensagem">
              <Input value={get('aniversario_dias_antes')} onChange={set('aniversario_dias_antes')} placeholder="3" type="number" />
            </Field>
          </div>
          <Field label="Mensagem de aniversário" hint="Use {nome} para o nome do cliente e {aniversariante} para o nome do aniversariante">
            <Textarea value={get('aniversario_mensagem')} onChange={set('aniversario_mensagem')} rows={4}
              placeholder="Olá {nome}! A Twix Eventos deseja um feliz aniversário para {aniversariante}! 🎉 Que seja um dia especial!" />
          </Field>

          <Divider />
          <SectionTitle description="Pesquisa automática enviada após realização dos eventos">⭐ Pesquisa Pós-Evento</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Ativar pesquisa pós-evento">
              <Toggle value={get('pesquisa_ativo') || 'false'} onChange={set('pesquisa_ativo')} label="Pesquisa ativa" />
            </Field>
            <Field label="Horas após o evento" hint="Quantas horas após o evento enviar a pesquisa">
              <Input value={get('pesquisa_horas_apos')} onChange={set('pesquisa_horas_apos')} placeholder="24" type="number" />
            </Field>
            <Field label="Nota mínima para Google Review" hint="Se a resposta for maior ou igual, envia link do Google">
              <input type="number" min="1" max="5" value={get('pesquisa_nota_minima')} onChange={e => set('pesquisa_nota_minima')(e.target.value)} placeholder="4"
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/40 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent transition"
              />
            </Field>
            <Field label="Link do Google Meu Negócio">
              <Input value={get('google_review_link')} onChange={set('google_review_link')} placeholder="https://g.page/r/..." mono />
            </Field>
          </div>
          <Field label="Mensagem da pesquisa" hint="Use {nome} para o nome do cliente">
            <Textarea value={get('pesquisa_mensagem')} onChange={set('pesquisa_mensagem')} rows={4}
              placeholder="Olá {nome}! Esperamos que sua festa tenha sido incrível! Como foi sua experiência com a Twix Eventos? (Responda de 1 a 5)" />
          </Field>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-brand-muted">
            <p className="font-semibold text-brand-text mb-1">📌 Variáveis disponíveis nas mensagens:</p>
            <ul className="space-y-1 text-xs mt-2">
              <li><code className="text-blue-400">{'{nome}'}</code> — Nome do cliente</li>
              <li><code className="text-blue-400">{'{aniversariante}'}</code> — Nome do aniversariante (apenas em mensagens de aniversário)</li>
              <li><code className="text-blue-400">{'{google_link}'}</code> — Link do Google Meu Negócio (apenas na pesquisa)</li>
            </ul>
          </div>
        </div>
      ),
    },

    /* ── SITEMAP / GSC ── */
    sitemap: {
      keys: ['site_url', 'sitemap_frequencia', 'sitemap_prioridade', 'sitemap_include_blog', 'gsc_api_key', 'gsc_site_url', 'indexar_automatico'],
      content: (() => {
        const siteUrl = get('site_url') || 'https://twixeventos.com'
        const sitemapUrl = `${siteUrl.replace(/\/$/, '')}/sitemap.xml`

        const handleIndexar = async () => {
          setIndexarLoading(true)
          setIndexarStatus(null)
          try {
            const res = await fetch('/api/admin/indexar', { method: 'POST' })
            const data = await res.json()
            setIndexarStatus({ ok: res.ok, data })
          } catch {
            setIndexarStatus({ ok: false, data: { error: 'Falha na requisição' } })
          } finally {
            setIndexarLoading(false)
          }
        }

        return (
          <div className="space-y-5">
            <SectionTitle description="URL canônica do site usada no sitemap e nas notificações ao Google">URL do Site</SectionTitle>
            <Field label="URL base do site" hint="Ex: https://twixeventos.com (sem barra no final)" required>
              <Input value={get('site_url')} onChange={set('site_url')} placeholder="https://twixeventos.com" mono />
            </Field>

            <div className="flex items-center gap-2 p-3 bg-brand-surface-2 border border-brand-border rounded-xl">
              <span className="text-brand-muted text-xs">Sitemap público:</span>
              <a
                href={sitemapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent text-xs font-mono hover:underline flex items-center gap-1"
              >
                {sitemapUrl}
                <ExternalLink className="size-3" />
              </a>
            </div>

            <Divider />
            <SectionTitle description="Controle a frequência e prioridade das URLs no sitemap.xml">Configurações do Sitemap</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Frequência de atualização" hint="Indica ao Google com que frequência o conteúdo muda">
                <select
                  value={get('sitemap_frequencia') || 'weekly'}
                  onChange={e => set('sitemap_frequencia')(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="always">Sempre (always)</option>
                  <option value="hourly">Por hora (hourly)</option>
                  <option value="daily">Diário (daily)</option>
                  <option value="weekly">Semanal (weekly)</option>
                  <option value="monthly">Mensal (monthly)</option>
                  <option value="yearly">Anual (yearly)</option>
                  <option value="never">Nunca (never)</option>
                </select>
              </Field>
              <Field label="Prioridade padrão" hint="Valor entre 0.0 e 1.0 para páginas de brinquedos">
                <select
                  value={get('sitemap_prioridade') || '0.8'}
                  onChange={e => set('sitemap_prioridade')(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                >
                  {['1.0','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
              <div>
                <p className="text-brand-text text-sm font-medium">Incluir Blog no Sitemap</p>
                <p className="text-brand-muted text-xs">Ative quando o blog for implementado</p>
              </div>
              <Toggle value={get('sitemap_include_blog') || 'false'} onChange={set('sitemap_include_blog')} label="Blog no sitemap" />
            </div>

            <Divider />
            <SectionTitle description="Credenciais do Google Search Console para indexação automática via Indexing API">Google Search Console</SectionTitle>
            <Field label="URL cadastrada no GSC" hint="Deve corresponder exatamente à URL cadastrada no Search Console">
              <Input value={get('gsc_site_url')} onChange={set('gsc_site_url')} placeholder="https://twixeventos.com" mono />
            </Field>
            <Field
              label="Service Account JSON (chave de API)"
              hint="Cole o conteúdo completo do arquivo JSON da Service Account do Google Cloud. A conta deve ter permissão de Owner no GSC."
            >
              <Textarea
                value={get('gsc_api_key')}
                onChange={set('gsc_api_key')}
                placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n..."\n}'}
                rows={7}
              />
            </Field>
            <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
              <div>
                <p className="text-brand-text text-sm font-medium">Indexação automática</p>
                <p className="text-brand-muted text-xs">Notifica o Google automaticamente quando um brinquedo é criado ou editado</p>
              </div>
              <Toggle value={get('indexar_automatico') || 'false'} onChange={set('indexar_automatico')} label="Indexação automática" />
            </div>

            <Divider />
            <SectionTitle description="Envie todas as URLs do sitemap para o Google agora">Indexar Agora</SectionTitle>
            <div className="p-4 bg-brand-surface-2 rounded-xl border border-brand-border space-y-4">
              <p className="text-brand-muted text-sm">
                {get('gsc_api_key')
                  ? 'Usa a Indexing API v3 com a Service Account configurada para notificar cada URL individualmente.'
                  : 'Sem Service Account configurada, será enviado um ping ao sitemap.xml para o Google e Bing (método legado).'
                }
              </p>
              <button
                type="button"
                onClick={handleIndexar}
                disabled={indexarLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`size-4 ${indexarLoading ? 'animate-spin' : ''}`} />
                {indexarLoading ? 'Indexando…' : 'Indexar Agora'}
              </button>

              {indexarStatus && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
                  indexarStatus.ok
                    ? 'bg-green-500/8 border-green-500/25 text-green-700 dark:text-green-400'
                    : 'bg-red-500/8 border-red-500/25 text-red-700 dark:text-red-400'
                }`}>
                  {indexarStatus.ok
                    ? <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
                    : <XCircle className="size-4 mt-0.5 shrink-0" />
                  }
                  <div className="space-y-1">
                    {indexarStatus.data.modo === 'indexing_api' ? (
                      <>
                        <p className="font-semibold">Indexing API — concluído</p>
                        <p>Total: <strong>{String(indexarStatus.data.total)}</strong> URLs &nbsp;|&nbsp; Indexadas: <strong>{String(indexarStatus.data.indexados)}</strong> &nbsp;|&nbsp; Erros: <strong>{(indexarStatus.data.erros as unknown[])?.length ?? 0}</strong></p>
                      </>
                    ) : indexarStatus.data.modo === 'ping_sitemap' ? (
                      <>
                        <p className="font-semibold">Ping ao sitemap — concluído</p>
                        <p>Google: {indexarStatus.data.google ? '✅' : '❌'} &nbsp;|&nbsp; Bing: {indexarStatus.data.bing ? '✅' : '❌'}</p>
                        <p className="text-xs opacity-75">Sitemap: {String(indexarStatus.data.sitemap)}</p>
                      </>
                    ) : (
                      <p>{String(indexarStatus.data.error ?? 'Erro desconhecido')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-brand-muted">
              <p className="font-semibold text-brand-text mb-2">📋 Como configurar a Indexing API</p>
              <ol className="space-y-1 text-xs list-decimal list-inside">
                <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Google Cloud Console</a> e crie um projeto</li>
                <li>Ative a <strong>Web Search Indexing API</strong></li>
                <li>Crie uma <strong>Service Account</strong> e gere uma chave JSON</li>
                <li>No <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Search Console</a>, adicione o e-mail da Service Account como <strong>Owner</strong> do site</li>
                <li>Cole o conteúdo do arquivo JSON no campo acima</li>
              </ol>
            </div>
          </div>
        )
      })(),
    },

    /* ── ÁREA DO CLIENTE / CASHBACK ── */
    cashback: {
      keys: ['cashback_ativo','cashback_percentual','cashback_validade_dias','cashback_min_resgate','area_cliente_ativo','area_cliente_titulo','roleta_ativa','roleta_min_cashback','roleta_premios'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Configure o portal de autoatendimento dos seus clientes">Portal do Cliente</SectionTitle>
          <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
            <div>
              <p className="text-brand-text text-sm font-medium">Área do cliente ativa</p>
              <p className="text-brand-muted text-xs">Clientes podem acessar via código único em <code className="text-brand-accent">/minha-area</code></p>
            </div>
            <Toggle value={get('area_cliente_ativo') || 'true'} onChange={set('area_cliente_ativo')} label="Área ativa" />
          </div>
          <Field label="Título da área do cliente">
            <Input value={get('area_cliente_titulo')} onChange={set('area_cliente_titulo')} placeholder="Minha Área" />
          </Field>

          <Divider />
          <SectionTitle description="Os clientes ganham cashback a cada festa realizada">Programa de Cashback</SectionTitle>
          <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
            <div>
              <p className="text-brand-text text-sm font-medium">Programa de cashback ativo</p>
              <p className="text-brand-muted text-xs">Credita automaticamente quando o evento é marcado como &ldquo;realizado&rdquo;</p>
            </div>
            <Toggle value={get('cashback_ativo') || 'true'} onChange={set('cashback_ativo')} label="Cashback ativo" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="Percentual de cashback (%)" hint="Ex: 5 = 5% do valor total da festa">
              <Input value={get('cashback_percentual')} onChange={set('cashback_percentual')} placeholder="5" type="number" />
            </Field>
            <Field label="Valor mínimo para resgate (R$)" hint="Ex: 20 = precisa de R$ 20 para resgatar">
              <Input value={get('cashback_min_resgate')} onChange={set('cashback_min_resgate')} placeholder="20" type="number" />
            </Field>
            <Field label="Validade (dias)" hint="0 = sem expiração">
              <Input value={get('cashback_validade_dias')} onChange={set('cashback_validade_dias')} placeholder="365" type="number" />
            </Field>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-brand-muted space-y-2">
            <p className="font-semibold text-brand-text">💡 Como funciona o cashback</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Quando um evento é marcado como <strong>realizado</strong>, o sistema credita automaticamente o cashback.</li>
              <li>O cliente visualiza o saldo e o histórico na área do cliente.</li>
              <li>Para resgatar, o cliente fala via WhatsApp e você aplica no próximo evento.</li>
              <li>O código de acesso é gerado automaticamente e pode ser enviado via WhatsApp na tela do cliente.</li>
            </ul>
          </div>

          <Divider />
          <SectionTitle description="Roleta de prêmios que o cliente pode girar ao acumular cashback suficiente">🎡 Roleta de Prêmios</SectionTitle>
          <div className="flex items-center justify-between p-4 bg-brand-surface-2 rounded-xl border border-brand-border">
            <div>
              <p className="text-brand-text text-sm font-medium">Roleta de prêmios ativa</p>
              <p className="text-brand-muted text-xs">Exibe a roleta na área do cliente quando o cashback acumulado atinge o mínimo</p>
            </div>
            <Toggle value={get('roleta_ativa') || 'false'} onChange={set('roleta_ativa')} label="Roleta ativa" />
          </div>
          <Field label="Cashback mínimo para ganhar 1 giro (R$)" hint="A cada múltiplo desse valor em cashback total, o cliente ganha 1 giro. Ex: 200 = a cada R$200 acumulados">
            <Input value={get('roleta_min_cashback')} onChange={set('roleta_min_cashback')} placeholder="200" type="number" />
          </Field>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-text">Prêmios da roleta</label>
            <p className="text-xs text-brand-muted mb-3">Configure os prêmios e seus pesos de probabilidade. Mais peso = mais chance de sair.</p>
            <PremioEditor
              value={get('roleta_premios') || '[]'}
              onChange={set('roleta_premios')}
            />
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-sm text-brand-muted space-y-2">
            <p className="font-semibold text-brand-text">🎡 Como funciona a roleta</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>O cliente ganha 1 giro para cada R${get('roleta_min_cashback') || '200'} de cashback <strong>acumulado total</strong>.</li>
              <li>Os giros são calculados automaticamente: <code className="text-yellow-600">floor(cashbackTotal / mínimo) − girosJáUsados</code>.</li>
              <li>O sorteio é ponderado pelo <strong>peso</strong> de cada prêmio.</li>
              <li>O prêmio é registrado e o cliente vê o histórico na sua área.</li>
            </ul>
          </div>
        </div>
      ),
    },

    /* ── SISTEMA ── */
    sistema: {
      keys: ['sla_followup_horas', 'email_admin', 'email_notificacoes', 'eventos_antecedencia_dias', 'max_brinquedos_orcamento'],
      content: (
        <div className="space-y-5">
          <SectionTitle description="Parâmetros operacionais do sistema de CRM e gestão">Alertas e SLA</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="SLA de Follow-up (horas)" hint="Horas sem interação para gerar alerta de atenção no lead">
              <Input value={get('sla_followup_horas')} onChange={set('sla_followup_horas')} placeholder="24" type="number" />
            </Field>
            <Field label="Antecedência de eventos (dias)" hint="Dias antes do evento para alertas no dashboard">
              <Input value={get('eventos_antecedencia_dias')} onChange={set('eventos_antecedencia_dias')} placeholder="7" type="number" />
            </Field>
            <Field label="Máx. brinquedos por orçamento" hint="Limite de itens no carrinho de cotação">
              <Input value={get('max_brinquedos_orcamento')} onChange={set('max_brinquedos_orcamento')} placeholder="10" type="number" />
            </Field>
          </div>

          <Divider />
          <SectionTitle description="E-mails para notificações automáticas do sistema">Notificações por E-mail</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="E-mail do administrador">
              <Input value={get('email_admin')} onChange={set('email_admin')} placeholder="admin@twixeventos.com" type="email" />
            </Field>
            <Field label="E-mail de notificações" hint="Recebe alertas de novos leads e orçamentos">
              <Input value={get('email_notificacoes')} onChange={set('email_notificacoes')} placeholder="notificacoes@twixeventos.com" type="email" />
            </Field>
          </div>

          <Divider />
          <div className="bg-brand-surface-2 rounded-xl border border-brand-border p-4 space-y-3">
            <p className="text-brand-text text-sm font-semibold">Acesso Admin</p>
            <p className="text-brand-muted text-xs">Para alterar a senha do admin, gere um novo hash:</p>
            <code className="block bg-brand-bg border border-brand-border rounded-lg p-3 text-xs text-green-600 font-mono">
              node -e &quot;require(&apos;bcryptjs&apos;).hash(&apos;novasenha&apos;,12).then(console.log)&quot;
            </code>
            <p className="text-brand-muted text-xs">Cole o hash gerado diretamente na tabela <code className="text-brand-text">admin_users</code> no NeonDB.</p>
          </div>
        </div>
      ),
    },
  }

  const current = tabs[activeTab]

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-8">

      {/* ── Mobile: horizontal scroll tabs ── */}
      <div className="md:hidden -mx-4 px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 border shrink-0',
                  isActive
                    ? 'bg-brand-accent text-white border-brand-accent'
                    : 'text-brand-muted border-brand-border hover:text-brand-text hover:bg-brand-surface-2'
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Desktop: sidebar nav ── */}
      <nav className="hidden md:flex flex-col w-52 shrink-0 gap-0.5 pt-1 self-start sticky top-6">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left',
                isActive
                  ? 'bg-brand-accent text-white'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface-2'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{tab.label}</span>
              {isActive && <ChevronRight className="size-3 opacity-70" />}
            </button>
          )
        })}
      </nav>

      {/* ── Content area ── */}
      <div className="flex-1 min-w-0">
        {/* Tab header */}
        <div className="mb-6 pb-5 border-b border-brand-border">
          <h2 className="text-xl font-bold text-brand-text">
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <p className="text-brand-muted text-sm mt-1">
            {TABS.find(t => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab content */}
        <div>{current.content}</div>

        <SaveBar
          onSave={() => save(current.keys)}
          saving={pending}
          saved={savedTab === activeTab}
        />

        {/* Extra bottom padding so content clears mobile nav bar */}
        <div className="h-20 md:h-8" />
      </div>
    </div>
  )
}

/* ── util ── */
function extractYTId(url: string): string {
  if (!url) return ''
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return short[1]
  const long = url.match(/(?:v=|\/embed\/)([^?&/]+)/)
  if (long) return long[1]
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return ''
}
