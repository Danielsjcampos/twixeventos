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

export const metadata: Metadata = {
  title: {
    default: 'Twix Eventos | Locação de Brinquedos Infláveis em São José dos Campos',
    template: '%s | Twix Eventos',
  },
  description:
    'Aluguel de brinquedos infláveis e eletrônicos para festas e eventos em São José dos Campos e Vale do Paraíba. +455 avaliações 5 estrelas. Reserve via WhatsApp!',
  keywords: ['brinquedos infláveis', 'locação', 'São José dos Campos', 'festas', 'eventos', 'tobogã', 'touro mecânico'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://twixeventos.com',
    siteName: 'Twix Eventos',
    images: [{ url: 'https://twixeventos.com/wp-content/uploads/2025/01/tw.jpg' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
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
