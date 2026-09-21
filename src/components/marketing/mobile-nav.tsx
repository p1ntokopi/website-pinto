'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, ArrowUpRight, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { waLink } from '@/config/whatsapp';
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

function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on route navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll and handle escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95"
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Menu utama Pinto"
                data-lenis-prevent
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="fixed inset-0 z-[100] flex h-dvh w-screen flex-col bg-paper text-ink overflow-hidden"
              >
                {/* Header bar */}
                <div
                  className="flex h-16 shrink-0 items-center justify-between border-b border-ink/10 px-4 md:px-8"
                  style={{ paddingTop: 'env(safe-area-inset-top)' }}
                >
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-2.5"
                  >
                    <Image
                      src="/Pintokupi.webp"
                      alt="Logo Pinto Kupi"
                      width={32}
                      height={32}
                      className="rounded-md object-cover grayscale opacity-90 transition-opacity group-hover:opacity-100"
                    />
                    <span className="font-display text-2xl font-bold tracking-tight text-ink">
                      Pinto
                    </span>
                  </Link>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Tutup menu"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Links */}
                <nav
                  aria-label="Menu utama"
                  className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-4"
                >
                  <ol className="space-y-1">
                    {LINKS.map((link, i) => {
                      const active = isActive(link.href, pathname);
                      return (
                        <motion.li
                          key={link.href}
                          initial={reduced ? false : { opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={
                            reduced
                              ? undefined
                              : { delay: 0.04 * i + 0.05, duration: 0.35, ease: EASE }
                          }
                        >
                          <Link
                            href={link.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'group flex items-center justify-between border-b border-ink/10 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink transition-colors',
                              active ? 'text-coffee' : 'text-ink',
                            )}
                          >
                            <span className="flex items-baseline gap-3.5">
                              <span className="font-display text-xs font-semibold text-coffee/70">
                                0{i + 1}
                              </span>
                              <span className="font-display text-2xl font-medium tracking-tight transition-colors duration-200 group-hover:text-coffee sm:text-3xl">
                                {link.label}
                              </span>
                              <span className="text-xs text-muted-foreground/60 transition-colors group-hover:text-coffee/80">
                                {link.en}
                              </span>
                            </span>
                            <ArrowUpRight
                              className={cn(
                                'h-4 w-4 shrink-0 transition-all duration-200',
                                active
                                  ? 'text-coffee opacity-100'
                                  : 'text-ink/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                              )}
                            />
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ol>
                </nav>

                {/* Bottom block */}
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduced ? undefined : { delay: 0.25, duration: 0.35, ease: EASE }
                  }
                  className="shrink-0 border-t border-ink/10 bg-paper px-6 pt-4 pb-6"
                  style={{
                    paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))',
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/coffee"
                      onClick={() => setOpen(false)}
                      className={buttonVariants({
                        size: 'lg',
                        className:
                          'h-12 w-full rounded-full bg-ink px-4 text-sm font-semibold text-paper hover:bg-coffee shadow-none transition-colors justify-center',
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
                          'h-12 w-full rounded-full border-ink/30 px-4 text-sm font-semibold text-ink hover:bg-ink hover:text-paper shadow-none transition-colors justify-center',
                      })}
                    >
                      Pesan di Kafe
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      href={waLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
                      <span>WhatsApp Kami</span>
                    </Link>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      13.00 — 24.00 WIB
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
