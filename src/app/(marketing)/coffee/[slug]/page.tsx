import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getCoffeeBeanBySlug, getCoffeeBeans, formatRupiah } from '@/lib/shop';
import { beanImage } from '@/config/images';
import { beanCategory, beanTasteIds, displayName } from '@/lib/coffee-utils';
import { WhatsAppLink } from '@/components/marketing/coffee/whatsapp-link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bean = await getCoffeeBeanBySlug(slug);
  if (!bean) return { title: 'Kopi Tidak Ditemukan | Pinto Coffee' };

  return {
    title: `${bean.name} | Pinto Coffee`,
    description: bean.description ?? `Single origin dari ${bean.origin?.country ?? 'roastery kami'}.`,
  };
}

function detailRow(label: string, value: string | number | null | undefined) {
  if (value === null || value === '') return null;
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3">
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}

export default async function CoffeeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bean = await getCoffeeBeanBySlug(slug);
  if (!bean) notFound();

  const [beans] = await Promise.all([getCoffeeBeans()]);

  const related = beans
    .filter((b) => b.slug !== bean.slug)
    .sort((a, b) => {
      const score = (x: (typeof a)['flavorNotes']) =>
        (beanCategory(a.name) === beanCategory(bean.name) ? 1 : 0) +
        (beanTasteIds(x).some((t) => beanTasteIds(bean.flavorNotes).includes(t)) ? 1 : 0);
      return score(b.flavorNotes) - score(a.flavorNotes);
    })
    .slice(0, 3);

  const altitudeMin = bean.altitude_min;
  const altitudeMax = bean.altitude_max;
  let altitude: string | null = null;
  if (altitudeMin && altitudeMax) altitude = `${altitudeMin} – ${altitudeMax} m`;
  else if (altitudeMin) altitude = `${altitudeMin} m`;
  else if (altitudeMax) altitude = `${altitudeMax} m`;

  const notes = bean.flavorNotes.join(' · ');

  return (
    <>
      <section className="w-full border-b border-ink/5 bg-paper py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <Link
            href="/coffee"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Semua Kopi
          </Link>
        </div>
      </section>

      <section className="w-full bg-paper py-12 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-ink/5">
                <Image
                  src={beanImage(bean.slug)}
                  alt={bean.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col lg:col-span-6">
              <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
                <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
                {bean.origin ? `${bean.origin.country} · ${bean.origin.region ?? ''}` : 'Roastery Pinto'}
              </p>
              <h1 className="mb-6 font-display text-4xl leading-[1.05] text-ink md:text-6xl">
                {displayName(bean.name)}
              </h1>
              {bean.description && (
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{bean.description}</p>
              )}

              {notes && (
                <div className="mb-8">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Profil Rasa
                  </p>
                  <p className="font-display text-xl italic leading-snug text-ink/80 md:text-2xl">
                    {notes}.
                  </p>
                </div>
              )}

              <div className="mb-8">
                {detailRow('Proses', bean.process)}
                {detailRow('Tingkat Sangrai', bean.roast_level)}
                {detailRow('Ketinggian', altitude)}
                {detailRow('Varietas', bean.variety)}
                {detailRow('Kebun', bean.origin?.farm)}
              </div>

              {bean.variants.length > 0 && (
                <div className="mb-8">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Ukuran Tersedia
                  </p>
                  <ul className="divide-y divide-ink/10 border-y border-ink/10">
                    {bean.variants.map((variant) => (
                      <li key={variant.id} className="flex items-center justify-between py-3">
                        <div>
                          <span className="font-medium text-ink">{variant.weight_grams}g</span>
                          <span className="ml-3 text-sm text-muted-foreground">{variant.grind_type}</span>
                        </div>
                        <span className="font-semibold text-ink">{formatRupiah(variant.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-4 pt-2 sm:flex-row">
                <WhatsAppLink
                  solid
                  className="h-14 rounded-full bg-coffee px-8 text-base text-paper hover:bg-ink"
                >
                  Pesan via WhatsApp
                </WhatsAppLink>
                <Link
                  href="/locations"
                  className={buttonVariants({
                    size: 'lg',
                    className: 'h-14 rounded-full bg-ink px-8 text-paper shadow-none hover:bg-coffee',
                  })}
                >
                  <MapPin className="mr-2 h-4 w-4" /> Beli di Kafe Kami
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(bean.story || bean.brewing_notes) && (
        <section className="w-full bg-ink py-20 text-paper md:py-28">
          <div className="container mx-auto max-w-3xl px-4 md:px-8">
            {bean.story && (
              <div className="mb-12">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-warm">Kisah</p>
                <p className="font-display text-3xl leading-snug text-cream md:text-4xl">{bean.story}</p>
              </div>
            )}
            {bean.brewing_notes && (
              <div>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-warm">
                  Catatan Seduh
                </p>
                <p className="text-lg leading-relaxed text-paper/80">{bean.brewing_notes}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="w-full border-t border-ink/10 bg-paper">
          <div className="container mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
                  <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
                  Lanjutkan menjelajah
                </p>
                <h2 className="font-display text-3xl leading-tight text-ink md:text-4xl">
                  Biji Serupa
                </h2>
              </div>
              <Link
                href="/coffee"
                className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-coffee md:inline-flex"
              >
                Semua Biji <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <ul>
              {related.map((item) => {
                const meta = [item.process, item.roast_level].filter(Boolean).join(' · ');
                return (
                  <li
                    key={item.slug}
                    className="group border-t border-ink/10 transition-colors last:border-b hover:bg-white/60"
                  >
                    <Link
                      href={`/coffee/${item.slug}`}
                      className="flex items-baseline justify-between gap-6 px-2 py-6 md:px-4"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-2xl text-ink transition-colors group-hover:text-coffee">
                          {displayName(item.name)}
                        </h3>
                        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                          {item.origin?.region ?? item.origin?.country ?? 'Nusantara'} · {meta}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                        {formatRupiah(item.variants[0]?.price ?? item.base_price)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}