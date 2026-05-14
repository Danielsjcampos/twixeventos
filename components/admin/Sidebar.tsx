'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Package, Calendar,
  Settings, LogOut, UserCheck, DollarSign, UserCog, Contact, Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin',               label: 'Dashboard',        icon: LayoutDashboard, exact: true },
  { href: '/admin/leads',         label: 'Leads / CRM',      icon: Users },
  { href: '/admin/clientes',      label: 'Clientes',         icon: Contact },
  { href: '/admin/brinquedos',    label: 'Brinquedos',       icon: Package },
  { href: '/admin/eventos',       label: 'Eventos',          icon: Calendar },
  { href: '/admin/monitores',     label: 'Monitores',        icon: UserCheck },
  { href: '/admin/financeiro',    label: 'Financeiro',       icon: DollarSign },
  { href: '/admin/cashback',      label: 'Cashback',         icon: Coins },
  { href: '/admin/usuarios',      label: 'Usuários',         icon: UserCog },
  { href: '/admin/configuracoes', label: 'Configurações',    icon: Settings },
]

const BOTTOM_NAV = [
  NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[4], NAV_ITEMS[6],
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(item: typeof NAV_ITEMS[0]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r bg-brand-surface border-brand-border">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-brand-accent tracking-tight">TWIX</span>
            <span className="text-xl font-black text-brand-text tracking-tight">EVENTOS</span>
          </div>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-brand-accent/10 text-brand-accent border border-brand-accent/30">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-brand-accent text-white shadow-sm'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface-2',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/40 rounded-full" />
                )}
                <item.icon size={17} className={active ? 'text-white' : ''} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-brand-border">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 transition-all duration-150"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-brand-border bg-brand-surface px-1 py-2 pb-safe">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-150 min-w-[52px]',
                active
                  ? 'text-brand-accent bg-brand-accent/10'
                  : 'text-brand-muted',
              )}
            >
              <item.icon size={20} />
              {item.label.split('/')[0].trim()}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
