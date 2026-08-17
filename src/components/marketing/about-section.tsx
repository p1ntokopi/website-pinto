import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { images } from '@/config/images';
import { SectionHeader } from './section-header';
import { RevealFade } from './reveal-heading';

const DIRECTIONS_URL = 'https://maps.app.goo.gl/p7UhDrsRF1SbVEVh9';

const FACTS = [
  { label: 'Berdiri Sejak', value: '2024' },
  { label: 'Berbasis di', value: 'Bogor, Jawa Barat' },
  { label: 'Biji Kopi Nusantara', value: '22+ Pilihan' },
  { label: 'Buka Setiap Hari', value: '08.00 — 22.00' },
];

export function AboutSection() {
  return (
    <section className="w-full border-t border-ink/5 bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <RevealFade className="lg:col-span-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-warm/10">
              <Image
                src={images.cafe.interiorWarm}
                alt="Suasana hangat di dalam Kafe P1NTO"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </RevealFade>

          <div className="lg:col-span-6">
            <SectionHeader
              eyebrow="Tentang P1NTO"
              lines={[
                'Kafe, roastery, dan',
                { text: 'rumah bagi momen.', italic: true },
              ]}
            />
            <RevealFade delay={0.2}>
              <p className="mb-8 mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                P1NTO adalah ruang kecil di Bogor tempat kopi Nusantara
                disangrai, diseduh, dan dinikmati. Di bar kami, semuanya
                sederhana: kopi yang jujur, makanan yang mengenyangkan, dan
                waktu yang dibiarkan berjalan pelan.
              </p>

              <ul className="divide-y divide-ink/10 border-y border-ink/10">
                {FACTS.map((fact) => (
                  <li
                    key={fact.label}
                    className="flex items-baseline justify-between gap-6 py-4"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                      {fact.label}
                    </span>
                    <span className="text-right font-display text-xl text-ink">
                      {fact.value}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    size: 'lg',
                    className:
                      'h-14 rounded-full bg-ink px-8 text-base text-paper hover:bg-ink/90',
                  })}
                >
                  Petunjuk Arah
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/locations"
                  className={buttonVariants({
                    size: 'lg',
                    variant: 'outline',
                    className:
                      'h-14 rounded-full border-ink px-8 text-base text-ink hover:bg-ink hover:text-paper',
                  })}
                >
                  Lihat Lokasi
                </Link>
              </div>
            </RevealFade>
          </div>
        </div>
      </div>
    </section>
  );
}