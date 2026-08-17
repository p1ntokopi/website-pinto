'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { BeanSummary } from '@/lib/coffee';
import { cn } from '@/lib/utils';

export function TakeHomeSlider({ beans }: { beans: BeanSummary[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (beans.length === 0) {
    return (
      <p className="text-lg text-muted-foreground">
        Rak roastery kami sedang diisi ulang. Nantikan kembali.
      </p>
    );
  }

  const current = beans[index];

  const go = (i: number) => {
    const next = Math.max(0, Math.min(beans.length - 1, i));
    setIndex(next);
    const child = trackRef.current?.children[next] as HTMLElement | undefined;
    child?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Featured visual */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-warm/10 lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.slug}
              className="absolute inset-0"
              initial={reduced ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={current.image}
                alt={current.name}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute bottom-6 left-6 z-10">
            <span className="border border-cream/30 bg-ink/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
              {current.roastLevel ?? 'Kopi Sangrai'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-5">
          <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
            <span className="h-px w-8 bg-coffee/40" />
            Origin — {current.originCountry ?? 'Nusantara'}
          </p>
          <h3 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            {current.displayName}
          </h3>
          {current.originRegion && (
            <p className="mt-2 text-base text-muted-foreground">
              {current.originRegion}
            </p>
          )}
          {current.flavorNotes.length > 0 && (
            <p className="mt-6 font-display text-xl italic text-ink/80 md:text-2xl">
              {current.flavorNotes.join(' · ')}.
            </p>
          )}

          <div className="mt-8 space-y-4 border-t border-ink/10 pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proses</span>
              <span className="font-medium text-ink">{current.process ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Berat</span>
              <span className="font-medium text-ink">
                {current.weightGrams ? `${current.weightGrams}g` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga</span>
              <span className="text-lg font-semibold text-ink">
                {current.priceLabel}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={`/coffee/${current.slug}`}
              className={buttonVariants({
                size: 'lg',
                className:
                  'h-14 flex-1 rounded-full bg-ink px-8 text-base text-paper hover:bg-ink/90',
              })}
            >
              Beli Biji Ini
            </Link>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => go(index - 1)}
                disabled={index === 0}
                aria-label="Kopi sebelumnya"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {index + 1} / {beans.length}
              </span>
              <button
                type="button"
                onClick={() => go(index + 1)}
                disabled={index === beans.length - 1}
                aria-label="Kopi berikutnya"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail track */}
      <div className="mt-12">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Jelajahi koleksi
        </p>
        <div
          ref={trackRef}
          className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2"
          role="group"
          aria-label="Pilih biji kopi"
        >
          {beans.map((bean, i) => (
            <button
              key={bean.slug}
              type="button"
              aria-pressed={i === index}
              aria-label={`Lihat ${bean.name}`}
              onClick={() => go(i)}
              className={cn(
                'group relative h-24 w-24 shrink-0 snap-start overflow-hidden rounded-sm transition-opacity duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                i === index ? 'opacity-100 ring-1 ring-coffee' : 'opacity-40 hover:opacity-70',
              )}
            >
              <Image
                src={bean.image}
                alt={bean.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}