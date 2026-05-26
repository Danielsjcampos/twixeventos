'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Settings, UserCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn, whatsappLink, WHATSAPP_NUMBER } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { CartButton } from '@/components/public/CartButton';

const navLinks = [
  { href: '/brinquedos', label: 'Brinquedos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/#contato', label: 'Contato' },
];

export interface HeaderClientProps {
  logoUrl?: string;
  bannerAtivo?: string;
  bannerTexto?: string;
}

export function HeaderClient({ logoUrl, bannerAtivo = 'true', bannerTexto = 'Descontos especiais de segunda a quinta! Reserve agora →' }: HeaderClientProps) {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(12);

  const waLink = whatsappLink(WHATSAPP_NUMBER, 'Olá! Gostaria de mais informações sobre a Twix Eventos.');

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Banner topo */}
      {bannerAtivo === 'true' && (
        <div className="w-full text-white text-center text-sm font-medium py-2 px-4 z-50 relative" style={{ background: 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 50%, #1D4ED8 100%)' }}>
          {bannerTexto}
        </div>
      )}

      <header
        className={cn(
          'sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-transparent md:rounded-2xl md:border md:transition-all md:ease-out',
          {
            'bg-brand-surface/95 supports-[backdrop-filter]:bg-brand-surface/70 border-brand-border backdrop-blur-lg md:top-4 md:shadow-lg md:shadow-black/5':
              scrolled && !open,
            'bg-brand-surface/90': open,
          },
        )}
      >
        <nav
          className={cn(
            'flex h-16 w-full items-center justify-between px-4 md:transition-all md:ease-out',
            {
              'md:px-6': scrolled,
              'md:px-8': !scrolled,
            },
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 leading-none z-50" onClick={() => setOpen(false)}>
            {logoUrl ? (
              <img src={logoUrl} alt="Twix Eventos" className="h-10 w-auto object-contain" />
            ) : (
              <div className="flex flex-col">
                <span className="font-bold text-xl md:text-2xl uppercase tracking-wider text-brand-accent">
                  TWIX EVENTOS
                </span>
                <span className="text-[10px] md:text-xs text-brand-muted font-medium tracking-widest uppercase">
                  Locação de Brinquedos
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'text-brand-text hover:text-brand-accent font-medium text-sm'
                )}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="w-px h-6 bg-brand-border mx-2" />

            <Link
              href="/admin/dashboard"
              title="Acesso Admin"
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-brand-muted/40 hover:text-brand-accent')}
            >
              <Settings className="size-4" />
            </Link>

            <Link
              href="/minha-area"
              title="Minha Área"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'relative text-brand-muted hover:text-brand-accent group'
              )}
            >
              <UserCircle className="size-5" />
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-surface border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-text shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                Minha Área
              </span>
            </Link>

            <CartButton />

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'default' }), 'gap-2 ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5')}
            >
              <Phone className="size-4" />
              WhatsApp
            </a>
          </div>

          {/* Mobile Toggles */}
          <div className="flex items-center gap-2 md:hidden z-50">
            <Link
              href="/minha-area"
              title="Minha Área"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-brand-muted hover:text-brand-accent')}
            >
              <UserCircle className="size-5" />
            </Link>
            <CartButton />
            <Button size="icon" variant="ghost" onClick={() => setOpen(!open)} className="text-brand-text hover:bg-transparent">
              <MenuToggleIcon open={open} className="size-6" duration={300} />
            </Button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <div
          className={cn(
            'fixed top-[104px] right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-t border-brand-border bg-brand-surface supports-[backdrop-filter]:bg-brand-surface/95 backdrop-blur-xl md:hidden',
            open ? 'block' : 'hidden',
          )}
          style={{ height: 'calc(100vh - 104px)' }} // considering banner + header height
        >
          <div
            data-slot={open ? 'open' : 'closed'}
            className={cn(
              'data-[slot=open]:animate-in data-[slot=open]:slide-in-from-top-4 data-[slot=open]:fade-in data-[slot=closed]:animate-out data-[slot=closed]:slide-out-to-top-4 data-[slot=closed]:fade-out ease-out duration-300',
              'flex h-full w-full flex-col justify-between gap-y-4 p-6 overflow-y-auto',
            )}
          >
            <div className="flex flex-col gap-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-2xl font-bold tracking-tight text-brand-text hover:text-brand-accent transition-colors py-2 border-b border-brand-border/50"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/minha-area"
                className="flex items-center gap-3 text-2xl font-bold tracking-tight text-brand-accent py-2 border-b border-brand-border/50"
                onClick={() => setOpen(false)}
              >
                <UserCircle className="size-6 shrink-0" />
                Minha Área
              </Link>
            </div>
            <div className="flex flex-col gap-3 pb-8">
              <Link
                href="/admin/dashboard"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center gap-2 h-12 rounded-xl border-brand-border')}
                onClick={() => setOpen(false)}
              >
                <Settings className="size-4" />
                Acesso Restrito
              </Link>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center gap-2 bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-base')}
                onClick={() => setOpen(false)}
              >
                <Phone className="size-5" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
