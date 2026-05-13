'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { whatsappLink, WHATSAPP_NUMBER } from '@/lib/utils';
import { Phone, BookOpen, ArrowUp } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Inline CSS ── */
const STYLES = `
.twix-footer-wrapper {
  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}

@keyframes twix-footer-breathe {
  0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.5; }
  100% { transform: translate(-50%,-50%) scale(1.1); opacity: 1; }
}
@keyframes twix-footer-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes twix-footer-heartbeat {
  0%,100% { transform: scale(1);   filter: drop-shadow(0 0 4px rgba(239,68,68,.5)); }
  15%,45% { transform: scale(1.3); filter: drop-shadow(0 0 8px rgba(239,68,68,.8)); }
  30%     { transform: scale(1); }
}

.twix-footer-breathe  { animation: twix-footer-breathe  8s ease-in-out infinite alternate; }
.twix-footer-marquee  { animation: twix-footer-marquee  35s linear infinite; }
.twix-footer-heartbeat{ animation: twix-footer-heartbeat 2s cubic-bezier(.25,1,.5,1) infinite; }

.twix-footer-grid {
  background-size: 56px 56px;
  background-image:
    linear-gradient(to right,  color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}
.twix-footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, var(--primary) 18%, transparent) 0%,
    color-mix(in oklch, var(--secondary) 12%, transparent) 40%,
    transparent 70%
  );
}
.twix-footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 0 10px 30px -10px var(--pill-shadow),
              inset 0 1px 1px var(--pill-highlight),
              inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all .4s cubic-bezier(.16,1,.3,1);
}
.twix-footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 0 20px 40px -10px var(--pill-shadow-hover),
              inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}
.twix-footer-giant-text {
  font-size: 28vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}
.twix-footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}
`;

/* ── Magnetic Button ── */
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { as?: React.ElementType };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = 'button', ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const el = localRef.current;
      if (!el) return;
      const ctx = gsap.context(() => {
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          gsap.to(el, { x: x * 0.4, y: y * 0.4, rotationX: -y * 0.15, rotationY: x * 0.15, scale: 1.05, ease: 'power2.out', duration: 0.4 });
        };
        const onLeave = () => gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: 'elastic.out(1,0.3)', duration: 1.2 });
        el.addEventListener('mousemove', onMove as EventListener);
        el.addEventListener('mouseleave', onLeave);
        return () => { el.removeEventListener('mousemove', onMove as EventListener); el.removeEventListener('mouseleave', onLeave); };
      }, el);
      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn('cursor-pointer', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = 'MagneticButton';

/* ── Marquee ── */
const MarqueeItem = () => (
  <div className="flex items-center space-x-10 px-6 text-xs font-bold tracking-[0.25em] uppercase">
    <span>Infláveis</span>
    <span className="opacity-40">✦</span>
    <span>Toboágua</span>
    <span className="opacity-40">✦</span>
    <span>Canhão de Espuma</span>
    <span className="opacity-40">✦</span>
    <span>Touro Mecânico</span>
    <span className="opacity-40">✦</span>
    <span>Batalha de Espuma</span>
    <span className="opacity-40">✦</span>
    <span>Futebol de Sabão</span>
    <span className="opacity-40">✦</span>
    <span>SJC e Vale do Paraíba</span>
    <span className="opacity-40">✦</span>
  </div>
);

/* ── Footer principal ── */
export function TwixFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  const waLink = whatsappLink(WHATSAPP_NUMBER, 'Olá! Gostaria de fazer uma reserva na Twix Eventos.');

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(giantTextRef.current,
        { y: '10vh', scale: 0.8, opacity: 0 },
        { y: '0vh', scale: 1, opacity: 1, ease: 'power1.out',
          scrollTrigger: { trigger: wrapperRef.current, start: 'top 80%', end: 'bottom bottom', scrub: 1 } }
      );
      gsap.fromTo([headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: wrapperRef.current, start: 'top 40%', end: 'bottom bottom', scrub: 1 } }
      );
    }, wrapperRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}
      >
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-background text-foreground twix-footer-wrapper" style={{ zIndex: 10 }}>

          {/* Fundo */}
          <div className="twix-footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 twix-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="twix-footer-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Texto gigante de fundo */}
          <div
            ref={giantTextRef}
            className="twix-footer-giant-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none font-[family-name:var(--font-display)]"
          >
            TWIX
          </div>

          {/* Marquee diagonal */}
          <div className="absolute top-10 left-0 w-full overflow-hidden border-y border-border/30 bg-background/70 backdrop-blur-md py-3.5 z-10 -rotate-[1.5deg] scale-110 shadow-xl text-muted-foreground">
            <div className="flex w-max twix-footer-marquee">
              <MarqueeItem /><MarqueeItem />
            </div>
          </div>

          {/* Conteúdo central */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
            <h2
              ref={headingRef}
              className="text-5xl md:text-8xl font-black twix-footer-text-glow tracking-tighter mb-10 text-center font-[family-name:var(--font-display)]"
            >
              Pronto pra reservar?
            </h2>

            <div ref={linksRef} className="flex flex-col items-center gap-5 w-full">
              {/* CTAs primários */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton
                  as="a"
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="twix-footer-glass-pill px-10 py-5 rounded-full text-foreground font-bold text-sm md:text-base flex items-center gap-3 group"
                >
                  <Phone className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  Reservar via WhatsApp
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  href="/brinquedos"
                  className="twix-footer-glass-pill px-10 py-5 rounded-full text-foreground font-bold text-sm md:text-base flex items-center gap-3 group"
                >
                  <BookOpen className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  Ver Catálogo Completo
                </MagneticButton>
              </div>

              {/* Links rápidos */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full mt-1">
                {[
                  { href: '/brinquedos', label: 'Brinquedos' },
                  { href: '/sobre', label: 'Sobre nós' },
                  { href: '/#contato', label: 'Contato' },
                ].map(({ href, label }) => (
                  <MagneticButton
                    key={href}
                    as={Link}
                    href={href}
                    className="twix-footer-glass-pill px-5 py-2.5 rounded-full text-muted-foreground font-medium text-xs md:text-sm hover:text-foreground"
                  >
                    {label}
                  </MagneticButton>
                ))}
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="relative z-20 w-full pb-7 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-muted-foreground text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              © {new Date().getFullYear()} Twix Eventos. Todos os direitos reservados.
            </div>

            {/* Badge "Feito com amor" */}
            <div className="twix-footer-glass-pill px-5 py-2.5 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default">
              <span className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">Feito com</span>
              <span className="twix-footer-heartbeat text-sm text-red-500">❤</span>
              <span className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">em SJC</span>
            </div>

            {/* Redes sociais + voltar ao topo */}
            <div className="flex items-center gap-3 order-3">
              {[
                { href: 'https://instagram.com/twixeventos', label: 'Instagram', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                { href: 'https://facebook.com/twixeventos', label: 'Facebook', d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                { href: 'https://youtube.com/@twixeventos', label: 'YouTube', d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
              ].map(({ href, label, d }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="twix-footer-glass-pill w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
                </a>
              ))}
              <MagneticButton
                as="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="twix-footer-glass-pill w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground group ml-1"
                aria-label="Voltar ao topo"
              >
                <ArrowUp className="size-4 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </MagneticButton>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
