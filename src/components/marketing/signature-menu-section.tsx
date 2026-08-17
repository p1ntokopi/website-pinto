import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { formatRupiah, getMenu, type MenuItem } from '@/lib/shop';
import { drinkImage } from '@/config/images';
import { SectionHeader } from './section-header';
import { MenuCarousel } from './menu-carousel';
import { cn } from '@/lib/utils';

const FEATURED_SLUGS = ['sanger-latte', 'aren-latte', 'v-60', 'matcha-latte'];

const LAYOUT: Record<string, { span: string; offset?: string; label: string }> = {
  'sanger-latte': { span: 'md:col-span-7', label: 'Signature' },
  'aren-latte': { span: 'md:col-span-5', offset: 'md:mt-24', label: 'Klasik' },
  'v-60': { span: 'md:col-span-5', label: 'Manual Brew' },
  'matcha-latte': { span: 'md:col-span-7', offset: 'md:mt-24', label: 'Non-Kopi' },
};

function MenuCard({
  item,
  label,
  className,
}: {
  item: MenuItem;
  label: string;
  className?: string;
}) {
  return (
    <Link href="/menu" className={cn('group block', className)}>
      <div className="relative mb-6 aspect-[4/5] w-full overflow-hidden rounded-sm bg-warm/10">
        <Image
          src={drinkImage(item.slug)}
          alt={item.name}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl text-ink transition-colors duration-300 group-hover:text-coffee md:text-3xl">
          {item.name}
        </h3>
        <span className="shrink-0 text-sm font-semibold text-ink">
          {formatRupiah(item.base_price)}
        </span>
      </div>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
        {label}
      </p>
    </Link>
  );
}

export async function SignatureMenuSection() {
  const sections = await getMenu();
  const drinks = sections.flatMap((s) => s.items);

  const featured = FEATURED_SLUGS.map((slug) => {
    const item = drinks.find((d) => d.slug === slug);
    if (!item) return null;
    return { item, ...LAYOUT[slug] };
  }).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <section className="w-full bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-16 flex flex-col justify-between gap-10 md:mb-20 md:flex-row md:items-end">
          <SectionHeader
            eyebrow="Pilihan Terpopuler"
            lines={['Favorit dari', { text: 'Bar Kami', italic: true }]}
          />
          <Link
            href="/menu"
            className="group flex shrink-0 items-center gap-2 self-start text-sm font-semibold uppercase tracking-widest text-ink transition-colors hover:text-coffee md:self-auto"
          >
            <span className="border-b border-ink pb-1 transition-colors group-hover:border-coffee">
              Lihat Menu Lengkap
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Desktop / tablet asymmetric grid */}
        <div className="hidden grid-cols-1 gap-x-6 gap-y-14 md:grid md:grid-cols-12 md:gap-x-8">
          {featured.map(({ item, span, offset, label }) => (
            <MenuCard
              key={item.slug}
              item={item}
              label={label}
              className={cn(span, offset)}
            />
          ))}
        </div>

        {/* Mobile swipe carousel */}
        <div className="md:hidden">
          <MenuCarousel
            items={featured.map(({ item, label }) => ({ item, label }))}
          />
        </div>
      </div>
    </section>
  );
}