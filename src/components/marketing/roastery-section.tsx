import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ScrollReveal } from './scroll-reveal';
import { CoffeeCard } from './coffee-card';
import { getCoffeeBeans } from '@/lib/shop';

export async function RoasterySection() {
  const beans = await getCoffeeBeans();

  return (
    <section className="w-full bg-ink text-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <ScrollReveal>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-cream/60 mb-4">Dari Roastery Kami</p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">Bawa P1NTO ke Rumah.</h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-paper/70 text-lg md:text-xl max-w-xl">Perhatian yang sama untuk setiap cangkir di bar, dikemas dalam kopi yang bisa Anda seduh di rumah.</p>
            </ScrollReveal>
          </div>
          <Link href="/coffee" className="group flex items-center text-sm font-semibold tracking-widest uppercase text-cream hover:text-warm transition-colors">
            <span className="border-b border-cream/30 group-hover:border-warm pb-1 transition-colors">Beli Biji Kopi</span>
          </Link>
        </div>

        {beans.length === 0 ? (
          <p className="text-paper/60 text-lg">Rak roastery kami sedang diisi ulang. Nantikan kembali.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beans.map((bean) => (
              <CoffeeCard key={bean.id} bean={bean} tone="dark" />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/coffee"
            className={buttonVariants({ variant: 'outline', className: 'rounded-full px-12 h-14 text-base border-paper/20 text-cream hover:bg-paper hover:text-ink transition-colors' })}
          >
            Lihat Semua Kopi
          </Link>
        </div>
      </div>
    </section>
  );
}