import Image from 'next/image';
import Link from 'next/link';
import { formatRupiah, type MenuItem } from '@/lib/shop';
import { drinkImage } from '@/config/images';
import { SectionHeader } from '../section-header';
import { RevealFade } from '../reveal-heading';
import { cn } from '@/lib/utils';

export type SignatureDrink = {
  item: MenuItem;
  label: string;
  categoryId: string;
};

const LAYOUT: Record<string, { span: string; offset?: string }> = {
  'sanger-latte': { span: 'md:col-span-7' },
  'aren-latte': { span: 'md:col-span-5', offset: 'md:mt-24' },
  'v-60': { span: 'md:col-span-5' },
  'matcha-latte': { span: 'md:col-span-7', offset: 'md:mt-24' },
};

export function MenuSignatures({ signatures }: { signatures: SignatureDrink[] }) {
  if (signatures.length === 0) return null;

  return (
    <section
      id="menu-signatures"
      aria-labelledby="signatures-heading"
      className="w-full scroll-mt-44 border-y border-ink/5 bg-paper"
    >
      <div className="container mx-auto px-4 py-20 md:px-8 md:py-28">
        <div className="mb-14 flex flex-col justify-between gap-8 md:mb-16 md:flex-row md:items-end">
          <SectionHeader
            eyebrow="P1NTO Signatures"
            lines={['Paling dicari', 'dari bar kami.']}
            titleClassName="text-4xl md:text-5xl lg:text-6xl"
          />
          <RevealFade delay={0.15}>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
              Tiga rasa ikonik yang meluncur dari bar setiap hari — resep yang sama, dari
              dulu hingga sekarang.
            </p>
          </RevealFade>
        </div>

        <div className="hidden grid-cols-1 gap-x-6 gap-y-14 md:grid md:grid-cols-12 md:gap-x-8">
          {signatures.map(({ item, label, categoryId }) => {
            const layout = LAYOUT[item.slug] ?? { span: 'md:col-span-6' };
            return (
              <Link
                key={item.slug}
                href={`/menu#menu-${categoryId}`}
                className={cn('group block', layout.span, layout.offset)}
              >
                <div className="relative mb-6 aspect-[4/5] w-full overflow-hidden rounded-sm bg-warm/10">
                  <Image
                    src={drinkImage(item.slug)}
                    alt={item.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute bottom-4 left-4 border border-cream/30 bg-ink/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                    {label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-2xl text-ink transition-colors duration-300 group-hover:text-coffee md:text-3xl">
                    {item.name}
                  </h3>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {formatRupiah(item.base_price)}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile — horizontal swipe strip */}
        <RevealFade className="md:hidden">
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
            {signatures.map(({ item, label, categoryId }) => (
              <Link
                key={item.slug}
                href={`/menu#menu-${categoryId}`}
                className="group w-[85%] shrink-0 snap-start"
              >
                <div className="relative mb-5 aspect-[4/5] w-full overflow-hidden rounded-sm bg-warm/10">
                  <Image
                    src={drinkImage(item.slug)}
                    alt={item.name}
                    fill
                    sizes="85vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
                  />
                  <span className="absolute bottom-4 left-4 border border-cream/30 bg-ink/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                    {label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-2xl text-ink">{item.name}</h3>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {formatRupiah(item.base_price)}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </RevealFade>
      </div>
    </section>
  );
}
