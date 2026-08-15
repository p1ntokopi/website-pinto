import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getCoffeeBeanBySlug, formatRupiah } from '@/lib/shop';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bean = await getCoffeeBeanBySlug(slug);
  if (!bean) return { title: 'Kopi Tidak Ditemukan | P1NTO Coffee' };

  return {
    title: `${bean.name} | P1NTO Coffee`,
    description: bean.description ?? `Single origin dari ${bean.origin?.country ?? 'roastery kami'}.`,
  };
}

const BEAN_IMAGES: Record<string, string> = {
  'bean-ethiopia-guji': 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=1600&auto=format&fit=crop',
  'bean-colombia-huila': 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=1600&auto=format&fit=crop',
  'bean-aceh-gayo': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop',
  'bean-p1nto-house': 'https://images.unsplash.com/photo-1620189507195-68309c04c4d0?q=80&w=1600&auto=format&fit=crop',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=1600&auto=format&fit=crop';

function detailRow(label: string, value: string | number | null | undefined) {
  if (value === null || value === '') return null;
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3">
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
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

  const image = BEAN_IMAGES[bean.slug] ?? FALLBACK_IMAGE;
  const altitudeMin = bean.altitude_min;
  const altitudeMax = bean.altitude_max;
  let altitude: string | null = null;
  if (altitudeMin && altitudeMax) altitude = `${altitudeMin} – ${altitudeMax} m`;
  else if (altitudeMin) altitude = `${altitudeMin} m`;
  else if (altitudeMax) altitude = `${altitudeMax} m`;

  return (
    <>
      <section className="w-full bg-paper py-12 md:py-16 border-b border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <Link
            href="/coffee"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Semua Kopi
          </Link>
        </div>
      </section>

      <section className="w-full bg-paper py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            <div className="w-full lg:w-1/2">
              <div className="relative aspect-square w-full rounded-sm overflow-hidden bg-ink/5">
                <Image src={image} alt={bean.name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee mb-4">
                {bean.origin ? `${bean.origin.country} · ${bean.origin.region ?? ''}` : 'Roastery P1NTO'}
              </p>
              <h1 className="font-display text-5xl md:text-6xl text-ink leading-[1.05] mb-6">{bean.name}</h1>
              {bean.description && (
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">{bean.description}</p>
              )}

              {bean.flavorNotes.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
                    Profil Rasa
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bean.flavorNotes.map((note) => (
                      <span key={note} className="rounded-full border border-ink/20 px-4 py-1.5 text-sm text-ink">
                        {note}
                      </span>
                    ))}
                  </div>
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
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
                    Ukuran Tersedia
                  </p>
                  <ul className="divide-y divide-ink/10 border-y border-ink/10">
                    {bean.variants.map((variant) => (
                      <li key={variant.id} className="flex items-center justify-between py-3">
                        <div>
                          <span className="font-medium text-ink">{variant.weight_grams}g</span>
                          <span className="text-sm text-muted-foreground ml-3">{variant.grind_type}</span>
                        </div>
                        <span className="font-semibold text-ink">{formatRupiah(variant.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto flex flex-col sm:flex-row gap-4">
                <Link
                  href="/locations"
                  className={buttonVariants({
                    size: 'lg',
                    className: 'rounded-full h-14 px-8 bg-ink text-paper hover:bg-ink/90 shadow-none',
                  })}
                >
                  <MapPin className="mr-2 h-4 w-4" /> Beli di Kafe Kami
                </Link>
                <Link
                  href="/coffee"
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'lg',
                    className: 'rounded-full h-14 px-8 border-ink text-ink hover:bg-ink hover:text-paper',
                  })}
                >
                  Lihat Biji Lainnya
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(bean.story || bean.brewing_notes) && (
        <section className="w-full bg-ink text-paper py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-8 max-w-3xl">
            {bean.story && (
              <div className="mb-12">
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-warm mb-4">Kisah</p>
                <p className="font-display text-3xl md:text-4xl text-cream leading-snug">{bean.story}</p>
              </div>
            )}
            {bean.brewing_notes && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-warm mb-4">Catatan Seduh</p>
                <p className="text-paper/80 text-lg leading-relaxed">{bean.brewing_notes}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}