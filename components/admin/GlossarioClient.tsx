'use client'

import { useState, useTransition } from 'react'
import {
  BookOpen, Plus, Search, Bot, Sparkles, RefreshCw, Trash2, Check,
  Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink, HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Interfaces
interface Termo {
  id: string
  termo: string
  slug: string
  letra: string
  nicho: string
  conteudo: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
  createdAt: Date
  updatedAt: Date
}

interface Props {
  initialTermos: Termo[]
}

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossarioClient({ initialTermos }: Props) {
  const [termos, setTermos] = useState<Termo[]>(initialTermos)
  const [nicho, setNicho] = useState('Aluguel de brinquedos infláveis, festas infantis e eventos')
  const [letrasSugerir, setLetrasSugerir] = useState<string[]>(['A'])
  const [prefixo, setPrefixo] = useState('O que é')
  const [promptExtra, setPromptExtra] = useState('')
  const [novoTermoManual, setNovoTermoManual] = useState('')

  // Estados de Edição Inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTermo, setEditingTermo] = useState('')
  const [editingNicho, setEditingNicho] = useState('')

  // Filtros e Busca
  const [busca, setBusca] = useState('')
  const [letraFiltro, setLetraFiltro] = useState<string | null>(null)
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendente' | 'publicado'>('todos')

  // Estados de Carregamento
  const [loadingSugerir, setLoadingSugerir] = useState(false)
  const [loadingManual, setLoadingManual] = useState(false)
  const [loadingAcao, setLoadingAcao] = useState<string | null>(null) // ID do termo operando
  
  // Seleção e Processamento em Lote
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false)
  const [bulkTotal, setBulkTotal] = useState(0)
  const [bulkCurrent, setBulkCurrent] = useState(0)
  const [bulkTermoAtual, setBulkTermoAtual] = useState('')
  const [bulkLabel, setBulkLabel] = useState('Geração em Lote Ativa')
  const [bulkUnit, setBulkUnit] = useState('verbetes')

  const [pending, startTransition] = useTransition()

  // Atualizar a lista do banco
  const refreshList = async () => {
    try {
      const res = await fetch('/api/admin/glossario')
      if (res.ok) {
        const data = await res.json()
        setTermos(data)
      }
    } catch (err) {
      console.error('Erro ao recarregar termos:', err)
    }
  }

  // Alternar seleção de letra (multi-seleção)
  const toggleLetra = (l: string) =>
    setLetrasSugerir(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])

  const selecionarTodasLetras = () => setLetrasSugerir([...ALFABETO])
  const limparLetras = () => setLetrasSugerir([])

  // Sugerir termos via IA — automatizado para uma ou várias letras (fila sequencial)
  const handleSugerirTermos = async () => {
    if (!nicho.trim()) {
      toast.error('Informe o nicho de mercado para contextualizar a IA.')
      return
    }
    if (letrasSugerir.length === 0) {
      toast.error('Selecione ao menos uma letra para gerar os títulos.')
      return
    }

    const letras = [...letrasSugerir].sort()

    setLoadingSugerir(true)
    setBulkLabel('Gerando Títulos por Letra')
    setBulkUnit('letras')
    setIsGeneratingBulk(true)
    setBulkTotal(letras.length)
    setBulkCurrent(0)

    let totalInseridos = 0
    let totalSugeridos = 0
    const falhas: string[] = []

    // Processar uma letra por vez sequencialmente para evitar timeouts e rate-limits
    for (let i = 0; i < letras.length; i++) {
      const letra = letras[i]
      setBulkCurrent(i + 1)
      setBulkTermoAtual(`Letra ${letra}`)

      try {
        const res = await fetch('/api/admin/glossario/gerar-termos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nicho, letra, promptExtra, prefixo })
        })
        const data = await res.json()
        if (!res.ok) {
          falhas.push(letra)
          console.error(`Erro ao gerar títulos para a letra "${letra}":`, data.error)
        } else {
          totalSugeridos += data.totalSugeridos ?? 0
          totalInseridos += data.totalInseridos ?? 0
        }
      } catch (err) {
        falhas.push(letra)
        console.error(`Erro de conexão ao gerar títulos para a letra "${letra}":`, err)
      }
    }

    setIsGeneratingBulk(false)
    setLoadingSugerir(false)
    setPromptExtra('')
    await refreshList()

    if (totalInseridos > 0 || totalSugeridos > 0) {
      toast.success(
        `Concluído! ${totalInseridos} novos títulos adicionados (${totalSugeridos} sugeridos) em ${letras.length} letra(s).` +
        (falhas.length > 0 ? ` Falhas: ${falhas.join(', ')}.` : '')
      )
    } else {
      toast.error(
        falhas.length > 0
          ? `Falha ao gerar títulos nas letras: ${falhas.join(', ')}.`
          : 'Nenhum título novo foi adicionado (possíveis duplicatas).'
      )
    }
  }

  // Adicionar termo manualmente
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoTermoManual.trim()) return

    setLoadingManual(true)
    try {
      const letra = novoTermoManual.trim().charAt(0).toUpperCase()
      const res = await fetch('/api/admin/glossario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termo: novoTermoManual.trim(),
          letra,
          nicho
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar termo')

      toast.success(`Termo "${data.termo}" cadastrado com sucesso!`)
      setNovoTermoManual('')
      await refreshList()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingManual(false)
    }
  }

  // Salvar alteração inline
  const handleSaveEdit = async (id: string) => {
    if (!editingTermo.trim()) {
      toast.error('O termo não pode estar em branco.')
      return
    }

    setLoadingAcao(id)
    try {
      const res = await fetch('/api/admin/glossario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          termo: editingTermo.trim(),
          nicho: editingNicho.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar alteração')

      toast.success(`Verbete atualizado com sucesso!`)
      setEditingId(null)
      await refreshList()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingAcao(null)
    }
  }

  // Gerar definição de um único termo
  const handleGerarDefinicao = async (id: string, termoNome: string) => {
    setLoadingAcao(id)
    try {
      const res = await fetch('/api/admin/glossario/gerar-conteudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar definição')

      toast.success(`Definição para "${termoNome}" gerada e publicada!`)
      await refreshList()
    } catch (err: any) {
      toast.error(`Erro em "${termoNome}": ${err.message}`)
    } finally {
      setLoadingAcao(null)
    }
  }

  // Excluir termo
  const handleExcluirTermo = async (id: string, termoNome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o verbete "${termoNome}"?`)) return

    setLoadingAcao(id)
    try {
      const res = await fetch('/api/admin/glossario', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao excluir')
      }

      toast.success(`Verbete "${termoNome}" excluído.`)
      setSelectedIds(prev => prev.filter(x => x !== id))
      await refreshList()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingAcao(null)
    }
  }

  // Gerar em Lote (Bulk Queue)
  const handleGerarLote = async () => {
    if (selectedIds.length === 0) {
      toast.error('Nenhum termo selecionado para a geração em lote.')
      return
    }

    const pendentes = termos.filter(t => selectedIds.includes(t.id) && t.status === 'pendente')
    if (pendentes.length === 0) {
      toast.error('Nenhum dos termos selecionados está com status "Pendente".')
      return
    }

    setBulkLabel('Escrevendo Definições com IA')
    setBulkUnit('verbetes')
    setIsGeneratingBulk(true)
    setBulkTotal(pendentes.length)
    setBulkCurrent(0)

    // Processar um por um sequencialmente para evitar gargalos e timeouts
    for (let i = 0; i < pendentes.length; i++) {
      const t = pendentes[i]
      setBulkCurrent(i + 1)
      setBulkTermoAtual(t.termo)

      try {
        const res = await fetch('/api/admin/glossario/gerar-conteudo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: t.id })
        })

        if (!res.ok) {
          const data = await res.json()
          console.error(`Erro no lote para "${t.termo}":`, data.error)
        }
      } catch (err) {
        console.error(`Erro de conexão no lote para "${t.termo}":`, err)
      }
    }

    setIsGeneratingBulk(false)
    setSelectedIds([])
    toast.success('Geração em lote concluída!')
    await refreshList()
  }

  // Selecionar tudo filtrado
  const toggleSelectAll = (filteredTermos: Termo[]) => {
    const visibleIds = filteredTermos.map(t => t.id)
    const allSelected = visibleIds.every(id => selectedIds.includes(id))

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  // Filtragem local para alta performance
  const filteredTermos = termos.filter(t => {
    const matchesBusca =
      busca.trim() === '' ||
      t.termo.toLowerCase().includes(busca.toLowerCase()) ||
      t.nicho.toLowerCase().includes(busca.toLowerCase())

    const matchesStatus =
      statusFiltro === 'todos' || t.status === statusFiltro

    const matchesLetra =
      letraFiltro === null || t.letra === letraFiltro

    return matchesBusca && matchesStatus && matchesLetra
  })

  // Estatísticas
  const stats = {
    total: termos.length,
    publicados: termos.filter(t => t.status === 'publicado').length,
    pendentes: termos.filter(t => t.status === 'pendente').length
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
            <BookOpen className="size-6 text-brand-accent" />
            Glossário Ninja SEO
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            Gere verbetes e termos automaticamente via Inteligência Artificial otimizados para busca local (GEO)
          </p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Total de Termos</span>
            <h3 className="text-3xl font-black text-brand-text mt-1">{stats.total}</h3>
          </div>
          <span className="flex items-center justify-center size-10 rounded-lg bg-blue-500/10 text-blue-500">
            <BookOpen className="size-5" />
          </span>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Publicados / Indexados</span>
            <h3 className="text-3xl font-black text-emerald-500 mt-1">{stats.publicados}</h3>
          </div>
          <span className="flex items-center justify-center size-10 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-5" />
          </span>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Pendentes de Conteúdo</span>
            <h3 className="text-3xl font-black text-amber-500 mt-1">{stats.pendentes}</h3>
          </div>
          <span className="flex items-center justify-center size-10 rounded-lg bg-amber-500/10 text-amber-500">
            <Loader2 className="size-5 animate-spin-slow" />
          </span>
        </div>
      </div>

      {/* Painel Lote Ativo */}
      {isGeneratingBulk && (
        <div className="bg-brand-surface border-2 border-brand-accent/30 rounded-xl p-6 shadow-md relative overflow-hidden animate-pulse">
          <div className="absolute top-0 left-0 h-1 bg-brand-accent transition-all duration-300" style={{ width: `${(bulkCurrent / bulkTotal) * 100}%` }} />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center size-12 rounded-full bg-brand-accent/10 text-brand-accent">
                <Loader2 className="size-6 animate-spin" />
              </span>
              <div>
                <h4 className="font-bold text-brand-text text-base">{bulkLabel}</h4>
                <p className="text-brand-muted text-xs mt-0.5">
                  Processando <span className="text-brand-text font-semibold">"{bulkTermoAtual}"</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-1 shrink-0">
              <span className="font-mono text-sm font-bold text-brand-text">
                {bulkCurrent} de {bulkTotal} {bulkUnit} ({Math.round((bulkCurrent / bulkTotal) * 100)}%)
              </span>
              <div className="w-48 bg-brand-surface-2 border border-brand-border h-2 rounded-full overflow-hidden mt-1">
                <div className="bg-brand-accent h-full rounded-full transition-all duration-300" style={{ width: `${(bulkCurrent / bulkTotal) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corpo Layout Dividido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulários e Ações (Esquerda) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Sugestão IA */}
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
              <Bot className="size-4 text-brand-accent" />
              Gerador Ninja via IA
            </h3>
            <p className="text-xs text-brand-muted">
              Selecione uma, várias ou todas as letras e a IA gera automaticamente os títulos de cada uma em fila, salvando tudo no banco.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brand-muted uppercase">Nicho / Segmento</label>
                <input
                  type="text"
                  value={nicho}
                  onChange={e => setNicho(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Ex: brinquedos infláveis, festas"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brand-muted uppercase">Título / Pergunta do Termo</label>
                <select
                  value={prefixo}
                  onChange={e => setPrefixo(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="O que é">O que é...</option>
                  <option value="Como é">Como é...</option>
                  <option value="Como fazer">Como fazer...</option>
                  <option value="O que comprar">O que comprar...</option>
                  <option value="Onde alugar">Onde alugar...</option>
                  <option value="Nenhum">Nenhum (Apenas o Termo)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-brand-muted uppercase">
                    Letras ({letrasSugerir.length} selec.)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selecionarTodasLetras}
                      disabled={loadingSugerir || isGeneratingBulk}
                      className="text-[10px] font-bold uppercase text-brand-accent hover:underline disabled:opacity-50"
                    >
                      Todas
                    </button>
                    <span className="text-brand-border">·</span>
                    <button
                      type="button"
                      onClick={limparLetras}
                      disabled={loadingSugerir || isGeneratingBulk}
                      className="text-[10px] font-bold uppercase text-brand-muted hover:text-brand-text disabled:opacity-50"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {ALFABETO.map(l => {
                    const ativa = letrasSugerir.includes(l)
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLetra(l)}
                        disabled={loadingSugerir || isGeneratingBulk}
                        className={cn(
                          'h-8 text-xs font-bold rounded-md border transition-all duration-150 disabled:opacity-50',
                          ativa
                            ? 'bg-brand-accent border-brand-accent text-white font-black shadow-sm'
                            : 'border-brand-border text-brand-muted hover:border-brand-accent/50 hover:text-brand-text'
                        )}
                      >
                        {l}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-brand-muted pt-1">
                  Selecione várias letras (ou todas) para automatizar a criação dos títulos em fila.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-brand-muted uppercase">Instruções Extras (Opcional)</label>
                <textarea
                  value={promptExtra}
                  onChange={e => setPromptExtra(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-xs focus:outline-none focus:border-brand-accent transition-colors resize-none"
                  placeholder="Ex: Adicionar brinquedos de piscina, focar em buffets..."
                  rows={2}
                />
              </div>

              <button
                type="button"
                onClick={handleSugerirTermos}
                disabled={loadingSugerir || isGeneratingBulk}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {loadingSugerir ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {loadingSugerir
                  ? `IA Gerando Títulos${bulkTotal > 1 ? ` (${bulkCurrent}/${bulkTotal})` : ''}...`
                  : letrasSugerir.length > 1
                    ? `Gerar Títulos (${letrasSugerir.length} letras)`
                    : 'Sugerir Novos Verbetes'}
              </button>
            </div>
          </div>

          {/* Card Cadastro Manual */}
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
              <Plus className="size-4 text-brand-accent" />
              Cadastro Manual
            </h3>
            <form onSubmit={handleAddManual} className="space-y-3">
              <div className="space-y-1">
                <input
                  type="text"
                  value={novoTermoManual}
                  onChange={e => setNovoTermoManual(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Digite o termo..."
                />
              </div>
              <button
                type="submit"
                disabled={loadingManual || !novoTermoManual.trim() || isGeneratingBulk}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-surface-2 border border-brand-border hover:border-brand-accent/50 hover:bg-brand-surface disabled:opacity-50 text-brand-text font-bold text-sm py-2 rounded-lg transition-colors cursor-pointer"
              >
                {loadingManual ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Cadastrar Termo
              </button>
            </form>
          </div>
        </div>

        {/* Lista e Tabela (Direita) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-muted" />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg pl-9 pr-3 py-2 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Buscar por termo ou nicho..."
                />
              </div>

              {/* Filtro Status */}
              <div className="flex border border-brand-border rounded-lg overflow-hidden shrink-0 bg-brand-surface-2">
                {(['todos', 'pendente', 'publicado'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFiltro(s)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
                      statusFiltro === s
                        ? 'bg-brand-accent text-white font-bold'
                        : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface'
                    )}
                  >
                    {s === 'todos' ? 'Todos' : s === 'pendente' ? 'Pendente' : 'Publicado'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro Alfabético */}
            <div className="flex flex-wrap items-center gap-1 border-t border-brand-border pt-3">
              <button
                type="button"
                onClick={() => setLetraFiltro(null)}
                className={cn(
                  'h-6 px-2.5 text-[10px] font-bold rounded uppercase transition-all duration-150',
                  letraFiltro === null
                    ? 'bg-brand-accent text-white'
                    : 'bg-brand-surface-2 text-brand-muted hover:bg-brand-surface hover:text-brand-text border border-brand-border'
                )}
              >
                Tudo
              </button>
              {ALFABETO.map(l => {
                const count = termos.filter(t => t.letra === l).length
                if (count === 0) return null
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLetraFiltro(l)}
                    className={cn(
                      'h-6 px-2.5 text-[10px] font-bold rounded uppercase transition-all duration-150 flex items-center gap-1',
                      letraFiltro === l
                        ? 'bg-brand-accent text-white font-black'
                        : 'bg-brand-surface-2 text-brand-muted hover:bg-brand-surface hover:text-brand-text border border-brand-border'
                    )}
                  >
                    {l}
                    <span className={cn('text-[9px] font-mono px-0.5 rounded', letraFiltro === l ? 'bg-white/20' : 'bg-brand-surface border border-brand-border')}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Barra de Ações em Lote */}
          {selectedIds.length > 0 && (
            <div className="bg-brand-surface border border-brand-border rounded-xl px-4 py-3 flex items-center justify-between shadow-sm animate-fade-in">
              <span className="text-xs text-brand-muted font-medium">
                <span className="text-brand-text font-bold mr-1">{selectedIds.length}</span>
                itens selecionados
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGerarLote}
                  disabled={isGeneratingBulk}
                  className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/15 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  Gerar Definições
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-brand-muted hover:text-brand-text text-xs px-2"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Dados */}
          <div className="rounded-xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-brand-surface-2 border-b border-brand-border">
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredTermos.length > 0 && filteredTermos.every(t => selectedIds.includes(t.id))}
                        onChange={() => toggleSelectAll(filteredTermos)}
                        className="rounded border-brand-border focus:ring-brand-accent text-brand-accent cursor-pointer"
                      />
                    </th>
                    <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider">Termo / Nicho</th>
                    <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider w-16 text-center">Letra</th>
                    <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider w-28 text-center">Status</th>
                    <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredTermos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-brand-muted">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <AlertCircle className="size-8 text-brand-muted opacity-40 animate-pulse" />
                          <div>
                            <span className="text-sm font-semibold text-brand-text block">Nenhum verbete encontrado</span>
                            {busca.trim() ? (
                              <p className="text-xs text-brand-muted mt-1">
                                O termo <span className="font-mono text-brand-text font-bold">"{busca}"</span> não está cadastrado neste dicionário.
                              </p>
                            ) : (
                              <p className="text-xs text-brand-muted mt-1">Nenhum termo cadastrado com os filtros ativos.</p>
                            )}
                          </div>
                          {busca.trim() && (
                            <button
                              type="button"
                              onClick={async () => {
                                setLoadingManual(true)
                                const letra = busca.trim().charAt(0).toUpperCase()
                                try {
                                  const res = await fetch('/api/admin/glossario', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      termo: busca.trim(),
                                      letra,
                                      nicho: ''
                                    })
                                  })

                                  const data = await res.json()
                                  if (!res.ok) throw new Error(data.error ?? 'Erro ao criar termo')

                                  toast.success(`Termo "${data.termo}" cadastrado com sucesso!`)
                                  setBusca('')
                                  await refreshList()
                                } catch (err: any) {
                                  toast.error(err.message)
                                } finally {
                                  setLoadingManual(false)
                                }
                              }}
                              disabled={loadingManual}
                              className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-60 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                              {loadingManual ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Plus className="size-3.5" />
                              )}
                              Cadastrar "{busca}" no Dicionário
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTermos.map(t => {
                      const isSelected = selectedIds.includes(t.id)
                      const isProcessing = loadingAcao === t.id
                      const isEditing = editingId === t.id

                      return (
                        <tr
                          key={t.id}
                          className={cn(
                            'hover:bg-brand-surface-2/40 transition-colors',
                            isSelected && 'bg-brand-accent/5',
                            isEditing && 'bg-brand-surface-2'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="p-4 text-center">
                            {!isEditing && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                                className="rounded border-brand-border focus:ring-brand-accent text-brand-accent cursor-pointer"
                              />
                            )}
                          </td>

                          {/* Termo e Nicho */}
                          <td className="p-4">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingTermo}
                                  onChange={e => setEditingTermo(e.target.value)}
                                  className="w-full bg-brand-surface border border-brand-border rounded px-2.5 py-1.5 text-brand-text text-sm font-semibold focus:outline-none focus:border-brand-accent"
                                  placeholder="Nome do termo..."
                                />
                                <input
                                  type="text"
                                  value={editingNicho}
                                  onChange={e => setEditingNicho(e.target.value)}
                                  className="w-full bg-brand-surface border border-brand-border rounded px-2.5 py-1.5 text-brand-muted text-xs focus:outline-none focus:border-brand-accent"
                                  placeholder="Nicho..."
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-bold text-brand-text text-sm">{t.termo}</div>
                                <div className="text-xs text-brand-muted truncate max-w-[280px] mt-0.5" title={t.nicho}>
                                  {t.nicho}
                                </div>
                              </>
                            )}
                          </td>

                          {/* Letra */}
                          <td className="p-4 text-center font-black font-mono text-brand-text">
                            {isEditing ? editingTermo.charAt(0).toUpperCase() : t.letra}
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            {t.status === 'publicado' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <Check className="size-2.5" />
                                Publicado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <Loader2 className="size-2.5 animate-spin" />
                                Pendente
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleSaveEdit(t.id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                                    title="Salvar alterações"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <Check className="size-3" />
                                    )}
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-brand-surface-2 border border-brand-border hover:bg-brand-surface text-brand-muted transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Botão de Editar Inline */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(t.id)
                                      setEditingTermo(t.termo)
                                      setEditingNicho(t.nicho)
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-brand-surface-2 border border-brand-border hover:border-brand-accent/30 text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
                                    title="Editar nome/nicho"
                                  >
                                    Editar
                                  </button>

                                  {/* Gerar botão */}
                                  {t.status === 'pendente' && (
                                    <button
                                      type="button"
                                      disabled={isProcessing || isGeneratingBulk}
                                      onClick={() => handleGerarDefinicao(t.id, t.termo)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-brand-accent/10 hover:bg-brand-accent/15 border border-brand-accent/20 text-brand-accent transition-colors disabled:opacity-50 cursor-pointer"
                                      title="Escrever definição com IA"
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="size-3 animate-spin" />
                                      ) : (
                                        <Bot className="size-3" />
                                      )}
                                      Gerar
                                    </button>
                                  )}

                                  {/* Ver Página pública */}
                                  {t.status === 'publicado' && (
                                    <a
                                      href={`/glossario/${t.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-brand-surface-2 border border-brand-border hover:border-brand-accent/30 text-brand-muted hover:text-brand-text transition-colors"
                                      title="Ver no site público"
                                    >
                                      <ExternalLink className="size-3" />
                                      Ver
                                    </a>
                                  )}

                                  {/* Deletar */}
                                  <button
                                    type="button"
                                    disabled={isProcessing || isGeneratingBulk}
                                    onClick={() => handleExcluirTermo(t.id, t.termo)}
                                    className="p-1 rounded text-brand-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Excluir verbete"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
