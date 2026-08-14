import Link from 'next/link';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/Pintokupi.webp" alt="P1NTO Coffee Logo" width={32} height={32} className="rounded-md object-cover" />
          <span className="font-display text-2xl font-bold text-foreground tracking-tight mt-1">P1NTO</span>
        </Link>
        
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="#menu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Menu</Link>
          <Link href="#location" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Location</Link>
          <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/menu" className={buttonVariants({ variant: "default", className: "hidden md:inline-flex rounded-full px-6" })}>
            Lihat Menu
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden text-foreground">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
