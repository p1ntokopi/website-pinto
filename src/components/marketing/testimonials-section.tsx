'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SectionHeader } from './section-header';
import { cn } from '@/lib/utils';

/**
 * PLACEHOLDER — ganti dengan testimoni asli pelanggan P1NTO.
 * Jangan gunakan nama atau cerita fiktif untuk produksi.
 * Struktur carousel sudah final; cukup ganti isi array ini.
 */
const QUOTES = [
  {
    quote:
      'Tempatnya terasa seperti rumah sendiri. Kopinya konsisten, dan selalu ada ruang untuk duduk lebih lama dari yang direncanakan.',
    name: 'Nama Pelanggan',
    role: 'Pelanggan tetap P1NTO',
  },
  {
    quote:
      'Saya mulai dari satu cangkir, lalu membawa pulang bijinya. Sekarang menyeduh kopi P1NTO di rumah setiap pagi.',
    name: 'Nama Pelanggan',
    role: 'Pembeli biji kopi',
  },
  {
    quote:
      'Kafe yang tenang, kopi yang serius. Tempat yang tepat untuk bekerja, bertemu, atau sekadar menikmati waktu sendiri.',
    name: 'Nama Pelanggan',
    role: 'Pengunjung mingguan',
  },
];

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Stars() {
  return (
    <div className="flex gap-1" aria-label="Rating 5 dari 5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="h-3.5 w-3.5 fill-warm text-warm"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const count = QUOTES.length;
  const quote = QUOTES[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count]);

  return (
    <section
      className="w-full border-t border-ink/5 bg-paper py-24 md:py-32"
      aria-roledescription="carousel"
      aria-label="Testimoni pelanggan"
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-14 md:mb-20">
          <SectionHeader
            eyebrow="Kata Mereka"
            lines={['Disukai para', { text: 'penikmat kopi.', italic: true }]}
          />
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="relative min-h-[260px] lg:col-span-8">
            <svg
              className="absolute -top-10 left-0 h-16 w-16 text-ink/10"
              fill="currentColor"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2h2V8h-2zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2h2V8h-2z" />
            </svg>

            <AnimatePresence mode="wait">
              <motion.blockquote
                key={index}
                className="relative cursor-grab touch-pan-y active:cursor-grabbing"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                drag={reduced ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) setIndex((i) => (i + 1) % count);
                  else if (info.offset.x > 60) setIndex((i) => (i - 1 + count) % count);
                }}
              >
                <p className="font-display text-2xl leading-snug text-ink md:text-3xl lg:text-4xl">
                  &ldquo;{quote.quote}&rdquo;
                </p>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={reduced ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="border-l-2 border-coffee/30 pl-6"
              >
                <div className="mb-4 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 bg-warm/15 font-display text-sm text-coffee"
                  >
                    {initials(quote.name)}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{quote.name}</p>
                    <p className="text-sm text-muted-foreground">{quote.role}</p>
                  </div>
                </div>
                <Stars />
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + count) % count)}
                aria-label="Testimoni sebelumnya"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % count)}
                aria-label="Testimoni berikutnya"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="ml-2 flex gap-2">
                {QUOTES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Tampilkan testimoni ${i + 1}`}
                    aria-current={i === index}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-all duration-300',
                      i === index ? 'w-6 bg-coffee' : 'bg-ink/20 hover:bg-ink/40',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}