import Image from 'next/image';
import { ScrollReveal } from './scroll-reveal';

const testimonials = [
  { quote: "The best coffee I've ever had! The quality and taste are simply amazing.", name: "Sophia Williams", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
  { quote: "Cozy place, friendly staff, and the coffee is just perfect!", name: "James Anderson", rating: 5, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop" },
  { quote: "I come here every weekend. P1NTO is my happy place!", name: "Olivia Brown", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop" }
];

function StarRating() {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className="w-3.5 h-3.5 text-warm fill-warm" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="w-full bg-paper py-24 md:py-32 border-t border-ink/5">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-16">
          <ScrollReveal>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-4">What Our Customers Say</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink">Loved by Coffee Lovers</h2>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <div key={idx} className="bg-ink/5 rounded-sm p-8 md:p-10 flex flex-col justify-between hover:bg-ink/10 transition-colors duration-500">
              <div>
                <svg className="w-8 h-8 text-ink/20 mb-6" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2h2V8h-2zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2h2V8h-2z" />
                </svg>
                <p className="text-ink text-lg leading-relaxed mb-8 italic">
                  "{item.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image src={item.avatar} alt={item.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm mb-1">{item.name}</p>
                  <StarRating />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
