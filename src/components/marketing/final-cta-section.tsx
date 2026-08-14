import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function FinalCtaSection() {
  return (
    <section className="w-full bg-ink text-paper py-32 md:py-48 flex items-center justify-center text-center px-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-luminosity pointer-events-none" />
      <div className="max-w-4xl mx-auto flex flex-col items-center z-10">
        <h2 className="font-display text-6xl md:text-[7rem] leading-[1.05] mb-8 text-cream">
          YOUR TABLE <br />
          <i className="text-warm">IS WAITING.</i>
        </h2>
        <p className="text-paper/80 text-xl md:text-2xl mb-12 font-medium tracking-wide">
          Come for the coffee. Stay for the moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <Link href="/menu" className={buttonVariants({ size: "lg", className: "rounded-full h-16 px-12 text-lg bg-warm text-ink hover:bg-cream border-none transition-colors" })}>
            Order Now
          </Link>
          <Link href="#location" className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full h-16 px-12 text-lg border-cream text-cream hover:bg-cream/10 bg-transparent transition-colors" })}>
            Visit P1NTO
          </Link>
        </div>
      </div>
    </section>
  );
}
