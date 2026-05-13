'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/store/cart'
import { useEffect, useState } from 'react'

export function CartButton() {
  const { items, toggle } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const count = mounted ? items.length : 0

  return (
    <button
      onClick={toggle}
      aria-label={`Orçamento (${count} itens)`}
      className="relative flex items-center justify-center p-2 text-brand-text hover:text-brand-accent transition-colors rounded-lg hover:bg-brand-surface-2"
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
