'use client'

import { useState, useTransition } from 'react'
import {
  FileText, Plus, Search, Bot, Sparkles, RefreshCw, Trash2, Check,
  Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink, HelpCircle,
  Eye, Calendar, Tag, Layers, ChevronRight, Edit3, Save, ArrowLeft, Image as ImageIcon, Dices, ListOrdered
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SingleImageUpload } from './SingleImageUpload'
import { saveConfigs } from '@/app/actions/configuracoes'

interface BlogPost {
  id?: string
  titulo: string
  slug: string
  conteudo: string
  resumo: string | null
  fotoDestaque: string | null
  categoria: string
  tags: string[]
  status: 'rascunho' | 'publicado'
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  tempoLeitura: number
  visualizacoes: number
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface Props {
  initialPosts: BlogPost[]
  initialFallbackImages: string[]
  initialKeywordQueue: string[]
}

const CATEGORIES = ['Dicas de Festa', 'Lazer e Diversão', 'Planejamento', 'Brinquedos', 'Eventos Corporativos']

export function BlogManagement({ initialPosts, initialFallbackImages, initialKeywordQueue }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [fallbackImages, setFallbackImages] = useState<string[]>(initialFallbackImages)
  const [keywordQueue, setKeywordQueue] = useState<string[]>(initialKeywordQueue)
  const [activeTab, setActiveTab] = useState<'posts' | 'fallback'>('posts')

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'rascunho' | 'publicado'>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  
  // AI Generation States
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationKeyword, setGenerationKeyword] = useState('')
  const [generationStep, setGenerationStep] = useState<number>(0)
  const [generationMsg, setGenerationMsg] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)

  // Queue Inputs
  const [newQueueKeyword, setNewQueueKeyword] = useState('')
  const [savingQueue, setSavingQueue] = useState(false)

  const [loadingAcao, setLoadingAcao] = useState<string | null>(null)
  const [savingFallback, setSavingFallback] = useState(false)
  const [pending, startTransition] = useTransition()

  // Refresh data from API
  const refreshList = async () => {
    try {
      const res = await fetch('/api/admin/blog')
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch (err) {
      console.error('Erro ao recarregar posts:', err)
    }
  }

  // Create empty post
  const handleCreateEmpty = () => {
    setEditingPost({
      titulo: '',
      slug: '',
      conteudo: '',
      resumo: '',
      fotoDestaque: null,
      categoria: 'Dicas de Festa',
      tags: [],
      status: 'rascunho',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      tempoLeitura: 5,
      visualizacoes: 0
    })
    setImagePrompt('')
    setIsEditing(true)
  }

  // Trigger AI Generation Sequence
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generationKeyword.trim()) {
      toast.error('Por favor, informe a palavra-chave/tema.')
      return
    }

    setIsGenerating(true)
    setGenerationStep(1)
    setGenerationMsg('Analisando o tema e planejando a estrutura SEO local...')

    try {
      await new Promise(r => setTimeout(r, 1200))
      
      setGenerationStep(2)
      setGenerationMsg('Escrevendo a introdução e desenvolvendo os tópicos (H2) principais...')

      const res = await fetch('/api/admin/blog/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: generationKeyword.trim() })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Falha ao gerar o conteúdo')
      }

      setGenerationStep(3)
      setGenerationMsg('Otimizando parágrafos para SEO e ajustando metadados...')
      await new Promise(r => setTimeout(r, 1500))

      const data = await res.json()
      const generated = data.post

      setGenerationStep(4)
      setGenerationMsg('Formatando a resposta final...')
      await new Promise(r => setTimeout(r, 800))

      // Pre-fill the editor with the AI generated post
      setEditingPost({
        titulo: generated.title || '',
        slug: generated.slug || '',
        conteudo: generated.conteudo || '',
        resumo: generated.excerpt || '',
        fotoDestaque: null,
        categoria: generated.category || 'Dicas de Festa',
        tags: generated.tags || [],
        status: 'rascunho',
        seoTitle: generated.seoTitle || '',
        seoDescription: generated.seoDescription || '',
        seoKeywords: generated.seoKeywords || '',
        tempoLeitura: Math.ceil((generated.conteudo || '').split(/\s+/).length / 200) || 5,
        visualizacoes: 0
      })

      if (generated.imagePrompt) {
        setImagePrompt(generated.imagePrompt)
      }

      toast.success('Artigo gerado pela IA com sucesso! Edite ou salve abaixo.')
      setIsGenerating(false)
      setIsEditing(true)
      setGenerationKeyword('')
    } catch (err: any) {
      toast.error(`Erro na geração: ${err.message}`)
      setIsGenerating(false)
    }
  }

  // Generate featured image with DALL-E
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Nenhum prompt de imagem disponível.')
      return
    }

    setGeneratingImage(true)
    const toastId = toast.loading('Gerando imagem de destaque via DALL-E 3 (pode demorar até 15s)...')

    try {
      const res = await fetch('/api/admin/blog/gerar-imagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          slug: editingPost?.slug || 'post-capa'
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar imagem')

      setEditingPost(prev => prev ? { ...prev, fotoDestaque: data.url } : null)
      toast.success('Imagem destacada gerada e salva localmente!', { id: toastId })
    } catch (err: any) {
      toast.error(`Erro ao gerar imagem: ${err.message}`, { id: toastId })
    } finally {
      setGeneratingImage(false)
    }
  }

  // Pick a random image from the fallback gallery
  const handlePickRandomFallback = () => {
    if (fallbackImages.length === 0) {
      toast.error('Nenhuma imagem cadastrada na galeria fallback.')
      return
    }
    const idx = Math.floor(Math.random() * fallbackImages.length)
    const url = fallbackImages[idx]
    setEditingPost(prev => prev ? { ...prev, fotoDestaque: url } : null)
    toast.success('Imagem sorteada da galeria fallback!')
  }

  // Save Post (create or update)
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPost) return

    if (!editingPost.titulo.trim() || !editingPost.conteudo.trim()) {
      toast.error('Título e Conteúdo são obrigatórios.')
      return
    }

    let postToSave = { ...editingPost }

    // If published and cover is empty, auto-assign from fallback gallery
    if (postToSave.status === 'publicado' && !postToSave.fotoDestaque && fallbackImages.length > 0) {
      const idx = Math.floor(Math.random() * fallbackImages.length)
      postToSave.fotoDestaque = fallbackImages[idx]
      toast.info('Post publicado sem capa! Associamos uma imagem da galeria fallback automaticamente.')
    }

    const isUpdate = !!postToSave.id
    const method = isUpdate ? 'PATCH' : 'POST'
    const endpoint = isUpdate ? `/api/admin/blog/${postToSave.id}` : '/api/admin/blog'

    setLoadingAcao(postToSave.id || 'new')
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postToSave)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar post')

      toast.success(isUpdate ? 'Post de blog atualizado com sucesso!' : 'Novo post criado com sucesso!')
      setIsEditing(false)
      setEditingPost(null)
      setImagePrompt('')
      await refreshList()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingAcao(null)
    }
  }

  // Delete Post
  const handleDeletePost = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o post "${titulo}"?`)) return

    setLoadingAcao(id)
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao excluir')
      }

      toast.success(`Post "${titulo}" excluído.`)
      await refreshList()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingAcao(null)
    }
  }

  // Manage Fallback Gallery
  const handleAddFallbackImage = async (url: string) => {
    setSavingFallback(true)
    const updatedList = [...fallbackImages, url]
    try {
      await saveConfigs({ blog_fallback_imagens: JSON.stringify(updatedList) })
      setFallbackImages(updatedList)
      toast.success('Imagem adicionada à galeria fallback!')
    } catch {
      toast.error('Erro ao salvar galeria fallback no banco.')
    } finally {
      setSavingFallback(false)
    }
  }

  const handleRemoveFallbackImage = async (url: string) => {
    setSavingFallback(true)
    const updatedList = fallbackImages.filter(img => img !== url)
    try {
      await saveConfigs({ blog_fallback_imagens: JSON.stringify(updatedList) })
      setFallbackImages(updatedList)
      toast.success('Imagem removida da galeria fallback.')
    } catch {
      toast.error('Erro ao atualizar galeria fallback no banco.')
    } finally {
      setSavingFallback(false)
    }
  }

  // Manage Keyword Queue
  const handleAddQueueKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQueueKeyword.trim()) return

    setSavingQueue(true)
    const updatedQueue = [...keywordQueue, newQueueKeyword.trim()]
    try {
      await saveConfigs({ blog_keyword_queue: JSON.stringify(updatedQueue) })
      setKeywordQueue(updatedQueue)
      setNewQueueKeyword('')
      toast.success(`Tema "${newQueueKeyword}" adicionado à fila cron!`)
    } catch {
      toast.error('Erro ao salvar fila no banco.')
    } finally {
      setSavingQueue(false)
    }
  }

  const handleRemoveQueueKeyword = async (keywordToRemove: string) => {
    setSavingQueue(true)
    const updatedQueue = keywordQueue.filter(k => k !== keywordToRemove)
    try {
      await saveConfigs({ blog_keyword_queue: JSON.stringify(updatedQueue) })
      setKeywordQueue(updatedQueue)
      toast.success('Tema removido da fila cron.')
    } catch {
      toast.error('Erro ao atualizar fila no banco.')
    } finally {
      setSavingQueue(false)
    }
  }

  // Filter lists locally
  const filteredPosts = posts.filter(p => {
    const matchesBusca =
      busca.trim() === '' ||
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase())

    const matchesStatus =
      statusFiltro === 'todos' || p.status === statusFiltro

    const matchesCategoria =
      categoriaFiltro === 'todos' || p.categoria === categoriaFiltro

    return matchesBusca && matchesStatus && matchesCategoria
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
            <FileText className="size-6 text-brand-accent" />
            Blog SEO Otimizado
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            Crie, publique e gere artigos de alta conversão otimizados localmente com Inteligência Artificial.
          </p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            {/* Tab selection pills */}
            <div className="flex border border-brand-border rounded-xl overflow-hidden bg-brand-surface-2 p-0.5 shadow-sm">
              <button
                onClick={() => setActiveTab('posts')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  activeTab === 'posts' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-brand-text'
                )}
              >
                Artigos
              </button>
              <button
                onClick={() => setActiveTab('fallback')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeTab === 'fallback' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-brand-text'
                )}
              >
                <ImageIcon className="size-3.5" />
                Galeria Fallback
                {fallbackImages.length > 0 && (
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono', activeTab === 'fallback' ? 'bg-white/20 text-white' : 'bg-brand-surface border border-brand-border text-brand-text')}>
                    {fallbackImages.length}
                  </span>
                )}
              </button>
            </div>
            
            {activeTab === 'posts' && (
              <button
                onClick={handleCreateEmpty}
                className="inline-flex items-center gap-2 bg-brand-surface-2 border border-brand-border hover:bg-brand-surface text-brand-text font-bold text-sm px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
              >
                <Plus className="size-4" />
                Escrever Manual
              </button>
            )}
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="bg-brand-surface border-2 border-brand-accent/30 rounded-2xl p-6 shadow-md relative overflow-hidden animate-pulse">
          <div className="absolute top-0 left-0 h-1 bg-brand-accent transition-all duration-500" style={{ width: `${(generationStep / 4) * 100}%` }} />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center size-12 rounded-full bg-brand-accent/10 text-brand-accent">
                <Loader2 className="size-6 animate-spin" />
              </span>
              <div>
                <h4 className="font-bold text-brand-text text-base">Escrevendo Post de Blog com IA</h4>
                <p className="text-brand-muted text-xs mt-0.5">{generationMsg}</p>
              </div>
            </div>
            <div className="font-mono text-sm font-bold text-brand-text shrink-0">
              Passo {generationStep} de 4 ({Math.round((generationStep / 4) * 100)}%)
            </div>
          </div>
        </div>
      )}

      {isEditing && editingPost ? (
        /* ================== EDITOR VIEW ================== */
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setEditingPost(null)
                setImagePrompt('')
              }}
              className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-accent transition-colors font-bold"
            >
              <ArrowLeft className="size-4" />
              Voltar para a Lista
            </button>
            <span className="text-sm text-brand-muted font-semibold uppercase tracking-wider">
              {editingPost.id ? 'Editando Artigo' : 'Novo Artigo Gerado / Rascunho'}
            </span>
          </div>

          <form onSubmit={handleSavePost} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coluna Principal Form */}
              <div className="md:col-span-2 space-y-5">
                {/* Título */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-brand-muted uppercase">Título do Post</label>
                  <input
                    type="text"
                    required
                    value={editingPost.titulo}
                    onChange={e => setEditingPost({ ...editingPost, titulo: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-brand-text font-semibold text-base focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-150"
                    placeholder="Ex: 5 Dicas para Escolher os Melhores Brinquedos Infláveis em SJC"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-brand-muted uppercase">Slug (URL amigável)</label>
                  <input
                    type="text"
                    value={editingPost.slug}
                    onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-brand-text text-sm font-mono focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-150"
                    placeholder="ex-cinco-dicas-brinquedos-inflaveis-sjc"
                  />
                </div>

                {/* Categoria e Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-brand-muted uppercase">Categoria</label>
                    <select
                      value={editingPost.categoria}
                      onChange={e => setEditingPost({ ...editingPost, categoria: e.target.value })}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      {!CATEGORIES.includes(editingPost.categoria) && (
                        <option value={editingPost.categoria}>{editingPost.categoria}</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-brand-muted uppercase">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={editingPost.tags.join(', ')}
                      onChange={e => setEditingPost({
                        ...editingPost,
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      })}
                      className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-all duration-150"
                      placeholder="Festa Infantil, Brinquedos SJC, Lazer"
                    />
                  </div>
                </div>

                {/* Resumo */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-brand-muted uppercase">Resumo (Excerpt para buscas)</label>
                  <textarea
                    rows={2}
                    value={editingPost.resumo || ''}
                    onChange={e => setEditingPost({ ...editingPost, resumo: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors resize-none"
                    placeholder="Um resumo curto do post com no máximo 160 caracteres..."
                  />
                </div>

                {/* Conteúdo HTML */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-brand-muted uppercase">Conteúdo do Artigo (HTML)</label>
                    <span className="text-[10px] text-brand-muted font-medium">Use tags &lt;h2&gt; para estruturar o artigo</span>
                  </div>
                  <textarea
                    rows={12}
                    required
                    value={editingPost.conteudo}
                    onChange={e => setEditingPost({ ...editingPost, conteudo: e.target.value })}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm font-mono focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="<h2>Introdução</h2><p>Texto do parágrafo...</p>"
                  />
                </div>
              </div>

              {/* Coluna Sidebar Form */}
              <div className="space-y-6">
                {/* Imagem Destacada */}
                <div className="rounded-xl border border-brand-border p-4 bg-brand-surface space-y-4 shadow-sm">
                  <h4 className="font-bold text-xs text-brand-muted uppercase flex items-center gap-1.5">
                    <ImageIcon className="size-4 text-brand-accent" />
                    Imagem de Capa
                  </h4>
                  <SingleImageUpload
                    value={editingPost.fotoDestaque || ''}
                    onChange={url => setEditingPost({ ...editingPost, fotoDestaque: url })}
                    onRemove={() => setEditingPost({ ...editingPost, fotoDestaque: null })}
                    label="Selecionar imagem destacada"
                  />
                  
                  {/* Fallback button if available */}
                  {fallbackImages.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePickRandomFallback}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-surface-2 border border-brand-border hover:border-brand-accent/50 hover:bg-brand-surface text-brand-text font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      <Dices className="size-3.5 text-brand-accent" />
                      Sortear da Galeria Fallback
                    </button>
                  )}

                  {imagePrompt && (
                    <div className="border border-brand-border rounded-xl p-3 bg-brand-surface-2 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-brand-muted font-bold uppercase">
                        <Bot className="size-3.5 text-brand-accent" />
                        Prompt da Capa Gerada
                      </div>
                      <p className="text-[11px] text-brand-muted leading-relaxed select-all italic bg-brand-surface p-2 rounded-lg border border-brand-border">
                        {imagePrompt}
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-60 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        {generatingImage ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        {generatingImage ? 'Gerando DALL-E...' : 'Gerar Imagem com DALL-E'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bloco SEO */}
                <div className="rounded-xl border border-brand-border p-4 bg-brand-surface space-y-4 shadow-sm">
                  <h4 className="font-bold text-xs text-brand-muted uppercase flex items-center gap-1.5">
                    <Sparkles className="size-4 text-brand-accent" />
                    Configurações de SEO
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-brand-muted uppercase">SEO Title</label>
                      <input
                        type="text"
                        value={editingPost.seoTitle || ''}
                        onChange={e => setEditingPost({ ...editingPost, seoTitle: e.target.value })}
                        className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-brand-text text-xs focus:outline-none focus:border-brand-accent"
                        placeholder="Título da página no Google"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-brand-muted uppercase">SEO Description</label>
                      <textarea
                        rows={2}
                        value={editingPost.seoDescription || ''}
                        onChange={e => setEditingPost({ ...editingPost, seoDescription: e.target.value })}
                        className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-brand-text text-xs focus:outline-none focus:border-brand-accent resize-none"
                        placeholder="Meta description de no máximo 155 caracteres"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-brand-muted uppercase">SEO Keywords (foco)</label>
                      <input
                        type="text"
                        value={editingPost.seoKeywords || ''}
                        onChange={e => setEditingPost({ ...editingPost, seoKeywords: e.target.value })}
                        className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-brand-text text-xs focus:outline-none focus:border-brand-accent"
                        placeholder="Festa infantil SJC, aluguel de brinquedos"
                      />
                    </div>
                  </div>
                </div>

                {/* Status e Ações */}
                <div className="rounded-xl border border-brand-border p-4 bg-brand-surface space-y-4 shadow-sm">
                  <h4 className="font-bold text-xs text-brand-muted uppercase">Publicação</h4>
                  <div className="flex border border-brand-border rounded-lg overflow-hidden shrink-0 bg-brand-surface-2">
                    {(['rascunho', 'publicado'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditingPost({ ...editingPost, status: s })}
                        className={cn(
                          'flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                          editingPost.status === s
                            ? s === 'publicado' ? 'bg-emerald-500 text-white font-bold' : 'bg-brand-accent text-white font-bold'
                            : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface'
                        )}
                      >
                        {s === 'rascunho' ? 'Rascunho' : 'Publicar'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loadingAcao === (editingPost.id || 'new')}
                    className="w-full inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    {loadingAcao === (editingPost.id || 'new') ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : activeTab === 'fallback' ? (
        /* ================== FALLBACK GALLERY VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Upload panel (Esquerda) */}
          <div className="lg:col-span-4 space-y-6 bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
              <ImageIcon className="size-5 text-brand-accent" />
              Adicionar à Galeria Fallback
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Faça upload de fotos genéricas de alta qualidade sobre festas, brinquedos infláveis ou eventos. Se um artigo for publicado sem uma imagem destacada, o sistema sorteará aleatoriamente uma dessas fotos para atuar como capa automaticamente!
            </p>
            <div className="pt-2">
              <SingleImageUpload
                value=""
                onChange={handleAddFallbackImage}
                onRemove={() => {}}
                label="Clique para enviar nova foto de fallback"
              />
            </div>
            {savingFallback && (
              <div className="flex items-center gap-2 text-xs text-brand-accent font-semibold justify-center">
                <Loader2 className="size-3.5 animate-spin" />
                Atualizando galeria no banco de dados...
              </div>
            )}
          </div>

          {/* Grid display (Direita) */}
          <div className="lg:col-span-8 bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-brand-text">
              Fotos da Galeria ({fallbackImages.length})
            </h3>
            {fallbackImages.length === 0 ? (
              <div className="text-center py-16 text-brand-muted border-2 border-dashed border-brand-border rounded-xl">
                <ImageIcon className="size-8 opacity-40 mx-auto mb-2" />
                <span className="text-sm font-semibold text-brand-text block">Galeria Fallback Vazia</span>
                <p className="text-xs text-brand-muted mt-1">Envie fotos no painel lateral esquerdo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {fallbackImages.map((imgUrl, i) => (
                  <div key={i} className="relative rounded-xl border border-brand-border overflow-hidden aspect-video bg-brand-surface-2 group">
                    <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                      <button
                        onClick={() => handleRemoveFallbackImage(imgUrl)}
                        disabled={savingFallback}
                        className="bg-red-500/95 hover:bg-red-600 text-white p-2 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================== POSTS LIST VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Gerador IA & Fila Cron (Esquerda) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bloco Gerador Manual Instantâneo */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
                <Bot className="size-5 text-brand-accent" />
                Gerador Instantâneo via IA
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Insira um tema e a IA criará o artigo na hora. Você poderá revisar, ajustar a capa e decidir se publica ou salva como rascunho.
              </p>
              
              <form onSubmit={handleAIGenerate} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-brand-muted uppercase">Palavra-chave / Tema do Artigo</label>
                  <input
                    type="text"
                    required
                    value={generationKeyword}
                    onChange={e => setGenerationKeyword(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-3.5 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="Ex: Como planejar um aniversário infantil..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingAcao !== null || isGenerating}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  <Sparkles className="size-4" />
                  Gerar Artigo Agora
                </button>
              </form>
            </div>

            {/* Bloco Fila Cron Automático */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
                <ListOrdered className="size-5 text-brand-accent" />
                Fila de Temas (Autopilot / Cron)
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Adicione temas na fila abaixo. O cron de automação diário consumirá o primeiro tema e publicará o artigo automaticamente. <strong>Se a fila esvaziar, o Autopilot criará temas inéditos sozinho!</strong>
              </p>

              <form onSubmit={handleAddQueueKeyword} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newQueueKeyword}
                    onChange={e => setNewQueueKeyword(e.target.value)}
                    disabled={savingQueue}
                    className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-1.5 text-brand-text text-xs focus:outline-none focus:border-brand-accent"
                    placeholder="Novo tema para fila..."
                  />
                  <button
                    type="submit"
                    disabled={savingQueue || !newQueueKeyword.trim()}
                    className="bg-brand-surface-2 border border-brand-border hover:border-brand-accent/50 text-brand-text font-bold text-xs px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    {savingQueue ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3.5" />}
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-brand-border/60">
                <h4 className="text-[11px] font-bold text-brand-muted uppercase">Próximas publicações ({keywordQueue.length}):</h4>
                {keywordQueue.length === 0 ? (
                  <p className="text-[11px] text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 leading-relaxed">
                    Fila vazia! O Autopilot de IA está ativo e escolherá tópicos de forma 100% autônoma nas próximas execuções.
                  </p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                    {keywordQueue.map((keyword, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 bg-brand-surface-2/40 border border-brand-border/60 rounded-lg px-2.5 py-1.5 text-xs">
                        <span className="truncate font-medium text-brand-text">
                          {i + 1}. {keyword}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQueueKeyword(keyword)}
                          disabled={savingQueue}
                          className="text-brand-muted hover:text-red-500 shrink-0 cursor-pointer"
                          title="Remover da fila"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista e Tabela (Direita) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filtros e Busca */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-muted" />
                  <input
                    type="text"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-3 py-2 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="Buscar por título ou categoria..."
                  />
                </div>

                {/* Filtro Status */}
                <div className="flex border border-brand-border rounded-lg overflow-hidden shrink-0 bg-brand-surface-2">
                  {(['todos', 'rascunho', 'publicado'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFiltro(s)}
                      className={cn(
                        'px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                        statusFiltro === s
                          ? 'bg-brand-accent text-white font-bold'
                          : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface'
                      )}
                    >
                      {s === 'todos' ? 'Todos' : s === 'rascunho' ? 'Rascunho' : 'Publicado'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorias Filtro Horizontal */}
              <div className="flex flex-wrap items-center gap-1 border-t border-brand-border pt-3">
                <button
                  type="button"
                  onClick={() => setCategoriaFiltro('todos')}
                  className={cn(
                    'h-6 px-2.5 text-[10px] font-bold rounded uppercase transition-all duration-150',
                    categoriaFiltro === 'todos'
                      ? 'bg-brand-accent text-white'
                      : 'bg-brand-surface-2 text-brand-muted hover:bg-brand-surface hover:text-brand-text border border-brand-border'
                  )}
                >
                  Todas
                </button>
                {CATEGORIES.map(cat => {
                  const count = posts.filter(p => p.categoria === cat).length
                  if (count === 0) return null
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaFiltro(cat)}
                      className={cn(
                        'h-6 px-2.5 text-[10px] font-bold rounded uppercase transition-all duration-150 flex items-center gap-1',
                        categoriaFiltro === cat
                          ? 'bg-brand-accent text-white font-black'
                          : 'bg-brand-surface-2 text-brand-muted hover:bg-brand-surface hover:text-brand-text border border-brand-border'
                      )}
                    >
                      {cat}
                      <span className={cn('text-[9px] font-mono px-1 rounded', categoriaFiltro === cat ? 'bg-white/20' : 'bg-brand-surface border border-brand-border')}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tabela de Posts */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-brand-surface-2 border-b border-brand-border">
                      <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider">Artigo / Categoria</th>
                      <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider w-24 text-center">Tempo</th>
                      <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider w-24 text-center">Leituras</th>
                      <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider w-28 text-center">Status</th>
                      <th className="p-4 font-bold text-brand-muted text-xs uppercase tracking-wider w-28 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-brand-muted">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <AlertCircle className="size-8 text-brand-muted opacity-40 animate-pulse" />
                            <div>
                              <span className="text-sm font-semibold text-brand-text block">Nenhum artigo encontrado</span>
                              <p className="text-xs text-brand-muted mt-1">Crie um novo artigo manual ou use o gerador por IA.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map(post => (
                        <tr key={post.id} className="hover:bg-brand-surface-2/40 transition-colors">
                          <td className="p-4 max-w-[280px]">
                            <div className="flex items-center gap-3">
                              {post.fotoDestaque ? (
                                <img src={post.fotoDestaque} className="size-10 rounded-lg object-cover border border-brand-border shrink-0" alt="" />
                              ) : (
                                <div className="size-10 rounded-lg bg-brand-surface-2 border border-brand-border shrink-0 flex items-center justify-center text-brand-muted">
                                  <ImageIcon className="size-4" />
                                </div>
                              )}
                              <div className="truncate">
                                <span className="font-extrabold text-brand-text hover:text-brand-accent transition-colors cursor-pointer truncate block" onClick={() => { setEditingPost(post); setIsEditing(true); }}>
                                  {post.titulo}
                                </span>
                                <span className="text-xs text-brand-muted mt-0.5 inline-flex items-center gap-1">
                                  <Layers className="size-3" />
                                  {post.categoria}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center text-brand-muted font-medium font-mono text-xs">
                            {post.tempoLeitura} min
                          </td>
                          <td className="p-4 text-center text-brand-muted font-medium font-mono text-xs">
                            {post.visualizacoes}
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border',
                              post.status === 'publicado'
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                                : 'bg-brand-muted/10 border-brand-border text-brand-muted'
                            )}>
                              {post.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Editar"
                                onClick={() => { setEditingPost(post); setIsEditing(true); }}
                                className="size-8 rounded-lg bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 flex items-center justify-center transition-all cursor-pointer"
                              >
                                <Edit3 className="size-3.5" />
                              </button>
                              {post.status === 'publicado' && (
                                <a
                                  href={`/blog/${post.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="size-8 rounded-lg bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 flex items-center justify-center transition-all"
                                >
                                  <Eye className="size-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                title="Excluir"
                                disabled={loadingAcao === post.id}
                                onClick={() => handleDeletePost(post.id!, post.titulo)}
                                className="size-8 rounded-lg bg-brand-surface-2 border border-brand-border text-brand-muted hover:text-red-500 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer"
                              >
                                {loadingAcao === post.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FlagToggleProps {
  icon: any
  titulo: string
  descricao: string
  ativo: boolean
  salvando: boolean
  onToggle: () => void
}

function FlagToggle({ icon: Icon, titulo, descricao, ativo, salvando, onToggle }: FlagToggleProps) {
  return (
    <div className="flex items-start justify-between p-3.5 rounded-lg border border-brand-border bg-brand-surface-2/30">
      <div className="flex gap-3">
        <span className={cn('flex items-center justify-center size-8 rounded-lg shrink-0 border border-brand-border bg-brand-surface', ativo ? 'text-brand-accent' : 'text-brand-muted')}>
          <Icon className="size-4" />
        </span>
        <div>
          <span className="text-xs font-bold text-brand-text block">{titulo}</span>
          <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5">{descricao}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={salvando}
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shrink-0 self-center',
          ativo ? 'bg-brand-accent' : 'bg-brand-border'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            ativo ? 'translate-x-4' : 'translate-x-0'
          )}
        >
          {salvando && (
            <Loader2 className="size-2.5 animate-spin text-brand-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          )}
        </span>
      </button>
    </div>
  )
}
