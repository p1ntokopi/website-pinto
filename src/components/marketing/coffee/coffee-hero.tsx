import Image from 'next/image';
import { ArrowDown, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { images } from '@/config/images';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';
import { WhatsAppLink } from '@/components/marketing/coffee/whatsapp-link';
import { cn } from '@/lib/utils';

export function CoffeeHero() {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-12 lg:gap-16">
        {/* Text — 5 columns */}
        <div className="lg:col-span-5">
          <RevealFade>
            <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
              <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
              P1NTO Roastery
            </p>
          </RevealFade>

          <RevealHeading
            as="h1"
            lines={['Bawa P1NTO', { text: 'ke Rumah.', italic: true }]}
            className="font-display text-[clamp(2.9rem,7vw,5.25rem)] leading-[1.02] tracking-tight text-ink"
          />

          <RevealFade delay={0.2}>
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Pilihan biji yang kami sangrai dalam batch kecil — untuk menemani ritual
              seduh Anda di rumah.
            </p>
          </RevealFade>

          <RevealFade delay={0.3}>
            <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <a
                href="#katalog"
                className={buttonVariants({
                  size: 'lg',
                  className: 'h-14 rounded-full bg-ink px-8 text-base text-paper hover:bg-coffee',
                })}
              >
                Jelajahi Biji
                <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" />
              </a>
              <WhatsAppLink>Pesan via WhatsApp</WhatsAppLink>
            </div>
          </RevealFade>

          <RevealFade delay={0.4}>
            <a
              href="/locations"
              className="mt-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-ink"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Atau mampir ke kafe kami
            </a>
          </RevealFade>
        </div>

        {/* Image — 7 columns */}
        <RevealFade delay={0.15} className="lg:col-span-7">
          <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/40 sm:aspect-[16/10] lg:aspect-[7/5]">
            <Image
              src={images.beans.roasted}
              alt="Biji kopi sangrai segar dari roastery P1NTO"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
            <figcaption className="absolute bottom-5 left-5 hidden items-center gap-3 md:flex">
              <span className="border border-cream/40 bg-ink/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                Disangrai in-house
              </span>
            </figcaption>
          </figure>
        </RevealFade>
      </div>

      {/* Intro strip */}
      <div className="border-y border-ink/10 bg-white/40">
        <div
          className={cn(
            'mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8',
          )}
        >
          <p className="max-w-xl leading-relaxed">
            Dari bar ke rak dapur Anda — biji Nusantara pilihan, disangrai mingguan,
            dikemas segar, siap diseduh.
          </p>
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
            Single Origin · House Blend
          </p>
        </div>
      </div>
    </section>
  );
}