import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Coffee, Croissant, Wifi, Users } from 'lucide-react';

export const metadata = {
  title: 'Kafe Kami | P1NTO Coffee',
  description:
    'Masuki P1NTO — ruang untuk kopi hebat, pastry segar, dan momen indah. Buka setiap hari 13.00 — 24.00.',
};

const amenities = [
  {
    icon: Coffee,
    title: 'Kopi Spesialti',
    desc: 'Single origin dan house blend, disetel oleh barista kami setiap hari.',
  },
  {
    icon: Croissant,
    title: 'Pastry Segar',
    desc: 'Dibuat in-house setiap pagi — croissant, pain au chocolat, dan banana bread.',
  },
  {
    icon: Wifi,
    title: 'Ramah Kerja',
    desc: 'Wi-Fi cepat, stopkontak, dan meja panjang untuk sesi fokus.',
  },
  {
    icon: Users,
    title: 'Tempat Berkumpul',
    desc: 'Dari pagi yang tenang hingga malam yang ramai — rumah bagi percakapan dan komunitas.',
  },
];

const gallery = [
  { src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop', alt: 'Interior Kafe P1NTO' },
  { src: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop', alt: 'Barista menuang kopi' },
  { src: 'https://images.unsplash.com/photo-1525640788966-69bdb028aa73?q=80&w=800&auto=format&fit=crop', alt: 'Detail meja kopi' },
  { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop', alt: 'Eksterior kafe' },
];

export default function CafePage() {
  return (
    <>
      <section className="w-full bg-ink text-paper py-28 md:py-40 border-b border-white/5">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-warm mb-6">Kafe Kami</p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-cream leading-[1.05] mb-8">
            Datang untuk kopi.
            <br />
            <i className="text-warm font-medium">Bertahan untuk momen.</i>
          </h1>
          <p className="text-paper/70 text-lg md:text-xl max-w-2xl mx-auto">
            Lebih dari sekadar kedai kopi — tempat yang dirancang untuk kopi hebat dan orang-orang yang menikmatinya.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden bg-warm/20">
              <Image
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop"
                alt="Interior Kafe P1NTO"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee mb-6">Ruang Kami</p>
              <h2 className="font-display text-4xl md:text-5xl text-ink leading-[1.1] mb-8">
                Dirancang untuk pagi yang santai dan sore yang panjang
              </h2>
              <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <p>
                  Cahaya hangat, material yang jujur, dan dengung gilingan yang pas. Ruang kami dibuat untuk dihuni — apakah Anda datang untuk espresso pertama di pagi hari atau pour-over ketiga saat matahari terbenam.
                </p>
                <p>
                  Duduklah, pesan sesuatu dari bar, dan nikmati waktu Anda. Wi-Fi-nya cepat, pastry-nya segar, dan kopinya selalu pas.
                </p>
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/menu"
                  className={buttonVariants({ className: 'rounded-full h-12 px-8 bg-ink text-paper hover:bg-ink/90 shadow-none' })}
                >
                  Lihat Menu
                </Link>
                <Link
                  href="/locations"
                  className={buttonVariants({ variant: 'outline', className: 'rounded-full h-12 px-8 border-ink text-ink hover:bg-ink hover:text-paper' })}
                >
                  Temukan Kami
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-paper py-20 md:py-24 border-t border-ink/5">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 max-w-6xl mx-auto">
            {amenities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col items-center text-center px-2">
                  <div className="w-14 h-14 rounded-full bg-warm/10 flex items-center justify-center mb-5 text-coffee">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl md:text-2xl text-ink mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full bg-ink text-paper py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {gallery.map((img) => (
              <div
                key={img.src}
                className={`relative overflow-hidden rounded-sm bg-paper/5 ${
                  img.alt === 'Interior Kafe P1NTO' ? 'col-span-2 row-span-2 aspect-[4/5]' : 'aspect-square'
                }`}
              >
                <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-paper py-20 md:py-28 border-t border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl text-center">
          <h2 className="font-display text-4xl md:text-5xl text-ink mb-6">Buka Setiap Hari</h2>
          <p className="text-muted-foreground text-xl mb-10">
            13.00 — 24.00
            <br />
            Perumahan Bumi Insani, Jl. Flamboyan No. 8, Tajur Halang, Kabupaten Bogor
          </p>
          <Link
            href="/locations"
            className={buttonVariants({ className: 'rounded-full h-14 px-10 bg-ink text-paper hover:bg-ink/90 shadow-none' })}
          >
            Petunjuk Arah
          </Link>
        </div>
      </section>
    </>
  );
}