import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { images } from '@/config/images';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';

export function StoryHero() {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-12 lg:gap-16">
        {/* Text — 5 columns */}
        <div className="lg:col-span-5">
          <RevealFade>
            <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
              <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
              Kisah Kami
            </p>
          </RevealFade>

          <RevealHeading
            as="h1"
            lines={[
              'Lebih dari',
              { text: 'Sekadar Kopi.', italic: true },
            ]}
            className="font-display text-[clamp(2.9rem,7vw,5.25rem)] leading-[1.02] tracking-tight text-ink"
          />

          <RevealFade delay={0.2}>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
              Pinto lahir dari hasrat sederhana: membuat kopi yang mempertemukan
              orang, tempat, dan cerita.
            </p>
          </RevealFade>

          <RevealFade delay={0.3}>
            <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              <span>Roastery &amp; Kafe</span>
              <span className="h-px w-6 bg-ink/20" aria-hidden="true" />
              <span className="text-coffee">Bogor</span>
            </div>
          </RevealFade>

          <RevealFade delay={0.35}>
            <a
              href="#perjalanan"
              className="mt-8 inline-flex items-center gap-2 border-b border-ink/30 pb-1 text-sm font-semibold text-ink transition-colors hover:border-coffee hover:text-coffee"
            >
              Lanjutkan membaca
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </RevealFade>
        </div>

        {/* Image — 7 columns */}
        <RevealFade delay={0.15} className="lg:col-span-7">
          <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/40 sm:aspect-[16/10] lg:aspect-[7/5]">
            <Image
              src={images.cafe.barista}
              alt="Barista Pinto menuang kopi di bar"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
            <figcaption className="absolute bottom-5 left-5 hidden items-center gap-3 md:flex">
              <span className="border border-cream/40 bg-ink/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                Bar — Tempat Pinto dimulai
              </span>
            </figcaption>
          </figure>
        </RevealFade>
      </div>
    </section>
  );
}