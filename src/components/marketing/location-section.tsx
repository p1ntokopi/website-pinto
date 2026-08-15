import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import Image from 'next/image';

export function LocationSection() {
  return (
    <section id="location" className="w-full bg-paper py-24 md:py-32 border-t border-border/50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 md:gap-24 justify-between items-center">
          <div className="flex-1 w-full md:w-auto">
            <h2 className="font-display text-4xl lg:text-[4rem] text-ink mb-12">P1NTO Coffee</h2>
            <div className="space-y-10">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-4">Alamat</p>
                <p className="text-ink text-xl leading-relaxed">
                  Perumahan Bumi Insani, Jl. Flamboyan No. 8
                  <br />
                  Desa Tonjong, Kec. Tajur Halang
                  <br />
                  Kabupaten Bogor, Jawa Barat
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-4">Jam Buka</p>
                <p className="text-ink text-xl">08:00 — 22:00 (Everyday)</p>
              </div>
              <div>
                <Link href="/locations" className={buttonVariants({ variant: "outline", className: "rounded-full h-12 px-8 border-ink text-ink hover:bg-ink hover:text-paper transition-all" })}>
                  <MapPin className="mr-2 h-4 w-4" /> Petunjuk Arah
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full relative aspect-square md:aspect-[4/5] bg-ink/5 rounded-sm overflow-hidden">
            <Image 
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop" 
              alt="Eksterior P1NTO Coffee" 
              fill 
              className="object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
