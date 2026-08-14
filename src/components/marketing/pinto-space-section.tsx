import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { ScrollReveal } from './scroll-reveal';

export function PintoSpaceSection() {
  return (
    <section className="w-full bg-ink text-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <div>
            <ScrollReveal>
              <h2 className="font-display text-5xl md:text-6xl lg:text-[5rem] text-cream leading-[1.05] mb-6">Come for the coffee.<br/>Stay for the moment.</h2>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2} className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link href="#location" className={buttonVariants({ variant: "default", className: "rounded-full px-8 h-14 text-base bg-warm text-ink hover:bg-cream shadow-none transition-colors" })}>
              Visit P1NTO
            </Link>
            <Link href="/locations" className={buttonVariants({ variant: "outline", className: "rounded-full px-8 h-14 text-base border-paper/20 text-cream hover:bg-paper/10 transition-colors" })}>
              Find Location
            </Link>
          </ScrollReveal>
        </div>
        
        {/* Asymmetric Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <div className="md:col-span-8 relative aspect-[4/3] md:aspect-auto md:h-[600px] rounded-sm overflow-hidden bg-paper/5">
            <Image src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1600&auto=format&fit=crop" alt="P1NTO Cafe Interior" fill className="object-cover" />
          </div>
          <div className="md:col-span-4 flex flex-col gap-4 md:gap-6">
            <div className="relative aspect-square md:h-[calc(300px-12px)] rounded-sm overflow-hidden bg-paper/5">
               <Image src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop" alt="Barista pouring coffee" fill className="object-cover" />
            </div>
            <div className="relative aspect-square md:h-[calc(300px-12px)] rounded-sm overflow-hidden bg-paper/5">
               <Image src="https://images.unsplash.com/photo-1525640788966-69bdb028aa73?q=80&w=800&auto=format&fit=crop" alt="Coffee table details" fill className="object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
