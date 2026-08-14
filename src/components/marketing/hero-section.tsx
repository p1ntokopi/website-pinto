import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-paper py-24 md:py-32 lg:py-40">
      <div className="container mx-auto px-4 flex flex-col items-center text-center z-10 relative">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          Now Open for Dine-In & Takeaway
        </div>
        
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight text-ink max-w-4xl mb-6 leading-[1.1]">
          Sip the <span className="text-primary italic">Extraordinary.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-text max-w-2xl mb-10 leading-relaxed">
          P1NTO brings you the finest selection of locally sourced beans, crafted with precision to deliver a coffee experience like no other. Seamlessly order from your table.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button size="lg" className="rounded-full h-14 px-8 text-lg group shadow-md hover:shadow-lg transition-all">
            View Menu
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg border-primary text-primary hover:bg-primary/5">
            Our Location
          </Button>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-64 h-64 md:w-96 md:h-96 bg-cream rounded-full blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 right-0 -translate-y-1/2 translate-x-1/3 w-72 h-72 md:w-96 md:h-96 bg-warm rounded-full blur-[100px] opacity-30 pointer-events-none" />
    </section>
  );
}
