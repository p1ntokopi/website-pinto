import Image from 'next/image';
import { RevealHeading, RevealFade } from '../reveal-heading';
import { images } from '@/config/images';
import { ScrollLink } from './scroll-link';
import { ArrowDown } from 'lucide-react';

export function MenuHero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-ink/5 bg-paper">
      <div className="container mx-auto grid items-center gap-12 px-4 py-16 md:grid-cols-12 md:px-8 md:py-24 lg:py-32">
        <div className="md:col-span-7 lg:col-span-8">
          <RevealFade>
            <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
              <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
              Di Bar &amp; Roastery
            </p>
          </RevealFade>

          <RevealHeading
            as="h1"
            lines={['Menu Kami', { text: 'Segar, saat dipesan.', italic: true }]}
            className="font-display text-5xl leading-[0.98] tracking-tight text-ink md:text-6xl lg:text-7xl"
          />

          <RevealFade delay={0.2}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Dari kopi susu khas Aceh hingga seduhan manual — setiap item diracik dengan
              penuh perhatian, satu cangkir demi satu cangkir.
            </p>
          </RevealFade>

          <RevealFade delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <ScrollLink
                id="menu-signatures"
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-ink px-7 text-sm font-semibold text-paper transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                Jelajahi Menu
                <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
              </ScrollLink>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Buka 13.00 — 24.00 WIB
              </span>
            </div>
          </RevealFade>
        </div>

        <RevealFade delay={0.15} className="md:col-span-5 lg:col-span-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cream/40">
            <Image
              src={images.cafe.latte}
              alt="Minuman khas P1NTO Coffee"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 border border-cream/30 bg-ink/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
              Signature dari bar
            </span>
          </div>
        </RevealFade>
      </div>
    </section>
  );
}
