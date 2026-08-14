import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-ink text-paper py-16 md:py-24 border-t border-white/10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-6">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Image src="/Pintokupi.webp" alt="P1NTO Coffee Logo" width={40} height={40} className="rounded-md object-cover grayscale brightness-200 contrast-125" />
              <span className="font-display text-3xl font-bold text-cream mt-1">P1NTO</span>
            </Link>
            <p className="text-muted-foreground text-xs md:text-sm tracking-widest uppercase font-semibold">
              Coffee • Food • Good Moments
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-3">
            <h3 className="font-semibold text-xs tracking-widest uppercase mb-6 text-cream">Navigation</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-muted-foreground hover:text-white transition-colors text-sm">Home</Link></li>
              <li><Link href="/menu" className="text-muted-foreground hover:text-white transition-colors text-sm">Menu</Link></li>
              <li><Link href="#location" className="text-muted-foreground hover:text-white transition-colors text-sm">Location</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-white transition-colors text-sm">Instagram</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h3 className="font-semibold text-xs tracking-widest uppercase mb-6 text-cream">Visit Us</h3>
            <ul className="space-y-4">
              <li className="text-muted-foreground text-sm">Jl. Pajajaran No. 12<br/>Bogor, Jawa Barat</li>
              <li className="text-muted-foreground text-sm">Open Everyday<br/>08:00 — 22:00</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest">
          <p>© {new Date().getFullYear()} P1NTO Coffee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
