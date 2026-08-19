import Image from 'next/image';
import { images } from '@/config/images';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';

export function StoryCraft() {
  return (
    <section className="w-full border-t border-ink/10 bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Images — stacked, offset */}
          <div className="lg:col-span-7">
            <RevealFade y={40}>
              <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/40">
                <Image
                  src={images.cafe.pour}
                  alt="Penyeduhan manual dilakukan dengan teliti"
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </figure>
            </RevealFade>
            <RevealFade y={40} delay={0.15}>
              <figure className="relative -mt-10 ml-auto aspect-[4/3] w-[82%] overflow-hidden rounded-sm bg-cream/40 sm:-mt-16 md:w-3/4">
                <Image
                  src={images.beans.hands}
                  alt="Tangan yang menyiapkan biji kopi"
                  fill
                  sizes="(min-width: 640px) 50vw, 80vw"
                  className="object-cover"
                />
              </figure>
            </RevealFade>
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <RevealFade>
              <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
                <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
                04 — Orang di Balik Cangkir
              </p>
            </RevealFade>

            <RevealHeading
              as="h2"
              lines={[
                'Di balik setiap cangkir,',
                { text: 'ada tangan yang teliti.', italic: true },
              ]}
              className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tight text-ink"
            />

            <RevealFade delay={0.2}>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
                Barista kami meracik setiap cangkir dengan presisi dan penuh
                perhatian — satu cangkir demi satu cangkir, dibuat seperti
                yang pertama di hari itu.
              </p>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Kesabaran di bar terasa di setiap tegukan.
              </p>
            </RevealFade>
          </div>
        </div>
      </div>
    </section>
  );
}