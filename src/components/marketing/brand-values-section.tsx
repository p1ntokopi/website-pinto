import { Coffee, Award, Leaf, Heart } from 'lucide-react';

const values = [
  { icon: Award, title: "Premium Quality", desc: "We use only the finest 100% Arabica beans." },
  { icon: Coffee, title: "Expertly Crafted", desc: "Our baristas craft every cup with precision and care." },
  { icon: Leaf, title: "Thoughtful Sourcing", desc: "Ethically sourced beans that support communities." },
  { icon: Heart, title: "Made With Care", desc: "Every cup is brewed with passion and intention." }
];

export function BrandValuesSection() {
  return (
    <section className="w-full bg-paper py-16 md:py-24 border-b border-ink/5">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 max-w-7xl mx-auto">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center px-4">
                <div className="w-14 h-14 rounded-full bg-warm/10 flex items-center justify-center mb-6 text-coffee">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl md:text-2xl text-ink mb-3">{val.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
