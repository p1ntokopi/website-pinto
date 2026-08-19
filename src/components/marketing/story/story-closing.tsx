import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { RevealHeading, RevealFade } from '@/components/marketing/reveal-heading';
import { WhatsAppLink } from '@/components/marketing/coffee/whatsapp-link';

export function StoryClosing() {
  return (
    <section className="w-full border-t border-ink/10 bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-28">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <RevealFade>
              <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-coffee">
                <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
                Penutup
              </p>
            </RevealFade>

            <RevealHeading
              as="h2"
              lines={[
                'Cerita kami',
                { text: 'masih terus ditulis.', italic: true },
              ]}
              className="font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[1.02] tracking-tight text-ink"
            />

            <RevealFade delay={0.2}>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Kami menyangrai dan menyeduh setiap hari di Bogor. Datanglah untuk
                menikmati secangkir, atau bawa pulang sebungkus biji untuk
                ritual seduh Anda di rumah.
              </p>
            </RevealFade>
          </div>

          <RevealFade delay={0.3} className="lg:col-span-4">
            <div className="flex flex-col items-start gap-4">
              <Link
                href="/coffee"
                className={buttonVariants({
                  size: 'lg',
                  className: 'h-14 rounded-full bg-ink px-8 text-base text-paper hover:bg-coffee shadow-none',
                })}
              >
                Beli Kopi
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/cafe"
                className={buttonVariants({
                  size: 'lg',
                  variant: 'outline',
                  className: 'h-14 rounded-full border-ink/30 px-8 text-base text-ink hover:bg-ink hover:text-paper shadow-none',
                })}
              >
                <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                Kunjungi Kafe
              </Link>
              <WhatsAppLink>Pesan via WhatsApp</WhatsAppLink>
            </div>
          </RevealFade>
        </div>
      </div>
    </section>
  );
}