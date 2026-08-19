import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { formatRupiah, type CoffeeBean } from '@/lib/shop';
import { beanImage } from '@/config/images';
import { waLink } from '@/config/whatsapp';
import { SectionHeader } from '../section-header';
import { RevealFade } from '../reveal-heading';

function spec(label: string, value: string | null | undefined) {
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

export function MenuRoastery({
  featured,
  supporting,
}: {
  featured: CoffeeBean | null;
  supporting: CoffeeBean[];
}) {
  return (
    <section
      id="menu-roastery"
      aria-labelledby="roastery-heading"
      className="w-full scroll-mt-44 bg-ink py-20 text-paper md:py-28"
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-14 flex flex-col justify-between gap-8 md:mb-20 md:flex-row md:items-end">
          <SectionHeader
            dark
            eyebrow="P1NTO Roastery"
            lines={['Biji dari', 'satu pulau,', { text: 'banyak rasa.', italic: true }]}
            titleClassName="text-4xl md:text-5xl lg:text-6xl"
            description="Dipanggang in-house setiap minggu. Bawa pulang perhatian dari setiap cangkir di bar."
          />
          <RevealFade delay={0.15}>
            <Link
              href="/coffee"
              className="group flex shrink-0 items-center gap-2 self-start text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:text-warm md:self-auto"
            >
              <span className="border-b border-cream/30 pb-1 transition-colors group-hover:border-warm">
                Lihat Semua Biji
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </RevealFade>
        </div>

        {featured ? (
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
                  <span className="h-px w-8 bg-warm/50" aria-hidden="true" />
                  Origin — {featured.origin?.country ?? 'Nusantara'}
                </p>
                <h3 className="font-display text-4xl leading-[1.05] text-cream md:text-5xl lg:text-6xl">
                  {featured.name}
                </h3>
                {featured.flavorNotes.length > 0 && (
                  <p className="mt-6 font-display text-xl italic text-paper/85 md:text-2xl">
                    {featured.flavorNotes.slice(0, 3).join(' · ')}.
                  </p>
                )}

                <div className="mt-8">
                  {spec('Proses', featured.process)}
                  {spec('Tingkat Sangrai', featured.roast_level)}
                  {featured.origin?.region && spec('Wilayah', featured.origin.region)}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href={waLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      size: 'lg',
                      className: 'h-14 rounded-full bg-warm px-8 text-base text-ink hover:bg-cream',
                    })}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Pesan via WhatsApp
                  </Link>
                  <Link
                    href={`/coffee/${featured.slug}`}
                    className={buttonVariants({
                      size: 'lg',
                      className: 'h-14 rounded-full border border-paper/25 bg-transparent px-8 text-base text-cream hover:bg-paper hover:text-ink',
                    })}
                  >
                    Lihat Biji Ini
                  </Link>
                </div>
              </RevealFade>
            </div>
          </div>
        ) : (
          <p className="text-lg text-paper/60">
            Rak roastery kami sedang diisi ulang. Nantikan kembali.
          </p>
        )}

        {supporting.length > 0 && (
          <div className="mt-20 md:mt-28">
            <RevealFade>
              <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-paper/50">
                Pilihan Roastery
              </p>
            </RevealFade>

            {/* Mobile — horizontal swipe strip */}
            <RevealFade className="md:hidden">
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
                {supporting.map((bean) => {
                  const price = bean.variants[0]?.price ?? bean.base_price;
                  const notes = bean.flavorNotes.slice(0, 3).join(' · ');
                  return (
                    <Link
                      key={bean.slug}
                      href={`/coffee/${bean.slug}`}
                      className="group w-[70%] shrink-0 snap-start"
                    >
                      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-sm bg-paper/5">
                        <Image
                          src={beanImage(bean.slug)}
                          alt={bean.name}
                          fill
                          sizes="70vw"
                          className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
                        />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-paper/50">
                        {bean.origin?.country ?? 'Nusantara'} · {bean.roast_level ?? 'Roast'}
                      </p>
                      <h4 className="mt-2 font-display text-2xl text-cream transition-colors duration-300 group-hover:text-warm">
                        {bean.name}
                      </h4>
                      {notes && <p className="mt-2 font-display text-sm italic text-paper/70">{notes}.</p>}
                      <p className="mt-3 text-sm font-semibold text-paper">{formatRupiah(price)}</p>
                    </Link>
                  );
                })}
              </div>
            </RevealFade>

            {/* Desktop — editorial grid */}
            <RevealFade className="hidden md:block">
              <div className="grid grid-cols-1 gap-px overflow-hidden border border-paper/10 bg-paper/10 sm:grid-cols-2 lg:grid-cols-4">
                {supporting.map((bean) => {
                  const price = bean.variants[0]?.price ?? bean.base_price;
                  const notes = bean.flavorNotes.slice(0, 3).join(' · ');
                  return (
                    <Link
                      key={bean.slug}
                      href={`/coffee/${bean.slug}`}
                      className="group flex flex-col bg-ink p-6 transition-colors duration-300 hover:bg-ink/90"
                    >
                      <div className="relative mb-6 aspect-square w-full overflow-hidden rounded-sm bg-paper/5">
                        <Image
                          src={beanImage(bean.slug)}
                          alt={bean.name}
                          fill
                          sizes="(min-width: 1024px) 22vw, 50vw"
                          className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
                        />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-paper/50">
                        {bean.origin?.country ?? 'Nusantara'} · {bean.roast_level ?? 'Roast'}
                      </p>
                      <h4 className="mt-2 font-display text-2xl text-cream transition-colors duration-300 group-hover:text-warm">
                        {bean.name}
                      </h4>
                      {notes && <p className="mt-2 font-display text-sm italic text-paper/70">{notes}.</p>}
                      <div className="mt-6 flex items-end justify-between border-t border-paper/10 pt-4">
                        <span className="text-base font-semibold text-paper">{formatRupiah(price)}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-paper/20 text-cream transition-all duration-200 group-hover:border-warm group-hover:bg-warm group-hover:text-ink">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
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
