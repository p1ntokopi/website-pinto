import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ScrollReveal } from './scroll-reveal';

export function TakeHomeSection() {
  return (
    <section className="w-full bg-paper py-24 border-t border-ink/5">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center">
        <ScrollReveal>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink mb-16">Bawa P1NTO ke Rumah.</h2>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-left">
          {[1, 2, 3].map((item) => (
            <Link href="/coffee" key={item} className="group block">
              <div className="relative aspect-square w-full mb-6 overflow-hidden rounded-sm bg-ink/5">
                <Image src={`https://images.unsplash.com/photo-${item === 1 ? '1559525839-b184a4d698c7' : item === 2 ? '1587734195503-904fca47e0e9' : '1620189507195-68309c04c4d0'}?q=80&w=600&auto=format&fit=crop`} alt="Kantong Kopi" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
              </div>
              <h3 className="font-display text-2xl text-ink mb-1 group-hover:text-primary transition-colors">{item === 1 ? 'Ethiopia Guji' : item === 2 ? 'Colombia Supremo' : 'Blend No. 07'}</h3>
              <p className="text-muted-foreground text-sm">Rp{item === 1 ? '145' : item === 2 ? '135' : '120'}.000</p>
            </Link>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <Link href="/coffee" className={buttonVariants({ variant: "outline", className: "rounded-full px-12 h-14 text-base border-ink text-ink hover:bg-ink hover:text-paper transition-colors" })}>
            Beli Semua Kopi
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
