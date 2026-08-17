'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { recommendBeanSlug, type BeanSummary } from '@/lib/coffee';
import { cn } from '@/lib/utils';

type AnswerValue = 'panas' | 'dingin' | 'ringan' | 'pekat' | 'manis' | 'pahit' | 'susu' | 'hitam';
type Answers = Record<string, AnswerValue>;

const STEPS: { key: string; question: string; options: { value: AnswerValue; label: string }[] }[] = [
  {
    key: 'temp',
    question: 'Panas atau dingin?',
    options: [
      { value: 'panas', label: 'Panas' },
      { value: 'dingin', label: 'Dingin' },
    ],
  },
  {
    key: 'body',
    question: 'Ringan atau pekat?',
    options: [
      { value: 'ringan', label: 'Ringan' },
      { value: 'pekat', label: 'Pekat' },
    ],
  },
  {
    key: 'taste',
    question: 'Manis atau pahit?',
    options: [
      { value: 'manis', label: 'Manis' },
      { value: 'pahit', label: 'Pahit' },
    ],
  },
  {
    key: 'milk',
    question: 'Dengan susu, atau hitam?',
    options: [
      { value: 'susu', label: 'Dengan Susu' },
      { value: 'hitam', label: 'Hitam' },
    ],
  },
];

export function CoffeeQuiz({ beans }: { beans: BeanSummary[] }) {
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const recommended = useMemo(() => {
    if (!done || Object.keys(answers).length < STEPS.length) return null;
    const slug = recommendBeanSlug({
      temp: answers.temp as 'panas' | 'dingin',
      body: answers.body as 'ringan' | 'pekat',
      taste: answers.taste as 'manis' | 'pahit',
      milk: answers.milk as 'susu' | 'hitam',
    });
    return beans.find((b) => b.slug === slug) ?? beans[0] ?? null;
  }, [done, answers, beans]);

  const pick = (value: AnswerValue) => {
    const next = { ...answers, [STEPS[step].key]: value };
    setAnswers(next);
    if (step === STEPS.length - 1) {
      setDone(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
    setStarted(true);
  };

  const transition = reduced
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

  return (
    <section className="w-full overflow-hidden border-b border-ink/5 bg-paper py-24 md:py-32">
      <div className="container mx-auto max-w-3xl px-4 md:px-8">
        {!started ? (
          <div className="text-center">
            <motion.p
              {...(reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
              className="mb-6 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee"
            >
              <span className="h-px w-8 bg-coffee/40" />
              Temukan Kopi Anda
              <span className="h-px w-8 bg-coffee/40" />
            </motion.p>
            <motion.h2
              {...(reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } })}
              className="font-display text-4xl leading-[1.05] text-ink md:text-6xl"
            >
              Kopi apa yang <i>Anda cari?</i>
            </motion.h2>
            <motion.p
              {...(reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.15, duration: 0.7 } })}
              className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted-foreground"
            >
              Empat pertanyaan singkat. Satu rekomendasi jujur dari roastery kami.
            </motion.p>
            <motion.div
              {...(reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.25, duration: 0.7 } })}
              className="mt-10"
            >
              <button
                type="button"
                onClick={() => setStarted(true)}
                className={buttonVariants({
                  size: 'lg',
                  className: 'h-14 rounded-full bg-ink px-10 text-base text-paper hover:bg-ink/90',
                })}
              >
                Mulai
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="relative" role="group" aria-label="Kuis rekomendasi kopi">
            <div className="mb-10 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {done ? 'Hasil' : `0${step + 1} / 0${STEPS.length}`}
              </span>
              <div className="flex gap-1.5" aria-hidden>
                {STEPS.map((s, i) => (
                  <span
                    key={s.key}
                    className={cn(
                      'h-px w-8 transition-colors duration-500',
                      i <= step || done ? 'bg-coffee' : 'bg-ink/10',
                    )}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!done && recommended === null && step < STEPS.length ? (
                <motion.div
                  key={`step-${step}`}
                  {...transition}
                  transition={reduced ? undefined : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <h3 className="font-display text-3xl leading-tight text-ink md:text-5xl">
                    {STEPS[step].question}
                  </h3>
                  <div className="mx-auto mt-12 flex max-w-xl flex-col justify-center gap-4 sm:flex-row">
                    {STEPS[step].options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => pick(opt.value)}
                        aria-pressed={answers[STEPS[step].key] === opt.value}
                        className="h-16 flex-1 rounded-sm border border-ink/20 bg-white/50 text-base font-medium text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-lg"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : recommended ? (
                <motion.div
                  key="result"
                  {...transition}
                  transition={reduced ? undefined : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="text-center">
                    <p className="mb-4 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
                      <span className="h-px w-8 bg-coffee/40" />
                      Your P1NTO Match
                      <span className="h-px w-8 bg-coffee/40" />
                    </p>
                    <h3 className="font-display text-4xl leading-[1.05] text-ink md:text-6xl">
                      {recommended.displayName}
                    </h3>
                    <p className="mt-3 text-base text-muted-foreground">
                      {recommended.originCountry}
                      {recommended.originRegion ? ` — ${recommended.originRegion}` : ''} ·{' '}
                      {recommended.roastLevel ?? 'Kopi Sangrai'}
                    </p>
                  </div>

                  <div className="mt-10 grid items-center gap-8 md:grid-cols-2 md:gap-12">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-warm/10">
                      <Image
                        src={recommended.image}
                        alt={recommended.name}
                        fill
                        sizes="(min-width: 768px) 40vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      {recommended.flavorNotes.length > 0 && (
                        <p className="font-display text-2xl italic leading-snug text-ink">
                          {recommended.flavorNotes.join(' · ')}.
                        </p>
                      )}
                      <div className="mt-6 space-y-4 border-t border-ink/10 pt-6 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Proses</span>
                          <span className="font-medium text-ink">{recommended.process ?? '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Berat</span>
                          <span className="font-medium text-ink">
                            {recommended.weightGrams ? `${recommended.weightGrams}g` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Harga</span>
                          <span className="font-semibold text-ink">{recommended.priceLabel}</span>
                        </div>
                      </div>
                      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                        <Link
                          href={`/coffee/${recommended.slug}`}
                          className={buttonVariants({
                            size: 'lg',
                            className: 'h-14 flex-1 rounded-full bg-ink px-8 text-base text-paper hover:bg-ink/90',
                          })}
                        >
                          Lihat Biji Ini
                        </Link>
                        <button
                          type="button"
                          onClick={restart}
                          className={buttonVariants({
                            size: 'lg',
                            variant: 'outline',
                            className: 'h-14 flex-1 rounded-full border-ink px-8 text-base text-ink hover:bg-ink hover:text-paper',
                          })}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Ulangi
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}