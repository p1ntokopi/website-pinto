import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

const menuItems = [
  { name: "Kopi Susu P1NTO", price: "Rp28.000", desc: "Espresso, fresh milk, and our secret house blend palm sugar.", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80" },
  { name: "Classic Espresso", price: "Rp22.000", desc: "Double shot of our seasonal single origin roasted beans.", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80" },
  { name: "Cold Brew 18h", price: "Rp32.000", desc: "Slow steeped for 18 hours. Smooth, bold, and refreshing.", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80" },
  { name: "Vanilla Latte", price: "Rp35.000", desc: "Silky steamed milk poured over rich espresso with vanilla.", image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&q=80" }
];

export function SignatureMenuSection() {
  return (
    <section className="w-full bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <ScrollReveal>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-4">Our Popular Picks</p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink mb-2">Customer Favorites</h2>
            </ScrollReveal>
          </div>
          <Link href="/menu" className="group flex items-center text-sm font-semibold tracking-widest uppercase text-ink hover:text-primary transition-colors">
            <span className="border-b border-ink group-hover:border-primary pb-1 mr-2 transition-colors">View Full Menu</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {menuItems.map((item, idx) => (
            <div key={idx} className="group cursor-pointer flex flex-col">
              <div className="relative aspect-[3/4] w-full mb-6 overflow-hidden bg-warm/20 rounded-sm">
                <div className="absolute inset-0 bg-gradient-to-t from-ink/10 to-transparent z-10" />
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110 z-0" 
                />
              </div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">COFFEE</p>
              <div className="flex justify-between items-baseline mb-3 gap-4">
                <h3 className="font-display text-3xl text-ink leading-none">{item.name}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.desc}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className="text-sm font-semibold text-ink">{item.price}</span>
                <button className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center hover:bg-coffee transition-colors" aria-label={`Add ${item.name} to order`}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
