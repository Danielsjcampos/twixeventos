'use client'

import { useState } from 'react'
import { useLenis } from 'lenis/react'
import { Package } from 'lucide-react'

interface CatalogHeaderProps {
  totalToys: number
}

export function CatalogHeader({ totalToys }: CatalogHeaderProps) {
  const [scrollY, setScrollY] = useState(0)
  
  useLenis(({ scroll }) => {
    setScrollY(scroll)
  })

  return (
    <div className="relative w-full overflow-hidden bg-brand-bg rounded-[2rem] border border-brand-border/40 mb-12 flex items-center min-h-[40vh]">
      
      {/* Background Interactive Parallax Layers */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.1]"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      >
        <div className="absolute -top-20 -right-20 w-[30rem] h-[30rem] bg-blue-600/40 rounded-full mix-blend-screen filter blur-[100px]" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-screen filter blur-[80px]" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, var(--color-foreground) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-16 text-center flex flex-col items-center">
        
        {/* Floating Badge */}
        <div 
          className="inline-flex items-center gap-2 bg-brand-surface/50 backdrop-blur-md border border-brand-border/50 text-brand-text text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-6"
          style={{ transform: `translateY(${-scrollY * 0.03}px)` }}
        >
          <Package className="w-4 h-4 text-brand-accent" />
          <span>Nosso Acervo</span>
        </div>

        <h1 
          className="font-[family-name:var(--font-display)] font-black text-brand-text leading-[0.9] tracking-tighter mb-6"
          style={{ 
            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
            transform: `translateY(${scrollY * 0.08}px)`,
            opacity: Math.max(0, 1 - scrollY / 400)
          }}
        >
          CATÁLOGO DE <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
            BRINQUEDOS
          </span>
        </h1>

        <p 
          className="text-brand-muted text-lg sm:text-xl font-medium"
          style={{ 
            transform: `translateY(${scrollY * 0.05}px)`,
            opacity: Math.max(0, 1 - scrollY / 300)
          }}
        >
          {totalToys} opções incríveis prontas para transformar sua festa.
        </p>
      </div>
    </div>
  )
}
