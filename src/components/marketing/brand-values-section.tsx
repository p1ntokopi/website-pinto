import { Coffee, Award, Leaf, Heart } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

const values = [
  { icon: Award, title: "Kualitas Premium", desc: "Kami hanya memakai biji Arabika 100% pilihan." },
  { icon: Coffee, title: "Dirangkai Ahli", desc: "Barista kami meracik setiap cangkir dengan presisi dan penuh perhatian." },
  { icon: Leaf, title: "Sumber yang Bertanggung Jawab", desc: "Biji yang bersumber secara etis untuk mendukung komunitas." },
  { icon: Heart, title: "Dibuat dengan Hati", desc: "Setiap cangkir diseduh dengan semangat dan niat baik." }
];

export function BrandValuesSection() {
  return (
    <section className="w-full bg-paper py-16 md:py-24 border-b border-ink/5">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 max-w-7xl mx-auto">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 0.1} className="flex flex-col items-center text-center px-4">
                <div className="w-14 h-14 rounded-full bg-warm/10 flex items-center justify-center mb-6 text-coffee">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl md:text-2xl text-ink mb-3">{val.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">{val.desc}</p>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
