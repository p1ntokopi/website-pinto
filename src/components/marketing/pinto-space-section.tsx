import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { images } from '@/config/images';
import { SectionHeader } from './section-header';
import { RevealFade } from './reveal-heading';

const DIRECTIONS_URL = 'https://maps.app.goo.gl/p7UhDrsRF1SbVEVh9';

export function PintoSpaceSection() {
  return (
    <section className="w-full bg-ink py-24 text-paper md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-14 flex flex-col justify-between gap-10 md:mb-20 lg:flex-row lg:items-end">
          <SectionHeader
            dark
            eyebrow="Kafe Kami"
            lines={[
              'Datang untuk kopi.',
              { text: 'Bertahan untuk momen.', italic: true },
            ]}
            titleClassName="text-4xl md:text-5xl lg:text-6xl"
          />
          <RevealFade delay={0.2} className="shrink-0">
            <Link
              href="/cafe"
              className={buttonVariants({
                size: 'lg',
                className:
                  'h-14 rounded-full bg-warm px-8 text-base text-ink hover:bg-cream',
              })}
            >
              Kunjungi Pinto
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </RevealFade>
        </div>

        {/* Asymmetric collage */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          <RevealFade className="md:col-span-7">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-paper/5 md:aspect-[4/3] md:h-[560px]">
              <Image
                src={images.cafe.interior}
                alt="Interior Kafe Pinto"
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover"
              />
            </div>
          </RevealFade>

          <div className="md:col-span-5">
            <RevealFade delay={0.15}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-paper/5 md:h-[270px] md:aspect-auto">
                <Image
                  src={images.cafe.table}
                  alt="Detail meja kopi Pinto"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </RevealFade>
            <RevealFade delay={0.25}>
              <div className="relative -mt-16 ml-auto aspect-[4/3] w-3/4 overflow-hidden rounded-sm bg-paper/5 md:-mt-24 md:h-[300px] md:aspect-auto">
                <Image
                  src={images.cafe.pour}
                  alt="Penyeduhan manual di Pinto"
                  fill
                  sizes="(min-width: 768px) 40vw, 75vw"
                  className="object-cover"
                />
              </div>
            </RevealFade>
          </div>
        </div>

        {/* Info strip */}
        <RevealFade delay={0.1}>
          <div className="mt-14 grid grid-cols-1 gap-8 border-t border-paper/10 pt-10 md:mt-20 md:grid-cols-3 md:gap-12">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-paper/50">
                Jam Buka
              </p>
              <p className="text-xl text-cream">13.00 — 24.00 · Setiap Hari</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-paper/50">
                Lokasi
              </p>
              <p className="text-xl leading-relaxed text-cream">
                Perumahan Bumi Insani, Jl. Flamboyan No. 8, Tajur Halang, Bogor
              </p>
            </div>
            <div className="flex items-end">
              <Link
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  variant: 'outline',
                  className:
                    'h-12 rounded-full border-paper/20 px-8 text-paper hover:bg-paper hover:text-ink',
                })}
              >
                Petunjuk Arah
              </Link>
            </div>
          </div>
        </RevealFade>
      </div>
    </section>
  );
}