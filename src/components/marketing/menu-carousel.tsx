'use client';

import { useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { MenuItem } from '@/lib/shop';
import { drinkImage } from '@/config/images';
import { useActiveSlide, useScrollToSlide } from './swipe-carousel';
import { cn } from '@/lib/utils';

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

interface MenuCarouselItem {
  item: MenuItem;
  label: string;
}

export function MenuCarousel({ items }: { items: MenuCarouselItem[] }) {
  const reduced = useReducedMotion();
  const { scrollerRef, active } = useActiveSlide();
  const go = useScrollToSlide(reduced);
  const count = items.length;

  return (
    <div>
      <div
        ref={scrollerRef}
        role="group"
        aria-label="Favorit Pinto — geser untuk melihat"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2"
      >
        {items.map(({ item, label }, i) => (
          <div key={item.slug} data-slide className="w-[85%] shrink-0 snap-start">
            <Link
              href="/menu"
              className={cn(
                'group block transition-opacity duration-500',
                i === active ? 'opacity-100' : 'opacity-40',
              )}
            >
              <div className="relative mb-5 aspect-[4/5] w-full overflow-hidden rounded-sm bg-warm/10">
                <Image
                  src={drinkImage(item.slug)}
                  alt={item.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 85vw"
                  className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 border border-cream/30 bg-ink/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                  {label}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl text-ink">{item.name}</h3>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {formatPrice(item.base_price)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {items.map(({ item }, i) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => go(scrollerRef.current, i)}
              aria-label={`Tampilkan ${item.name}`}
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
            aria-label="Favorit sebelumnya"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(scrollerRef.current, active + 1)}
            disabled={active === count - 1}
            aria-label="Favorit berikutnya"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
