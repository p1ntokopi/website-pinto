import { getMenu, formatRupiah } from '@/lib/shop';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Menu | P1NTO Coffee',
  description:
    'Jelajahi menu kopi, minuman, dan pastry kami — diracik dengan cermat dan disajikan satu cangkir demi satu cangkir.',
};

export default async function MenuPage() {
  const sections = await getMenu();

  return (
    <>
      <section className="w-full bg-paper py-20 md:py-28 border-b border-ink/5">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-coffee mb-4">
            Di Bar
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-ink leading-[1.05] mb-6">
            Menu Kami
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Biji pilihan, diracik dengan penuh perhatian — dari espresso hingga pastry, setiap item dibuat segar saat Anda memesan.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper py-16 md:py-24 min-h-[40vh]">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          {sections.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="font-display text-3xl text-ink mb-4">Menu Segera Hadir</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Kami masih menyempurnakan menu kami. Kunjungi kafe untuk pilihan hari ini.
              </p>
              <Link
                href="/locations"
                className={buttonVariants({ variant: 'outline', className: 'rounded-full px-8 border-ink text-ink hover:bg-ink hover:text-paper' })}
              >
                Temukan Lokasi Kami
              </Link>
            </div>
          ) : (
            <div className="space-y-20">
              {sections.map(({ category, items }) => (
                <div key={category.id}>
                  <div className="mb-10 flex items-end justify-between gap-6">
                    <div>
                      <h2 className="font-display text-4xl md:text-5xl text-ink">{category.name}</h2>
                      {category.description && (
                        <p className="text-muted-foreground mt-2 max-w-md">{category.description}</p>
                      )}
                    </div>
                    <div className="hidden md:block w-16 h-px bg-ink/20 mb-3" aria-hidden />
                  </div>

                  {items.length === 0 ? (
                    <p className="text-muted-foreground">Item segera hadir.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="py-5 flex items-baseline justify-between gap-6 border-b border-ink/10"
                        >
                          <div>
                            <h3 className="font-medium text-lg text-ink">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <span className="font-semibold text-ink whitespace-nowrap">
                            {formatRupiah(item.base_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}