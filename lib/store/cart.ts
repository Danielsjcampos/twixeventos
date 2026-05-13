'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  nome: string
  slug: string
  fotoDestaque: string | null
  categoria: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  add: (item: CartItem) => void
  remove: (id: string) => void
  clear: () => void
  open: () => void
  close: () => void
  toggle: () => void
  has: (id: string) => boolean
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item) => {
        if (!get().has(item.id)) {
          set((s) => ({ items: [...s.items, item], isOpen: true }))
        }
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: 'twix-cart', skipHydration: true }
  )
)
