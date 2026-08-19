'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpDown } from 'lucide-react';
import type { CoffeeBean } from '@/lib/shop';
import { beanImage } from '@/config/images';
import {
  beanCategory,
  beanTasteIds,
  displayName,
  formatRupiah,
  TASTE_BUCKETS,
  type BeanCategory,
  type TasteBucketId,
} from '@/lib/coffee-utils';
import { cn } from '@/lib/utils';

type CategoryFilter = BeanCategory | 'ALL';
type SortKey = 'default' | 'price-asc' | 'price-desc';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'ARABICA', label: 'Arabika' },
  { id: 'ROBUSTA', label: 'Robusta' },
  { id: 'BLEND', label: 'Blend' },
];

const priceOf = (bean: CoffeeBean) => bean.variants[0]?.price ?? bean.base_price;
const weightOf = (bean: CoffeeBean) => bean.variants[0]?.weight_grams ?? null;

function BeanRow({ bean, index }: { bean: CoffeeBean; index: number }) {
  const name = displayName(bean.name);
  const origin = bean.origin?.country ?? 'Indonesia';
  const region = bean.origin?.region ?? null;
  const notes = bean.flavorNotes.slice(0, 3).join(' · ');
  const meta = [bean.process, bean.roast_level].filter(Boolean).join(' · ');

  return (
    <li className="group border-t border-ink/10 transition-colors last:border-b hover:bg-white/60">
      <div className="flex items-stretch">
        <Link
          href={`/coffee/${bean.slug}`}
          className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink md:grid md:grid-cols-12 md:items-baseline md:gap-4 md:px-6 md:py-7"
        >
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground md:col-span-1">
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="md:col-span-4">
            <h3 className="font-display text-2xl leading-tight text-ink transition-colors group-hover:text-coffee md:text-[1.7rem]">
              {name}
            </h3>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {[origin, region].filter(Boolean).join(' · ')}
            </p>
          </div>

          <p className="hidden text-sm text-muted-foreground md:col-span-3 md:block">{meta}</p>

          <p className="hidden font-display text-sm italic leading-snug text-ink/70 md:col-span-2 md:block">
            {notes}
          </p>

          <div className="mt-2 flex items-baseline gap-3 md:col-span-2 md:mt-0 md:justify-end md:text-right">
            {weightOf(bean) && (
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {weightOf(bean)}g
              </span>
            )}
            <span className="text-sm font-semibold tabular-nums text-ink">
              {formatRupiah(priceOf(bean))}
            </span>
          </div>
        </Link>

        <Link
          href={`/coffee/${bean.slug}`}
          aria-label={`Lihat ${name}`}
          className="hidden w-14 shrink-0 items-center justify-center border-l border-ink/10 text-ink transition-colors hover:bg-coffee hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-coffee md:flex"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

function FeaturedBean({
  bean,
  large,
}: {
  bean: CoffeeBean;
  large?: boolean;
}) {
  const name = displayName(bean.name);
  const notes = bean.flavorNotes.slice(0, 3).join(' · ');
  const meta = [bean.process, bean.roast_level].filter(Boolean).join(' · ');

  if (!large) {
    return (
      <Link
        href={`/coffee/${bean.slug}`}
        className="group flex items-baseline justify-between gap-4 border-t border-paper/10 py-5 transition-colors"
      >
        <div className="min-w-0">
          <h3 className="truncate font-display text-2xl text-cream transition-colors group-hover:text-warm">
            {name}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-paper/50">
            {bean.origin?.region ?? bean.origin?.country ?? 'Nusantara'} · {meta}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-paper">{formatRupiah(priceOf(bean))}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-paper/40">
            {weightOf(bean) ? `${weightOf(bean)}g` : ''}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
      <Link
        href={`/coffee/${bean.slug}`}
        className="group block lg:col-span-7"
        aria-label={`Lihat ${name}`}
      >
        <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/40 sm:aspect-[16/10] lg:aspect-[7/5]">
          <Image
            src={beanImage(bean.slug)}
            alt={`Kemas ${name} dari P1NTO`}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute right-4 top-4 border border-cream/40 bg-ink/45 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
            {bean.roast_level}
          </span>
        </figure>
      </Link>

      <div className="lg:col-span-5">
        <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-warm">
          <span className="h-px w-8 bg-warm/50" aria-hidden="true" />
          Origin — {bean.origin?.country ?? 'Nusantara'}
        </p>
        <h3 className="font-display text-4xl leading-[1.05] text-cream md:text-5xl">
          {name}
        </h3>
        {bean.origin?.region && (
          <p className="mt-2 text-base text-paper/60">{bean.origin.region}</p>
        )}
        <p className="mt-3 text-sm text-paper/70">{meta}</p>
        {notes && (
          <p className="mt-6 font-display text-xl italic text-paper/85 md:text-2xl">
            {notes}.
          </p>
        )}

        <div className="mt-8 flex items-end justify-between border-t border-paper/10 pt-5">
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-paper/50">
              {weightOf(bean) ? `${weightOf(bean)}g` : 'per 100g'}
            </span>
            <span className="mt-1 block font-display text-2xl font-semibold text-cream">
              {formatRupiah(priceOf(bean))}
            </span>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/25 text-cream transition-colors group-hover:border-warm group-hover:bg-warm group-hover:text-ink">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function CoffeeCatalogue({ beans }: { beans: CoffeeBean[] }) {
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [taste, setTaste] = useState<TasteBucketId | null>(null);
  const [sort, setSort] = useState<SortKey>('default');

  const featured = useMemo(
    () => beans.filter((b) => b.is_featured),
    [beans],
  );
  const primary =
    featured.find((b) => b.slug === 'arabika-gayo') ??
    featured[0] ??
    (beans[0] as CoffeeBean | undefined);
  const secondary = featured.filter((b) => b.slug !== primary?.slug);

  const filtered = useMemo(() => {
    let list = beans.filter((bean) => {
      if (category !== 'ALL' && beanCategory(bean.name) !== category) return false;
      if (taste && !beanTasteIds(bean.flavorNotes).includes(taste)) return false;
      return true;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === 'price-desc') list = [...list].sort((a, b) => priceOf(b) - priceOf(a));

    return list;
  }, [beans, category, taste, sort]);

  const tasteCount = (id: TasteBucketId) =>
    beans.filter((b) => beanTasteIds(b.flavorNotes).includes(id)).length;

  const resetFilters = () => {
    setCategory('ALL');
    setTaste(null);
  };

  return (
    <section id="katalog" className="scroll-mt-24 bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
        {/* ROASTER'S SELECTION */}
        {primary && (
          <div className="bg-ink px-6 py-14 text-paper md:px-12 md:py-20">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-warm">
                  Roaster&rsquo;s Selection
                </p>
                <h2 className="font-display text-3xl leading-tight text-cream md:text-4xl">
                  Pilihan dari Roaster
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-paper/60">
                Tiga biji yang paling kami banggakan musim ini — dikemas untuk dibawa
                pulang.
              </p>
            </div>

            <FeaturedBean bean={primary} large />

            {secondary.length > 0 && (
              <div className="mt-10 border-t border-paper/10">
                {secondary.map((bean) => (
                  <FeaturedBean key={bean.slug} bean={bean} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catalogue header */}
        <div className="pt-16 md:pt-24">
          <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
            <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
            Katalog
          </p>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="font-display text-4xl leading-tight text-ink md:text-5xl">
              Semua Biji
            </h2>
            <p className="text-sm tabular-nums text-muted-foreground">
              {filtered.length} dari {beans.length} biji
            </p>
          </div>
        </div>

        {/* Sticky filter bar */}
        <div className="sticky top-16 z-30 -mx-4 mt-8 border-y border-ink/10 bg-paper/95 px-4 backdrop-blur-md md:top-20 md:mx-0 md:px-0">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="no-scrollbar -mx-4 flex items-center gap-7 overflow-x-auto px-4 md:mx-0 md:px-0">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'relative shrink-0 pb-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink',
                    category === c.id ? 'text-ink' : 'text-muted-foreground hover:text-ink',
                  )}
                >
                  {c.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 bottom-0 h-px bg-coffee transition-transform',
                      category === c.id ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-5 md:flex">
              <button
                type="button"
                onClick={() => setSort('default')}
                aria-pressed={sort === 'default'}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                  sort === 'default' ? 'text-ink' : 'text-muted-foreground hover:text-ink',
                )}
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                Rekomendasi
              </button>
              <button
                type="button"
                onClick={() => setSort('price-asc')}
                aria-pressed={sort === 'price-asc'}
                className={cn(
                  'text-xs font-medium uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                  sort === 'price-asc' ? 'text-ink' : 'text-muted-foreground hover:text-ink',
                )}
              >
                Termurah
              </button>
              <button
                type="button"
                onClick={() => setSort('price-desc')}
                aria-pressed={sort === 'price-desc'}
                className={cn(
                  'text-xs font-medium uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                  sort === 'price-desc' ? 'text-ink' : 'text-muted-foreground hover:text-ink',
                )}
              >
                Termahal
              </button>
            </div>
          </div>
        </div>

        {/* Discovery — Find your coffee */}
        <div className="py-12 md:py-16">
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Cari berdasarkan rasa
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {TASTE_BUCKETS.map((bucket) => {
              const active = taste === bucket.id;
              return (
                <button
                  key={bucket.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTaste(active ? null : bucket.id)}
                  className={cn(
                    'flex items-baseline gap-3 border-b pb-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink',
                    active
                      ? 'border-coffee text-ink'
                      : 'border-ink/15 text-muted-foreground hover:border-ink/40 hover:text-ink',
                  )}
                >
                  <span className="font-display text-xl leading-none">{bucket.label}</span>
                  <span className="text-[10px] tabular-nums uppercase tracking-widest text-coffee">
                    {tasteCount(bucket.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editorial list */}
        {filtered.length === 0 ? (
          <div className="border-y border-ink/10 py-24 text-center">
            <h3 className="font-display text-3xl text-ink">Belum ada yang cocok</h3>
            <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
              Coba kombinasi lain, atau kembali ke seluruh koleksi.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-8 border-b border-ink/30 pb-1 text-sm font-semibold text-ink transition-colors hover:border-coffee hover:text-coffee"
            >
              Lihat Semua Biji
            </button>
          </div>
        ) : (
          <ul className="pb-24 md:pb-32">
            {filtered.map((bean, i) => (
              <BeanRow key={bean.slug} bean={bean} index={i} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}