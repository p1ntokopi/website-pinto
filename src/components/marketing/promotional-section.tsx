import Image from 'next/image';

export function PromotionalSection() {
  return (
    <section className="w-full bg-primary text-cream py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-32">
          <div className="w-full md:w-[45%] flex flex-col items-start z-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-cream/70 mb-6">
              Morning at Pinto
            </p>
            <h2 className="font-display text-5xl md:text-6xl lg:text-[5rem] leading-[1.05] mb-8">
              Start slow.<br />
              <span className="italic text-warm">Drink something good.</span>
            </h2>
            <p className="text-cream/90 text-lg md:text-xl leading-relaxed max-w-md">
              Whether you are grabbing a quick espresso on your way to work, or settling in with a pour-over for a quiet morning of reading, we have the perfect cup waiting for you.
            </p>
          </div>
          
          <div className="w-full md:w-[55%] relative">
            <div className="aspect-[4/5] md:aspect-square w-full max-w-xl mx-auto relative overflow-hidden rounded-sm bg-ink/20">
              <Image 
                src="https://images.unsplash.com/photo-1495474472201-49931ebc1200?q=80&w=1200&auto=format&fit=crop"
                alt="Coffee pour over"
                fill
                className="object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-16 -left-16 w-64 h-64 border-[1px] border-cream/20 rounded-full mix-blend-overlay hidden md:block" />
            <div className="absolute -top-12 -right-12 w-32 h-32 border-[1px] border-cream/20 rounded-full mix-blend-overlay hidden md:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
