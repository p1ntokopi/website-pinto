import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ScrollReveal } from './scroll-reveal';

export function BrandStorySection() {
  return (
    <section className="w-full bg-paper py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          <div className="w-full lg:w-[45%] flex flex-col justify-center order-2 lg:order-1 z-10">
            <ScrollReveal>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-6">
                Kisah Kami
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-5xl md:text-6xl lg:text-[4.5rem] text-ink leading-[1.05] mb-8">
                Lebih dari<br />
                <i className="text-primary font-medium">Sekadar Kopi</i>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10 max-w-md">
                P1NTO lahir dari hasrat sederhana akan kopi yang hebat dan koneksi yang bermakna. Dari biji yang dipilih dengan cermat hingga cangkir favorit Anda, kami hadir untuk membuat setiap momen menjadi istimewa.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div>
                <Link href="/story" className={buttonVariants({ variant: "outline", className: "rounded-full h-14 px-8 text-lg border-ink text-ink hover:bg-ink hover:text-paper transition-colors duration-300" })}>
                  Baca Kisah Kami
                </Link>
              </div>
            </ScrollReveal>
          </div>
          
          <div className="w-full lg:w-[55%] relative h-[60vh] lg:h-[80vh] order-1 lg:order-2 bg-warm/20 rounded-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-warm/40 to-ink/20 z-0" />
            <Image 
              src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1600&auto=format&fit=crop"
              alt="Barista menuang kopi"
              fill
              className="object-cover z-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
