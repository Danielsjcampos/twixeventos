'use client'

import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

// Syncs Lenis scroll position with GSAP ScrollTrigger so pins/animations
// fire at the correct time instead of the native scroll position
function ScrollTriggerSync() {
  useLenis(() => {
    // Dynamically import to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.update()
      })
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cleanup: (() => void) | undefined
    import('gsap').then(({ gsap }) =>
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger)
        // Small delay to let Lenis initialize first
        const t = setTimeout(() => ScrollTrigger.refresh(), 200)
        cleanup = () => clearTimeout(t)
      })
    )
    return () => cleanup?.()
  }, [])

  return null
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 0.96,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
      }}
    >
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  )
}
