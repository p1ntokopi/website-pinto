'use client';

import { useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SectionHeader } from './section-header';
import { RevealFade } from './reveal-heading';
import { useActiveSlide, useScrollToSlide } from './swipe-carousel';
import { cn } from '@/lib/utils';

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-coffee"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const values = [
  {
    num: '01',
    title: 'Kualitas Premium',
    desc: 'Hanya biji terpilih yang layak menyebut nama kami — arabika dan robusta dari perkebunan pilihan Nusantara.',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8" />
        <path d="M13 12c1.2-2.4 3-3.8 4.6-3.6 0 2.2-1.2 4.8-3.4 5.6" />
      </Icon>
    ),
  },
  {
    num: '02',
    title: 'Dirangkai Ahli',
    desc: 'Sangrai batch kecil dan resep bar yang disetel ulang setiap hari. Presisi, bukan kebetulan.',
    icon: (
      <Icon>
        <path d="M6 10h12l-1 7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2l-1-7z" />
        <path d="M9.5 6c0-.9.4-1.3.4-2.2M14 6c0-.9.4-1.3.4-2.2" />
      </Icon>
    ),
  },
  {
    num: '03',
    title: 'Sumber Nusantara',
    desc: 'Dari Gayo, Toraja, hingga Bajawa — kami mendukung petani Indonesia dan praktik yang adil.',
    icon: (
      <Icon>
        <path d="M5 19C5 9 12 4 20 4c0 8-5 15-15 15z" />
        <path d="M5 19c4-6 8-9 11-11" />
      </Icon>
    ),
  },
  {
    num: '04',
    title: 'Dibuat dengan Hati',
    desc: 'Setiap cangkir diseduh dengan niat dan perhatian — untuk satu orang, satu momen.',
    icon: (
      <Icon>
        <path d="M12 20s-7-4.5-9-8C1.5 9.4 3.5 6 6.5 6c1.8 0 3 1 3.5 2 .5-1 1.7-2 3.5-2 3 0 5 3.4 3.5 6-2 3.5-9 8-9 8z" />
      </Icon>
    ),
  },
];

export function BrandValuesSection() {
  const reduced = useReducedMotion();
  const { scrollerRef, active } = useActiveSlide();
  const go = useScrollToSlide(reduced);
  const count = values.length;

  return (
    <section className="w-full border-b border-ink/5 bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <SectionHeader
          eyebrow="Filosofi Kami"
          lines={['Dibuat dengan perhatian.', { text: 'Disajikan dengan tujuan.', italic: true }]}
        />

        <div className="mt-16 grid grid-cols-1 gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-x-16">
          <div className="lg:col-span-5">
            <RevealFade delay={0.1} className="lg:sticky lg:top-32">
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                Kami tidak hanya menjual kopi — kami menjaga standar, dari biji
                yang dipilih hingga cangkir yang sampai ke tangan Anda. Empat
                hal yang tidak pernah kami kompromikan.
              </p>
            </RevealFade>
          </div>

          {/* Desktop list */}
          <ol className="hidden divide-y divide-ink/10 border-y border-ink/10 lg:col-span-7 lg:block">
            {values.map((value) => (
              <li
                key={value.num}
                className="group flex items-start gap-5 py-8 transition-colors md:gap-8 md:py-10"
              >
                <span className="font-display text-2xl leading-none text-coffee/45 transition-colors duration-300 group-hover:text-coffee md:text-3xl">
                  {value.num}
                </span>
                <span className="mt-1 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5">
                  {value.icon}
                </span>
                <div className="flex-1">
                  <h3 className="mb-2 font-display text-2xl text-ink md:text-3xl">
                    {value.title}
                  </h3>
                  <p className="max-w-md leading-relaxed text-muted-foreground">
                    {value.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Mobile swipe carousel */}
          <div className="lg:hidden">
            <div
              ref={scrollerRef}
              role="group"
              aria-label="Nilai Pinto — geser untuk melihat"
              className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2"
            >
              {values.map((value, i) => (
                <div key={value.num} data-slide className="w-[85%] shrink-0 snap-start">
                  <div
                    className={cn(
                      'flex flex-col gap-5 transition-opacity duration-500',
                      i === active ? 'opacity-100' : 'opacity-35',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display text-3xl leading-none text-coffee/50">
                        {value.num}
                      </span>
                      <span className="shrink-0">{value.icon}</span>
                    </div>
                    <h3 className="font-display text-3xl leading-tight text-ink">
                      {value.title}
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {value.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {values.map((value, i) => (
                  <button
                    key={value.num}
                    type="button"
                    onClick={() => go(scrollerRef.current, i)}
                    aria-label={`Tampilkan nilai ${i + 1}`}
                    aria-current={i === active}
                    className="flex h-11 items-center"
                  >
                    <span
                      className={cn(
                        'block h-1.5 rounded-full transition-all duration-300',
                        i === active ? 'w-7 bg-coffee' : 'w-1.5 bg-ink/20 hover:bg-ink/40',
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => go(scrollerRef.current, active - 1)}
                  disabled={active === 0}
                  aria-label="Nilai sebelumnya"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(scrollerRef.current, active + 1)}
                  disabled={active === count - 1}
                  aria-label="Nilai berikutnya"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
