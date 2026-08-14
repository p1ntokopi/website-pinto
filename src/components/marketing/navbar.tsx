import Link from 'next/link';
import { Coffee, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl font-bold text-foreground tracking-tight">P1NTO</span>
        </Link>
        
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="#menu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Menu</Link>
          <Link href="#location" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Location</Link>
          <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="default" className="hidden md:inline-flex rounded-full px-6">
            Order Now
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-foreground">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
