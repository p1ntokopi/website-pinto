import Image from 'next/image';
import { images } from '@/config/images';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';

export function StoryIntro() {
  return (
    <section className="w-full border-t border-ink/10 bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <RevealFade className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
              01 — Dari Sini
            </p>
          </RevealFade>

          <div className="lg:col-span-9">
            <RevealHeading
              as="h2"
              lines={[
                'Kopi yang baik',
                { text: 'seharusnya terasa dekat.', italic: true },
              ]}
              className="font-display text-[clamp(2.2rem,5.5vw,4.25rem)] leading-[1.05] tracking-tight text-ink"
            />

            <RevealFade delay={0.2}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Pinto lahir di Bogor dari satu ide sederhana: kopi terbaik layak
                diperlakukan dengan hormat — dari petani yang menanamnya hingga
                orang yang menyajikannya.
              </p>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Kami memulai dengan satu mesin espresso, empat kursi, dan keyakinan
                bahwa kopi bisa mendekatkan orang.
              </p>
            </RevealFade>
          </div>
        </div>
      </div>

      {/* Photographic element — raw beans */}
      <RevealFade y={40}>
        <figure className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/40 sm:aspect-[21/9]">
            <Image
              src={images.beans.rawA}
              alt="Biji kopi hijau yang menanti untuk disangrai"
              fill
              sizes="(min-width: 768px) 90vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            <span>Biji hijau — awal setiap cerita</span>
            <span className="hidden md:inline">Pinto Roastery</span>
          </figcaption>
        </figure>
      </RevealFade>
    </section>
  );
}