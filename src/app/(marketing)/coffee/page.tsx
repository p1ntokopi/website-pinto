import { CoffeeCard } from '@/components/marketing/coffee-card';
import { getCoffeeBeans } from '@/lib/shop';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Beli Kopi | P1NTO Coffee',
  description:
    'Biji kopi pilihan, disangrai dengan penuh perhatian dari roastery kami. Single origin dan house blend, siap Anda seduh di rumah.',
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function CoffeePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter?.trim() ?? null;
  const beans = await getCoffeeBeans(filter);

  return (
    <>
      <section className="w-full bg-paper py-20 md:py-28 border-b border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee mb-4">
            Dari Roastery Kami
          </p>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-ink leading-[1.05]">
              Beli Kopi
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Perhatian yang sama untuk setiap cangkir di bar, dikemas dalam kopi yang bisa Anda seduh di rumah.
            </p>
          </div>

          {filter && (
            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-ink/15 bg-ink/5 px-5 py-2.5">
              <span className="text-sm text-ink">
                Menampilkan hasil untuk <span className="font-semibold">{titleCase(filter)}</span>
              </span>
              <Link
                href="/coffee"
                className="text-sm font-semibold text-coffee underline-offset-2 hover:underline"
              >
                Hapus
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="w-full bg-paper py-16 md:py-24 min-h-[40vh]">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          {beans.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="font-display text-3xl text-ink mb-4">Tidak Ada Hasil yang Cocok</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Kami belum menemukan kopi yang cocok dengan preferensi tersebut — namun, jelajahi seluruh pilihan roastery kami.
              </p>
              <Link
                href="/coffee"
                className={buttonVariants({ variant: 'outline', className: 'rounded-full px-8 border-ink text-ink hover:bg-ink hover:text-paper' })}
              >
                Lihat Semua Kopi
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {beans.map((bean) => (
                <CoffeeCard key={bean.id} bean={bean} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}