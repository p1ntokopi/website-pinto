'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import { images } from '@/config/images';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    num: '01',
    title: 'ASAL',
    en: 'Origin',
    desc: 'Semuanya berawal dari dataran tinggi Nusantara — Gayo, Toraja, Bajawa, hingga Kintamani. Tiap biji membawa cerita tanahnya sendiri.',
    image: images.journey.origin,
  },
  {
    num: '02',
    title: 'SUMBER',
    en: 'Sourcing',
    desc: 'Kami memilih biji hijau terbaik dan bekerja langsung dengan petani — praktik yang adil, harga yang layak, dan kualitas yang konsisten.',
    image: images.journey.sourcing,
  },
  {
    num: '03',
    title: 'SANGRAI',
    en: 'Roasting',
    desc: 'Disangrai in-house dalam batch kecil. Di sinilah karakter lahir — rasa, body, dan aroma yang khas untuk setiap asal.',
    image: images.journey.roasting,
  },
  {
    num: '04',
    title: 'SEDUH',
    en: 'Brewing',
    desc: 'Resep bar yang disetel untuk setiap biji: dari espresso pekat hingga V60 yang jernih — disajikan segar di bar, atau dikemas untuk rumah Anda.',
    image: images.journey.brewing,
  },
];

function StepBlock({
  step,
  index,
  active,
  onActive,
}: {
  step: (typeof STEPS)[number];
  index: number;
  active: boolean;
  onActive: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div
      ref={ref}
      className="flex min-h-[60vh] items-center py-16 md:min-h-[75vh]"
    >
      <div
        className={cn(
          'transition-all duration-500',
          active ? 'opacity-100' : 'opacity-30',
        )}
      >
        <p className="font-display text-5xl leading-none text-coffee/40 md:text-6xl">
          {step.num}
        </p>
        <h3 className="mt-4 font-display text-3xl text-ink md:text-5xl">
          {step.title}{' '}
          <span className="italic text-muted-foreground">{step.en}</span>
        </h3>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
          {step.desc}
        </p>
      </div>
    </div>
  );
}

export function BeanToCupSection() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start 0.7', 'end 0.6'],
  });

  return (
    <section ref={rootRef} className="w-full bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="mb-20 max-w-3xl font-display text-4xl leading-[1.05] text-ink md:mb-28 md:text-6xl lg:text-7xl">
          DARI BIJI
          <br />
          <i>KE CANGKIR.</i>
        </h2>

        {/* Mobile — vertical storytelling, alternating text & image */}
        <div className="flex flex-col gap-16 lg:hidden">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col gap-6">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-4xl leading-none text-coffee/40">
                  {step.num}
                </span>
                <h3 className="font-display text-3xl text-ink">
                  {step.title}{' '}
                  <span className="italic text-muted-foreground">{step.en}</span>
                </h3>
              </div>
              <div
                className={cn(
                  'relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-ink/5',
                  i % 2 === 1 && 'md:ml-auto md:max-w-[85%]',
                )}
              >
                <Image
                  src={step.image}
                  alt={`${step.title} — perjalanan kopi P1NTO`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent" />
              </div>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop — sticky visual + scroll steps */}
        <div className="hidden grid-cols-2 gap-16 lg:grid">
          {/* Sticky visual */}
          <div className="relative h-[70vh] lg:sticky lg:top-28">
            <div className="absolute inset-0 overflow-hidden rounded-sm bg-ink/5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  className="absolute inset-0"
                  initial={reduced ? false : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image
                    src={STEPS[active].image}
                    alt={`${STEPS[active].title} — perjalanan kopi P1NTO`}
                    fill
                    sizes="46vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent" />
                  <span className="absolute bottom-6 left-6 font-display text-6xl text-paper/90 md:text-8xl">
                    {STEPS[active].num}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Steps */}
          <div className="relative pl-12">
            <div
              className="absolute left-0 top-0 hidden h-full w-px bg-ink/10 lg:block"
              aria-hidden
            >
              <motion.div
                style={{ scaleY: scrollYProgress }}
                className="h-full w-full origin-top bg-coffee"
              />
            </div>
            {STEPS.map((step, i) => (
              <StepBlock
                key={step.num}
                step={step}
                index={i}
                active={active === i}
                onActive={setActive}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}