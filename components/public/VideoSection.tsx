'use client'

import { Play } from 'lucide-react'
import { useState } from 'react'

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return short[1]
  // youtube.com/watch?v=ID or /embed/ID
  const long = url.match(/(?:v=|\/embed\/)([^?&/]+)/)
  if (long) return long[1]
  // bare ID (11 chars)
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return null
}

interface VideoSectionProps {
  videoUrl: string | null
}

export function VideoSection({ videoUrl }: VideoSectionProps) {
  const [playing, setPlaying] = useState(false)
  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null

  if (!videoId) return null

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
  const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <section className="py-20 bg-brand-bg relative overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #3B82F6, transparent)' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-5">
            Conheça a Twix
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-bold text-brand-text uppercase">
            VEja como <span className="text-brand-accent">FUNCIONA</span>
          </h2>
          <p className="text-brand-muted mt-3 max-w-xl mx-auto">
            Do inflável à montagem — veja como deixamos sua festa inesquecível
          </p>
        </div>

        {/* Video player */}
        <div className="relative group">
          {/* Glow border */}
          <div className="absolute -inset-[2px] rounded-[22px] shimmer-border-gradient opacity-70" />

          <div className="relative rounded-[20px] overflow-hidden bg-black shadow-2xl" style={{ aspectRatio: '16/9' }}>
            {playing ? (
              <iframe
                src={embedUrl}
                title="Vídeo de apresentação Twix Eventos"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              /* Thumbnail + play button */
              <button
                onClick={() => setPlaying(true)}
                className="w-full h-full relative block focus:outline-none"
                aria-label="Reproduzir vídeo"
              >
                {/* Thumbnail */}
                <img
                  src={thumbnail}
                  alt="Vídeo Twix Eventos"
                  className="w-full h-full object-cover"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-full bg-brand-accent/40 animate-ping" />
                    <div className="relative w-20 h-20 rounded-full bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/40 group-hover:scale-110 transition-transform duration-300">
                      <Play className="size-8 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* YouTube logo bottom right */}
                <div className="absolute bottom-4 right-4">
                  <svg viewBox="0 0 90 20" className="h-5 w-auto opacity-80" fill="white">
                    <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"/>
                    <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"/>
                    <path d="M34.6024 13.0036L31.3945 1.41846H34.1932L35.3174 6.6701C35.6043 7.96361 35.8136 9.06662 35.95 9.97913H36.0323C36.1264 9.32532 36.3381 8.22937 36.6672 6.68892L37.8356 1.41846H40.6343L37.4263 13.0036V18.561H34.6001V13.0036H34.6024Z" fill="white"/>
                    <path d="M41.4697 18.1937C40.9053 17.8127 40.5031 17.22 40.2632 16.4157C40.0257 15.6114 39.9058 14.5437 39.9058 13.2078V11.3898C39.9058 10.0422 40.0422 8.96196 40.315 8.14905C40.5878 7.33614 41.0135 6.73937 41.592 6.35427C42.1706 5.96917 42.9302 5.77662 43.871 5.77662C44.7976 5.77662 45.5384 5.97152 46.0981 6.36133C46.6555 6.75114 47.0647 7.35027 47.3233 8.16318C47.5819 8.97608 47.7095 10.0563 47.7095 11.3898V13.2078C47.7095 14.5437 47.5843 15.6161 47.3339 16.4228C47.0834 17.2271 46.6743 17.8151 46.1099 18.1937C45.5455 18.5723 44.7764 18.7625 43.8051 18.7625C42.8126 18.7625 42.0364 18.5723 41.4697 18.1937ZM44.6User 16.551C44.7905 16.1701 44.8846 15.5522 44.8846 14.6981V9.87282C44.8846 9.04166 44.7929 8.43253 44.6094 8.04979C44.4258 7.66705 44.1102 7.47450 43.6620 7.47450C43.2278 7.47450 42.9168 7.66705 42.7309 8.04979C42.545 8.43253 42.451 9.04166 42.451 9.87282V14.6981C42.451 15.5569 42.5427 16.1771 42.7239 16.551C42.9074 16.9273 43.2231 17.1154 43.6737 17.1154C44.1243 17.1154 44.4352 16.9273 44.6191 16.551H44.6User Z" fill="white"/>
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
