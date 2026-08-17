import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { formatRupiah, getCoffeeBeans, type CoffeeBean } from '@/lib/shop';
import { beanImage } from '@/config/images';
import { SectionHeader } from './section-header';
import { RevealFade } from './reveal-heading';

function spec(label: string, value: string | null) {
  if (!value) return null;
  return (
    <div className="border-t border-paper/10 py-4">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-paper/50">
        {label}
      </p>
      <p className="text-paper/90">{value}</p>
    </div>
  );
}

export async function RoasterySection() {
  const beans = await getCoffeeBeans();

  const bySlug = (slug: string) => beans.find((b) => b.slug === slug);
  const featured =
    bySlug('arabika-gayo') ?? bySlug('blend-a70-r30') ?? beans[0];

  const supporting = [
    bySlug('arabika-toraja'),
    bySlug('robusta-lampung'),
    bySlug('blend-a30-r70'),
  ].filter((b): b is CoffeeBean => Boolean(b));

  if (!featured) {
    return (
      <section className="w-full bg-ink py-24 text-paper md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <p className="text-lg text-paper/60">
            Rak roastery kami sedang diisi ulang. Nantikan kembali.
          </p>
        </div>
      </section>
    );
  }

  const price = featured.variants[0]?.price ?? featured.base_price;
  const weight = featured.variants[0]?.weight_grams;
  const origin = featured.origin?.country ?? 'Nusantara';
  const notes = featured.flavorNotes.slice(0, 3).join(' · ');

  return (
    <section className="w-full bg-ink py-24 text-paper md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-16 flex flex-col justify-between gap-10 md:mb-24 md:flex-row md:items-end">
          <SectionHeader
            dark
            eyebrow="Dari Roastery Kami"
            lines={['Bawa P1NTO', { text: 'ke Rumah.', italic: true }]}
            description="Perhatian yang sama untuk setiap cangkir di bar, dikemas dalam kopi yang bisa Anda seduh di rumah."
          />
          <Link
            href="/coffee"
            className="group flex shrink-0 items-center gap-2 self-start text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:text-warm md:self-auto"
          >
            <span className="border-b border-cream/30 pb-1 transition-colors group-hover:border-warm">
              Beli Biji Kopi
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Featured bean */}
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <RevealFade className="lg:col-span-7">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-paper/5">
              <Image
                src={beanImage(featured.slug)}
                alt={`${featured.name} — kopi sangrai P1NTO`}
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <div className="absolute left-6 top-6 hidden md:block">
                <span className="border border-cream/30 bg-ink/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                  {featured.roast_level ?? 'Kopi Sangrai'}
                </span>
              </div>
            </div>
          </RevealFade>

          <div className="lg:col-span-5">
            <RevealFade delay={0.1}>
              <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-warm">
                <span className="h-px w-8 bg-warm/50" />
                Origin — {origin}
              </p>
              <h3 className="font-display text-4xl leading-[1.05] text-cream md:text-5xl lg:text-6xl">
                {featured.name}
              </h3>
              {featured.origin?.region && (
                <p className="mt-2 text-base text-paper/60">
                  {featured.origin.region}
                </p>
              )}
              {notes && (
                <p className="mt-6 font-display text-xl italic text-paper/85 md:text-2xl">
                  {notes}.
                </p>
              )}

              <div className="mt-8">
                {spec('Proses', featured.process)}
                {spec('Tingkat Sangrai', featured.roast_level)}
                {spec('Berat', weight ? `${weight}g` : null)}
                {spec('Harga', formatRupiah(price))}
              </div>

              <Link
                href={`/coffee/${featured.slug}`}
                className={buttonVariants({
                  size: 'lg',
                  className:
                    'mt-8 h-14 rounded-full bg-warm px-8 text-base text-ink hover:bg-cream',
                })}
              >
                Lihat Biji Ini
              </Link>
            </RevealFade>
          </div>
        </div>

        {/* Supporting beans */}
        {supporting.length > 0 && (
          <div className="mt-20 md:mt-28">
            {/* Mobile — horizontal swipe strip */}
            <RevealFade className="md:hidden">
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2">
                {supporting.map((bean) => {
                  const p = bean.variants[0]?.price ?? bean.base_price;
                  const o = bean.origin?.country ?? 'Nusantara';
                  const ns = bean.flavorNotes.slice(0, 3).join(' · ');
                  return (
                    <Link
                      key={bean.slug}
                      href={`/coffee/${bean.slug}`}
                      className="group w-[70%] shrink-0 snap-start border-t border-paper/10 pt-5 transition-colors"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-paper/50">
                        {o} · {bean.roast_level ?? 'Roast'}
                      </p>
                      <h4 className="mt-2 font-display text-2xl text-cream transition-colors duration-300 group-hover:text-warm">
                        {bean.name}
                      </h4>
                      <p className="mt-2 font-display text-sm italic text-paper/70">
                        {ns}.
                      </p>
                      <p className="mt-4 text-sm font-semibold text-paper">
                        {formatRupiah(p)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </RevealFade>

            {/* Desktop — editorial list */}
            <RevealFade className="hidden md:block">
              <div>
                {supporting.map((bean) => {
                  const p = bean.variants[0]?.price ?? bean.base_price;
                  const o = bean.origin?.country ?? 'Nusantara';
                  const ns = bean.flavorNotes.slice(0, 3).join(' · ');
                  return (
                    <Link
                      key={bean.slug}
                      href={`/coffee/${bean.slug}`}
                      className="group grid grid-cols-1 items-baseline gap-2 border-t border-paper/10 py-6 transition-colors last:border-b md:grid-cols-12 md:gap-4"
                    >
                      <span className="font-display text-xl text-cream transition-colors duration-300 group-hover:text-warm md:col-span-4 md:text-2xl">
                        {bean.name}
                      </span>
                      <span className="text-sm text-paper/60 md:col-span-3">
                        {o} · {bean.roast_level ?? 'Roast'}
                      </span>
                      <span className="font-display text-sm italic text-paper/70 md:col-span-3">
                        {ns}
                      </span>
                      <span className="text-sm font-semibold text-paper md:col-span-2 md:text-right">
                        {formatRupiah(p)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </RevealFade>
          </div>
        )}
      </div>
    </section>
  );
}
