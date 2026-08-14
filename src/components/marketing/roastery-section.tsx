import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ScrollReveal } from './scroll-reveal';

export function RoasterySection() {
  return (
    <section className="w-full bg-ink text-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <ScrollReveal>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-cream/60 mb-4">From Our Roastery</p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">Bring P1NTO Home.</h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-paper/70 text-lg md:text-xl max-w-xl">The same care we give every cup at the bar, packed into coffee you can brew at home.</p>
            </ScrollReveal>
          </div>
          <Link href="/coffee" className="group flex items-center text-sm font-semibold tracking-widest uppercase text-cream hover:text-warm transition-colors">
            <span className="border-b border-cream/30 group-hover:border-warm pb-1 transition-colors">Shop Coffee Beans</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Featured Coffee Bean Card 1 */}
          <div className="group cursor-pointer flex flex-col border border-paper/10 bg-paper/5 p-6 hover:bg-paper/10 transition-colors duration-500 rounded-sm">
            <div className="relative aspect-square w-full mb-8 overflow-hidden rounded-sm bg-paper/5">
              <Image src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop" alt="Ethiopia Guji" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-warm mb-2">ETHIOPIA</p>
              <h3 className="font-display text-3xl text-cream mb-1">Guji</h3>
              <p className="text-paper/60 text-sm">Washed</p>
            </div>
            <p className="text-paper/80 text-sm italic mb-6">Floral · Citrus · Tea-like</p>
            <div className="mt-auto flex justify-between items-center border-t border-paper/10 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-paper/60 uppercase tracking-widest">250g</span>
                <span className="text-base font-semibold text-cream">Rp145.000</span>
              </div>
              <Link href="/coffee/ethiopia-guji" className={buttonVariants({ variant: "outline", className: "rounded-full px-6 border-paper/20 text-cream hover:bg-paper hover:text-ink transition-colors" })}>
                View Coffee
              </Link>
            </div>
          </div>
          
          {/* Featured Coffee Bean Card 2 */}
          <div className="group cursor-pointer flex flex-col border border-paper/10 bg-paper/5 p-6 hover:bg-paper/10 transition-colors duration-500 rounded-sm">
            <div className="relative aspect-square w-full mb-8 overflow-hidden rounded-sm bg-paper/5">
              <Image src="https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop" alt="Colombia Supremo" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-warm mb-2">COLOMBIA</p>
              <h3 className="font-display text-3xl text-cream mb-1">Supremo</h3>
              <p className="text-paper/60 text-sm">Natural</p>
            </div>
            <p className="text-paper/80 text-sm italic mb-6">Chocolate · Caramel · Red Apple</p>
            <div className="mt-auto flex justify-between items-center border-t border-paper/10 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-paper/60 uppercase tracking-widest">250g</span>
                <span className="text-base font-semibold text-cream">Rp135.000</span>
              </div>
              <Link href="/coffee/colombia-supremo" className={buttonVariants({ variant: "outline", className: "rounded-full px-6 border-paper/20 text-cream hover:bg-paper hover:text-ink transition-colors" })}>
                View Coffee
              </Link>
            </div>
          </div>

          {/* Featured Coffee Bean Card 3 */}
          <div className="group cursor-pointer flex flex-col border border-paper/10 bg-paper/5 p-6 hover:bg-paper/10 transition-colors duration-500 rounded-sm md:hidden lg:flex">
            <div className="relative aspect-square w-full mb-8 overflow-hidden rounded-sm bg-paper/5">
              <Image src="https://images.unsplash.com/photo-1620189507195-68309c04c4d0?q=80&w=800&auto=format&fit=crop" alt="House Blend No. 07" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-warm mb-2">BLEND</p>
              <h3 className="font-display text-3xl text-cream mb-1">No. 07</h3>
              <p className="text-paper/60 text-sm">Washed & Natural</p>
            </div>
            <p className="text-paper/80 text-sm italic mb-6">Dark Chocolate · Roasted Nuts</p>
            <div className="mt-auto flex justify-between items-center border-t border-paper/10 pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-paper/60 uppercase tracking-widest">250g</span>
                <span className="text-base font-semibold text-cream">Rp120.000</span>
              </div>
              <Link href="/coffee/blend-07" className={buttonVariants({ variant: "outline", className: "rounded-full px-6 border-paper/20 text-cream hover:bg-paper hover:text-ink transition-colors" })}>
                View Coffee
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
