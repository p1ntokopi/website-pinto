import Link from 'next/link';
import Image from 'next/image';

const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/cafe', label: 'Kafe' },
  { href: '/coffee', label: 'Kopi' },
  { href: '/menu', label: 'Menu' },
  { href: '/story', label: 'Kisah' },
  { href: '/locations', label: 'Lokasi' },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink py-16 text-paper md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link href="/" className="mb-6 flex items-center gap-3">
              <Image
                src="/Pintokupi.webp"
                alt="Logo Pinto Coffee"
                width={40}
                height={40}
                className="rounded-md object-cover grayscale brightness-200 contrast-125"
              />
              <span className="font-display mt-1 text-3xl font-bold text-cream">Pinto</span>
            </Link>
            <p className="mb-6 max-w-xs leading-relaxed text-paper/60">
              Kafe dan roastery di Bogor. Kopi Nusantara, disangrai in-house
              dalam batch kecil, disajikan untuk setiap momen.
            </p>
            <p className="text-xs uppercase tracking-[0.25em] text-paper/50">
              Kopi · Makanan · Momen Indah
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-cream">
              Jelajahi
            </h3>
            <ul className="space-y-1">
              {NAV.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-1.5 text-sm text-paper/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-cream">
              Kunjungi Kami
            </h3>
            <ul className="space-y-4 text-sm text-paper/60">
              <li>
                Perumahan Bumi Insani, Jl. Flamboyan No. 8
                <br />
                Tajur Halang, Kabupaten Bogor
              </li>
              <li>
                Buka Setiap Hari
                <br />
                13.00 — 24.00
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/p7UhDrsRF1SbVEVh9"
                  target="_blank"
                  rel="noreferrer"
                  className="text-paper/60 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Petunjuk Arah
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[10px] uppercase tracking-widest text-paper/50 md:flex-row"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom))' }}
        >
          <p>© {new Date().getFullYear()} Pinto Coffee. Hak cipta dilindungi.</p>
          <p>Roastery &amp; Kafe — Bogor</p>
        </div>
      </div>
    </footer>
  );
}