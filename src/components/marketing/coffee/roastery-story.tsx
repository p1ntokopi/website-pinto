import Image from 'next/image';
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { images } from '@/config/images';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';
import { WhatsAppLink } from '@/components/marketing/coffee/whatsapp-link';

export function RoasteryStory() {
  return (
    <>
      {/* Roastery story — dark asymmetric */}
      <section className="w-full bg-ink text-paper">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-12 lg:gap-16">
          <RevealFade className="order-2 lg:order-1 lg:col-span-7">
            <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream/10 sm:aspect-[16/10] lg:aspect-[7/5]">
              <Image
                src={images.beans.hands}
                alt="Tangan barista Pinto menangani biji kopi hijau"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <figcaption className="absolute bottom-5 left-5 hidden items-center gap-3 md:flex">
                <span className="border border-cream/40 bg-ink/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream backdrop-blur-sm">
                  Sourced &amp; roasted in-house
                </span>
              </figcaption>
            </figure>
          </RevealFade>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <RevealFade>
              <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-warm">
                <span className="h-px w-8 bg-warm/50" aria-hidden="true" />
                Roastery
              </p>
            </RevealFade>

            <RevealHeading
              as="h2"
              lines={['Dari bar,', { text: 'langsung ke', italic: true }, 'rumah Anda.']}
              className="font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.05] tracking-tight text-cream"
            />

            <RevealFade delay={0.2}>
              <p className="mt-7 max-w-md text-base leading-relaxed text-paper/70 md:text-lg">
                Setiap biji melewati seleksi dan sangrai yang sama yang kami gunakan di
                bar. Kami menggiling dan mengemasnya dalam porsi kecil, agar kesegaran
                sampai di seduhan pertama Anda.
              </p>
            </RevealFade>

            <RevealFade delay={0.3}>
              <ul className="mt-10 space-y-4 border-t border-paper/10 pt-8 text-sm text-paper/80">
                <li className="flex items-baseline gap-3">
                  <span className="font-display text-lg text-warm">01</span>
                  Seleksi dari petani mitra di Indonesia
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="font-display text-lg text-warm">02</span>
                  Disangrai mingguan dalam batch kecil
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="font-display text-lg text-warm">03</span>
                  Dikemas segar, siap diseduh di rumah
                </li>
              </ul>
            </RevealFade>

            <RevealFade delay={0.4}>
              <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <WhatsAppLink solid className="bg-warm text-ink hover:bg-cream">
                  Pesan via WhatsApp
                </WhatsAppLink>
                <Link
                  href="/about"
                  className="border-b border-paper/30 pb-1 text-sm font-semibold text-paper transition-colors hover:border-warm hover:text-warm"
                >
                  Kenali Pinto lebih dekat
                </Link>
              </div>
            </RevealFade>
          </div>
        </div>
      </section>

      {/* Final CTA — light band */}
      <section className="w-full border-b border-ink/10 bg-paper">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-8 px-4 py-16 md:flex-row md:items-center md:px-8 md:py-20">
          <div className="max-w-xl">
            <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
              <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
              Siap menyeduh?
            </p>
            <h2 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
              Bawa pulang Pinto
              <span className="text-coffee">.</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Pilih biji favorit Anda, hubungi kami lewat WhatsApp, dan kami siapkan
              dalam kemasan segar.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <WhatsAppLink solid>Order via WhatsApp</WhatsAppLink>
            <Link
              href="/menu"
              className="flex h-14 items-center gap-2 rounded-full border border-ink/20 px-8 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Kunjungi Kafe Kami
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}