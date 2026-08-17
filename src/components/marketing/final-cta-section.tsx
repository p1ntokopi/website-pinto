import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { images } from '@/config/images';
import { RevealHeading, RevealFade } from './reveal-heading';

export function FinalCtaSection() {
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-ink px-4 py-28 text-center text-paper md:py-44">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.14]"
        style={{ backgroundImage: `url('${images.finalCta}')` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-radial-vignette opacity-60"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
        <p className="mb-8 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-warm md:text-xs">
          <span className="h-px w-10 bg-warm/50" />
          P1NTO Coffee
          <span className="h-px w-10 bg-warm/50" />
        </p>

        <RevealHeading
          as="h2"
          lines={[
            'CANGKIR ANDA',
            'BERIKUTNYA DIMULAI',
            { text: 'DI SINI.', italic: true },
          ]}
          className="font-display text-[clamp(2.6rem,12vw,4.5rem)] leading-[0.98] tracking-tight text-cream md:text-7xl lg:text-[6rem]"
        />

        <RevealFade delay={0.2}>
          <p className="mt-8 text-lg leading-relaxed text-paper/70 md:text-xl">
            Kunjungi kafe untuk satu momen, atau bawa pulang bijinya untuk
            menyeduh sendiri di rumah.
          </p>
        </RevealFade>

        <RevealFade delay={0.3}>
          <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <Link
              href="/locations"
              className={buttonVariants({
                size: 'lg',
                className:
                  'h-16 w-full rounded-full bg-warm px-12 text-lg text-ink hover:bg-cream sm:w-auto',
              })}
            >
              Pesan di Kafe
            </Link>
            <Link
              href="/coffee"
              className={buttonVariants({
                size: 'lg',
                variant: 'outline',
                className:
                  'h-16 w-full rounded-full border-cream/40 bg-transparent px-12 text-lg text-cream hover:bg-cream/10 sm:w-auto',
              })}
            >
              Beli Kopi
            </Link>
          </div>
        </RevealFade>
      </div>
    </section>
  );
}