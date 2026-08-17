'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Beranda', en: 'Home' },
  { href: '/cafe', label: 'Kafe', en: 'Cafe' },
  { href: '/menu', label: 'Menu', en: 'Menu' },
  { href: '/coffee', label: 'Kopi', en: 'Coffee Beans' },
  { href: '/story', label: 'Kisah', en: 'Our Story' },
  { href: '/locations', label: 'Lokasi', en: 'Locations' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function MobileNav() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu utama P1NTO"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-[60] flex flex-col bg-paper md:hidden"
          >
            {/* Header bar */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink/10 px-4">
              <span className="font-display text-2xl font-bold tracking-tight text-ink">
                P1NTO
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Links */}
            <nav
              aria-label="Menu utama"
              className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-6"
            >
              <ol className="space-y-1">
                {LINKS.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.li
                      key={link.href}
                      initial={reduced ? false : { opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reduced
                          ? undefined
                          : { delay: 0.06 * i + 0.08, duration: 0.5, ease: EASE }
                      }
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'group flex items-baseline justify-between border-b border-ink/10 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                          active ? 'text-coffee' : 'text-ink',
                        )}
                      >
                        <span className="flex items-baseline gap-4">
                          <span className="font-display text-sm text-coffee/60">
                            0{i + 1}
                          </span>
                          <span className="font-display text-4xl leading-none tracking-tight transition-colors duration-300 group-hover:text-coffee">
                            {link.label}
                          </span>
                        </span>
                        <ArrowUpRight className="h-5 w-5 shrink-0 text-ink/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </Link>
                    </motion.li>
                  );
                })}
              </ol>
            </nav>

            {/* Bottom block */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced ? undefined : { delay: 0.45, duration: 0.5, ease: EASE }
              }
              className="shrink-0 border-t border-ink/10 px-6 pt-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
            >
              <div className="flex flex-col gap-3">
                <Link
                  href="/coffee"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({
                    size: 'lg',
                    className:
                      'h-14 w-full rounded-full bg-ink px-8 text-base text-paper hover:bg-ink/90 shadow-none',
                  })}
                >
                  Beli Kopi
                </Link>
                <Link
                  href="/locations"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({
                    size: 'lg',
                    variant: 'outline',
                    className:
                      'h-14 w-full rounded-full border-ink/40 px-8 text-base text-ink hover:bg-ink hover:text-paper shadow-none',
                  })}
                >
                  Pesan di Kafe
                </Link>
              </div>
              <p className="mt-6 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Buka Setiap Hari · 08.00 — 22.00
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
