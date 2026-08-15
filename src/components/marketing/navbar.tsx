import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-paper/90 backdrop-blur-md border-b border-ink/5 transition-all duration-300">
      <div className="container mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/Pintokupi.webp" alt="P1NTO Coffee Logo" width={32} height={32} className="rounded-md object-cover grayscale opacity-90 group-hover:opacity-100 transition-opacity" />
          <span className="font-display text-2xl font-bold tracking-tight text-ink mt-1">P1NTO</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link href="/cafe" className="text-sm font-medium text-muted-foreground hover:text-ink transition-colors">Kafe</Link>
          <Link href="/coffee" className="text-sm font-medium text-muted-foreground hover:text-ink transition-colors">Kopi</Link>
          <Link href="/story" className="text-sm font-medium text-muted-foreground hover:text-ink transition-colors">Kisah</Link>
          <Link href="/journal" className="text-sm font-medium text-muted-foreground hover:text-ink transition-colors">Jurnal</Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <Link href="/coffee" className={buttonVariants({ variant: "ghost", className: "rounded-full px-5 text-ink hover:bg-ink/5" })}>
              Beli Kopi
            </Link>
            <Link href="/locations" className={buttonVariants({ variant: "default", className: "rounded-full px-6 bg-ink text-paper hover:bg-ink/90 shadow-none" })}>
              Pesan di Kafe
            </Link>
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}