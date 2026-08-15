import { buttonVariants } from '@/components/ui/button';
import { Clock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Lokasi | P1NTO Coffee',
  description:
    'Temukan PINTO Kupi di Jl. Flamboyan No. 8, Perumahan Bumi Insani, Tajur Halang, Kabupaten Bogor. Buka setiap hari.',
};

const MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.2932843233516!2d106.75314430941077!3d-6.48449349348037!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69c365b46d2d93%3A0x46dac8252d2c88ed!2sPINTO%20Kupi!5e0!3m2!1sid!2sid!4v1786768303490!5m2!1sid!2sid';
const DIRECTIONS_URL = 'https://maps.app.goo.gl/p7UhDrsRF1SbVEVh9';

export default function LocationsPage() {
  return (
    <>
      <section className="w-full bg-paper py-24 md:py-32 border-b border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee mb-6">Kunjungi Kami</p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-ink leading-[1.05] mb-6">
            Temukan P1NTO Terdekat
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Datang untuk kopi, bertahan untuk momen. Kami menantikan kehadiran Anda.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5 flex flex-col">
              <div className="space-y-10 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="h-5 w-5 text-coffee" />
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Alamat</p>
                  </div>
                  <p className="text-ink text-xl leading-relaxed">
                    Perumahan Bumi Insani
                    <br />
                    Jl. Flamboyan No. 8
                    <br />
                    Desa Tonjong, Kec. Tajur Halang
                    <br />
                    Kabupaten Bogor, Jawa Barat
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-coffee" />
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Jam Buka</p>
                  </div>
                  <p className="text-ink text-xl">08:00 — 22:00 (Everyday)</p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="h-5 w-5 text-coffee" />
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Kontak</p>
                  </div>
                  <p className="text-ink text-xl">+62 812 3456 7890</p>
                </div>
              </div>

              <div className="mt-auto flex flex-col sm:flex-row gap-4">
                <Link
                  href={DIRECTIONS_URL}
                  target="_blank"
                  className={buttonVariants({ className: 'rounded-full h-12 px-8 bg-ink text-paper hover:bg-ink/90 shadow-none' })}
                >
                  <MapPin className="mr-2 h-4 w-4" /> Petunjuk Arah
                </Link>
                <Link
                  href="/menu"
                  className={buttonVariants({ variant: 'outline', className: 'rounded-full h-12 px-8 border-ink text-ink hover:bg-ink hover:text-paper' })}
                >
                  Lihat Menu
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative w-full h-[420px] md:h-[520px] rounded-sm overflow-hidden border border-ink/10">
                <iframe
                  src={MAP_EMBED}
                  title="Lokasi P1NTO Coffee di Google Maps"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}