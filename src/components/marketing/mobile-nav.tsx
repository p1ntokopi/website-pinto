'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const LINKS = [
  { href: '/cafe', label: 'Kafe' },
  { href: '/coffee', label: 'Kopi' },
  { href: '/story', label: 'Kisah' },
  { href: '/journal', label: 'Jurnal' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
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
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-ink hover:bg-ink/5 transition-colors"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" aria-hidden>
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-ink/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            aria-label="Close menu"
          />
          <nav className="absolute right-0 top-0 h-full w-[78%] max-w-sm bg-paper border-l border-ink/10 shadow-popover flex flex-col py-6 px-6 overflow-y-auto">
            <div className="mb-8">
              <p className="font-display text-2xl font-bold text-ink">P1NTO</p>
            </div>
            <ul className="space-y-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-4 py-3 text-lg font-medium text-ink hover:bg-ink/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Link
                href="/coffee"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: 'ghost', className: 'rounded-full px-6 text-ink hover:bg-ink/5' })}
              >
                Beli Kopi
              </Link>
              <Link
                href="/locations"
                onClick={() => setOpen(false)}
                className={buttonVariants({ className: 'rounded-full px-6 bg-ink text-paper hover:bg-ink/90 shadow-none' })}
              >
                Pesan di Kafe
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}