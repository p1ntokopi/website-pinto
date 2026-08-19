import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { images } from '@/config/images';
import { buttonVariants } from '@/components/ui/button';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';

const STEPS = [
  { label: 'Pilih', desc: 'Biji dari kebun-kebun mitra di Nusantara — disortir dengan teliti.' },
  { label: 'Sangrai', desc: 'Disangrai in-house dalam batch kecil, seminggu demi seminggu.' },
  { label: 'Seduh', desc: 'Disajikan di bar kami, atau dikemas segar untuk rumah Anda.' },
];

export function StoryRoastery() {
  return (
    <section className="w-full bg-ink text-paper">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-4 py-16 md:px-8 md:py-28 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <RevealFade y={40}>
            <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/10 sm:aspect-[16/10] lg:aspect-[7/5]">
              <Image
                src={images.beans.roasted}
                alt="Biji kopi yang baru selesai disangrai"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <figcaption className="absolute bottom-5 left-5 hidden items-center gap-3 md:flex">
                <span className="border border-cream/40 bg-ink/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                  Disangrai in-house
                </span>
              </figcaption>
            </figure>
          </RevealFade>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5">
          <RevealFade>
            <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-warm">
              <span className="h-px w-8 bg-warm/50" aria-hidden="true" />
              05 — Roastery
            </p>
          </RevealFade>

          <RevealHeading
            as="h2"
            lines={['Di balik', { text: 'setiap biji.', italic: true }]}
            className="font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.05] tracking-tight text-cream"
          />

          <RevealFade delay={0.2}>
            <p className="mt-7 max-w-md text-base leading-relaxed text-paper/70 md:text-lg">
              Dari biji hijau hingga seduhan pertama — satu alur yang kami jaga
              dengan tangan sendiri, dari roastery ke bar, dan ke rumah Anda.
            </p>
          </RevealFade>

          <RevealFade delay={0.3}>
            <ul className="mt-10 space-y-5 border-t border-paper/10 pt-8">
              {STEPS.map((step, i) => (
                <li key={step.label} className="flex items-baseline gap-5">
                  <span className="font-display text-lg text-warm">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cream">
                      {step.label}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-paper/60">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </RevealFade>

          <RevealFade delay={0.4}>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/coffee"
                className={buttonVariants({
                  size: 'lg',
                  className:
                    'h-14 rounded-full bg-warm px-8 text-base text-ink hover:bg-cream shadow-none',
                })}
              >
                Jelajahi Biji
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/cafe"
                className="border-b border-paper/30 pb-1 text-sm font-semibold text-paper transition-colors hover:border-warm hover:text-warm"
              >
                Kunjungi Kafe Kami
              </Link>
            </div>
          </RevealFade>
        </div>
      </div>
    </section>
  );
}