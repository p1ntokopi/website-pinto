import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { HeroAnimations } from './hero-animations';
import { AmbientVideo } from './ambient-video';
import { media } from '@/config/media';
import { cn } from '@/lib/utils';

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92svh] w-full items-center justify-center overflow-hidden bg-ink md:min-h-screen">
      <noscript>
        <style>{'.gsap-reveal,.gsap-photo-inner{opacity:1!important}'}</style>
      </noscript>
      <HeroAnimations />

      {/* Media — video ambient + overlay sinematik */}
      <div className="gsap-photo-inner absolute inset-0 h-full w-full origin-center opacity-0">
        <div className="hero-zoom absolute inset-0 h-full w-full">
          <AmbientVideo
            src={media.hero.video}
            poster={media.hero.poster}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/70" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70" />
      </div>

      {/* Konten */}
      <div className="relative z-10 container mx-auto flex flex-col items-center px-6 py-24 text-center md:px-12 md:py-32 lg:px-20">
        <div className="flex max-w-4xl flex-col items-center">
          <p className="gsap-reveal mb-8 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-cream/80 opacity-0 md:text-xs">
            <span className="h-px w-10 bg-cream/40" />
            Roastery &amp; Kafe — Bogor
            <span className="h-px w-10 bg-cream/40" />
          </p>

          <h1 className="font-display text-[clamp(2.75rem,10.5vw,4.75rem)] leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[6.5rem]">
            <span className="gsap-reveal block opacity-0">KOPI BAGUS.</span>
            <span className="gsap-reveal mt-2 block opacity-0">
              MOMEN <i className="font-normal italic text-cream">TENANG.</i>
            </span>
          </h1>

          <p className="gsap-reveal mb-10 max-w-2xl text-base font-light leading-relaxed text-white/85 opacity-0 md:text-lg lg:text-xl">
            Biji kopi Nusantara pilihan, disangrai in-house dalam batch kecil,
            dan disajikan segar — di bar kami, atau di rumah Anda.
          </p>

          <div className="gsap-reveal flex w-full flex-col items-center justify-center gap-4 opacity-0 sm:w-auto sm:flex-row">
            <Link
              href="/coffee"
              className={buttonVariants({
                size: 'lg',
                className:
                  'h-14 w-full rounded-full bg-warm px-8 text-base text-ink hover:bg-cream sm:w-auto',
              })}
            >
              Beli Kopi
            </Link>
            <Link
              href="/locations"
              className="inline-flex h-11 items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hidden"
            >
              Kunjungi Kafe
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/locations"
              className={cn(
                buttonVariants({
                  size: 'lg',
                  variant: 'outline',
                  className:
                    'hidden h-14 w-full rounded-full border-white/25 bg-transparent px-8 text-base text-white hover:bg-white/10 sm:inline-flex sm:w-auto',
                }),
              )}
            >
              Kunjungi Kafe
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
        <span className="hidden sm:inline">Scroll untuk menjelajah</span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-white/30 p-1">
          <span className="hero-scroll-dot h-1.5 w-1 rounded-full bg-cream" />
        </span>
      </div>
    </section>
  );
}