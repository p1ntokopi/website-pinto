'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useSpring } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/cafe', label: 'Kafe' },
  { href: '/menu', label: 'Menu' },
  { href: '/coffee', label: 'Kopi' },
  { href: '/story', label: 'Kisah' },
];

function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-ink/5 bg-paper/95 backdrop-blur-md'
          : 'border-b border-transparent bg-paper/70 backdrop-blur-sm',
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <Image
            src="/Pintokupi.webp"
            alt="Logo P1NTO Coffee"
            width={34}
            height={34}
            className="rounded-md object-cover grayscale opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="font-display text-2xl font-bold tracking-tight text-ink md:text-[1.7rem]">
            P1NTO
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group/link relative py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink',
                  active ? 'text-ink' : 'text-muted-foreground hover:text-ink',
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-coffee transition-transform duration-300',
                    active ? 'scale-x-100' : 'scale-x-0 group-hover/link:scale-x-100',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/coffee"
              className={buttonVariants({
                variant: 'ghost',
                className: 'rounded-full px-5 text-ink hover:bg-ink/5',
              })}
            >
              Beli Kopi
            </Link>
            <Link
              href="/locations"
              className={buttonVariants({
                className: 'rounded-full bg-ink px-6 text-paper hover:bg-coffee shadow-none',
              })}
            >
              Pesan di Kafe
            </Link>
          </div>
          <MobileNav />
        </div>
      </div>

      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="absolute bottom-0 left-0 right-0 h-px origin-left bg-coffee/70"
      />
    </header>
  );
}