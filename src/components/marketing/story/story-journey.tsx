'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';

const JOURNEY = [
  {
    year: '2024',
    title: 'Awal Mula',
    desc: 'Pinto membuka bar pertamanya di Bogor — satu mesin espresso, empat kursi, dan keyakinan bahwa kopi bisa mendekatkan orang.',
  },
  {
    year: '2025',
    title: 'Masuk ke Roastery',
    desc: 'Kami membawa penyangraian ke dalam rumah. Single origin dari Ethiopia, Kolombia, dan Aceh menemukan jalan ke bar kami — dan ke rumah Anda.',
  },
  {
    year: 'Sekarang',
    title: 'Ritual Sehari-hari',
    desc: 'Menu yang terus berkembang, rak roastery yang berputar, dan janji yang sama: satu cangkir demi satu cangkir, dibuat dengan perhatian.',
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function StoryJourney() {
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ['start 0.85', 'end 0.55'],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  return (
    <section className="w-full bg-ink text-paper">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <RevealFade>
              <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-warm">
                <span className="h-px w-8 bg-warm/50" aria-hidden="true" />
                02 — Perjalanan
              </p>
            </RevealFade>
            <RevealHeading
              as="h2"
              lines={['Perjalanan', { text: 'Kami Sejauh Ini', italic: true }]}
              className="font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.05] tracking-tight text-cream"
            />
          </div>
          <RevealFade delay={0.2}>
            <p className="max-w-xs text-sm leading-relaxed text-paper/60">
              Tiga babak kecil — dan masih terus ditulis.
            </p>
          </RevealFade>
        </div>

        <div ref={lineRef} className="relative mt-14 md:mt-20">
          {/* Vertical line */}
          <div
            className="absolute bottom-3 left-4 top-3 w-px bg-paper/15 md:left-8"
            aria-hidden="true"
          >
            <motion.div
              style={{ scaleY: progress }}
              className="h-full w-full origin-top bg-warm"
            />
          </div>

          <ul>
            {JOURNEY.map((entry, i) => (
              <motion.li
                key={entry.year}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.05 * i }}
                className="grid grid-cols-1 gap-2 border-t border-paper/10 py-10 first:border-t-0 md:grid-cols-12 md:gap-8 md:py-14"
              >
                <div className="relative pl-8 md:col-span-4 md:pl-12">
                  <span
                    className="absolute left-4 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-warm bg-ink md:left-8"
                    aria-hidden="true"
                  />
                  <p className="font-display text-[clamp(3rem,7vw,4.75rem)] leading-none tracking-tight text-warm">
                    {entry.year}
                  </p>
                </div>
                <div className="pl-8 md:col-span-8 md:pl-0">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-paper/50">
                    {entry.title}
                  </h3>
                  <p className="max-w-2xl font-display text-xl leading-relaxed text-paper/80 md:text-2xl">
                    {entry.desc}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}