import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
})

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

import { getConfig } from '@/lib/db/queries/configuracoes'

export async function generateMetadata(): Promise<Metadata> {
  let siteNome: string | null = null
  let siteDesc: string | null = null
  let verification: string | null = null
  let ogImage: string | null = null
  let keywords: string | null = null

  try {
    const configs = await Promise.all([
      getConfig('seo_titulo_padrao'),
      getConfig('seo_descricao_padrao'),
      getConfig('google_site_verification'),
      getConfig('og_image_url'),
      getConfig('seo_palavras_chave'),
    ])
    siteNome = configs[0]
    siteDesc = configs[1]
    verification = configs[2]
    ogImage = configs[3]
    keywords = configs[4]
  } catch (err) {
    console.error('Failed to load SEO configs from database:', err)
  }

  const defaultTitle = siteNome || 'Twix Eventos | Locação de Brinquedos Infláveis em São José dos Campos'
  const defaultDesc = siteDesc || 'Aluguel de brinquedos infláveis e eletrônicos para festas e eventos em São José dos Campos e Vale do Paraíba. +455 avaliações 5 estrelas. Reserve via WhatsApp!'
  
  let verificationCode = verification || 'sOErGYUnZRbuGblqxlqk0dHAOXatTtil_nWr6tzt9IE'
  const trimmedCode = verificationCode.trim()
  let googleVerification = trimmedCode
  if (trimmedCode.startsWith('<meta') || trimmedCode.includes('content=')) {
    const match = trimmedCode.match(/content=["']([^"']+)["']/)
    if (match) {
      googleVerification = match[1]
    }
  }

  const defaultKeywords = keywords ? keywords.split(',').map(k => k.trim()) : [
    'brinquedos infláveis',
    'locação',
    'São José dos Campos',
    'festas',
    'eventos',
    'tobogã',
    'touro mecânico',
  ]

  return {
    title: {
      default: defaultTitle,
      template: '%s | Twix Eventos',
    },
    description: defaultDesc,
    keywords: defaultKeywords,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: 'https://twixeventos.com',
      siteName: 'Twix Eventos',
      images: [{ url: ogImage || 'https://twixeventos.com/wp-content/uploads/2025/01/tw.jpg' }],
    },
    verification: {
      google: googleVerification,
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
