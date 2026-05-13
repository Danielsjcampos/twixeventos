'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export function ThemeToggle({ className }: Props) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className={cn('w-9 h-9 rounded-lg', className)} />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
        'text-brand-muted hover:text-brand-accent hover:bg-brand-surface-2',
        className,
      )}
    >
      <Sun
        className={cn(
          'absolute size-4 transition-all duration-300',
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100',
        )}
      />
      <Moon
        className={cn(
          'absolute size-4 transition-all duration-300',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50',
        )}
      />
    </button>
  )
}
