import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { images } from '@/config/images';
import { SectionHeader } from './section-header';
import { RevealFade } from './reveal-heading';

export function BrandStorySection() {
  return (
    <section className="w-full overflow-hidden bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center gap-16 lg:flex-row lg:gap-24">
          <div className="z-10 order-1 flex w-full flex-col justify-center lg:order-1 lg:w-[44%]">
            <SectionHeader
              eyebrow="Kisah Kami"
              lines={[
                'Lebih dari',
                { text: 'Sekadar Kopi', italic: true },
              ]}
              titleClassName="text-4xl md:text-5xl lg:text-6xl"
            />
            <RevealFade delay={0.2}>
              <p className="mb-8 mt-6 max-w-md text-lg leading-relaxed text-muted-foreground md:text-xl">
                Pinto lahir di Bogor dari satu ide sederhana: kopi terbaik
                layak diperlakukan dengan hormat — dari petani yang menanam,
                hingga orang yang menyajikannya.
              </p>
              <p className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground">
                Kami menyangrai sendiri dalam batch kecil, meracik resep yang
                jujur di bar, dan memperlakukan setiap tamu seperti orang yang
                sedang kami tunggu.
              </p>
            </RevealFade>
            <RevealFade delay={0.3}>
              <Link
                href="/story"
                className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-ink transition-colors hover:text-coffee"
              >
                <span className="border-b border-ink pb-1 transition-colors group-hover:border-coffee">
                  Baca Kisah Kami
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </RevealFade>
          </div>

          <div className="order-2 w-full lg:order-2 lg:w-[56%]">
            <RevealFade y={40}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-warm/20 lg:aspect-[5/4] lg:h-[78vh]">
                <Image
                  src={images.cafe.barista}
                  alt="Barista Pinto menuang kopi"
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-warm/20 to-transparent" />
              </div>
            </RevealFade>
          </div>
        </div>
      </div>
    </section>
  );
}