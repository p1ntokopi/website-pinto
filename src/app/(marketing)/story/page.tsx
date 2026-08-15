import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Award, Coffee, Leaf, Heart } from 'lucide-react';

export const metadata = {
  title: 'Kisah Kami | P1NTO Coffee',
  description:
    'P1NTO lahir dari hasrat sederhana akan kopi hebat dan koneksi yang bermakna. Temukan bagaimana kami mencari, menyangrai, dan menyajikan.',
};

const values = [
  { icon: Award, title: 'Kualitas Premium', desc: 'Kami hanya memakai biji Arabika 100% pilihan.' },
  { icon: Coffee, title: 'Dirangkai Ahli', desc: 'Barista kami meracik setiap cangkir dengan presisi dan penuh perhatian.' },
  { icon: Leaf, title: 'Sumber yang Bertanggung Jawab', desc: 'Biji yang bersumber secara etis untuk mendukung komunitas.' },
  { icon: Heart, title: 'Dibuat dengan Hati', desc: 'Setiap cangkir diseduh dengan semangat dan niat baik.' },
];

const timeline = [
  {
    year: '2024',
    title: 'Awal Mula',
    desc: 'P1NTO membuka bar pertamanya di Bogor — satu mesin espresso, empat kursi, dan keyakinan bahwa kopi bisa mendekatkan orang.',
  },
  {
    year: '2025',
    title: 'Masuk ke Roastery',
    desc: 'Kami membawa penyangraian ke dalam rumah. Single origin dari Ethiopia, Kolombia, dan Aceh menemukan jalan ke bar kami — dan ke rumah Anda.',
  },
  {
    year: 'Sekarang',
    title: 'Ritual Sehari-hari',
    desc: 'Menu yang terus berkembang, rak roastery yang berputar, dan janji yang sama: satu cangkir demi satu cangkir, dibuat dengan perhatian.',
  },
];

export default function StoryPage() {
  return (
    <>
      <section className="w-full bg-paper py-28 md:py-40 border-b border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee mb-6">Kisah Kami</p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-ink leading-[1.05] mb-8">
            Lebih dari
            <br />
            <i className="text-primary font-medium">Sekadar Kopi</i>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl">
            P1NTO lahir dari hasrat sederhana akan kopi yang hebat dan koneksi yang bermakna. Dari biji
            yang dipilih dengan cermat hingga cangkir favorit Anda, kami hadir untuk membuat setiap
            momen menjadi istimewa.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            <div className="w-full lg:w-[55%] relative h-[60vh] lg:h-[80vh] rounded-sm overflow-hidden bg-warm/20">
              <Image
                src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1600&auto=format&fit=crop"
                alt="Barista menuang kopi"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="w-full lg:w-[45%]">
              <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <p>
                  Kami memulai dengan satu ide sederhana: kopi terbaik layak diperlakukan dengan
                  hormat — dari petani yang menanamnya hingga orang yang menyajikannya.
                </p>
                <p>
                  Itu berarti membeli biji yang ditanam dengan penuh perhatian, menyangrainya dalam
                  batch kecil, dan mengekstrak setiap shot seolah itu yang pertama di hari itu.
                </p>
                <p>
                  Hari ini P1NTO adalah sebuah roastery, sebuah kafe, dan sudut kecil dunia tempat
                  kopi yang baik bertemu dengan orang-orang yang baik.
                </p>
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/coffee"
                  className={buttonVariants({ className: 'rounded-full h-12 px-8 bg-ink text-paper hover:bg-ink/90 shadow-none' })}
                >
                  Beli Kopi Kami
                </Link>
                <Link
                  href="/cafe"
                  className={buttonVariants({ variant: 'outline', className: 'rounded-full h-12 px-8 border-ink text-ink hover:bg-ink hover:text-paper' })}
                >
                  Kunjungi Kafe
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-ink text-paper py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <h2 className="font-display text-4xl md:text-5xl text-cream mb-16">Perjalanan Kami Sejauh Ini</h2>
          <div className="space-y-16">
            {timeline.map((entry) => (
              <div key={entry.year} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3">
                  <span className="font-display text-3xl text-warm">{entry.year}</span>
                </div>
                <div className="md:col-span-9">
                  <h3 className="text-lg font-semibold text-cream mb-3">{entry.title}</h3>
                  <p className="text-paper/70 leading-relaxed max-w-2xl">{entry.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-paper py-20 md:py-28 border-t border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="flex flex-col items-center text-center px-2">
                  <div className="w-14 h-14 rounded-full bg-warm/10 flex items-center justify-center mb-5 text-coffee">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl md:text-2xl text-ink mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}