import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { formatRupiah, type CoffeeBean } from '@/lib/shop';

const BEAN_IMAGES: Record<string, string> = {
  'bean-ethiopia-guji': 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop',
  'bean-colombia-huila': 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop',
  'bean-aceh-gayo': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop',
  'bean-p1nto-house': 'https://images.unsplash.com/photo-1620189507195-68309c04c4d0?q=80&w=800&auto=format&fit=crop',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop';

function displayName(name: string) {
  return name.replace(/\s*Beans?$/i, '').trim();
}

export function CoffeeCard({ bean, tone = 'light' }: { bean: CoffeeBean; tone?: 'dark' | 'light' }) {
  const image = BEAN_IMAGES[bean.slug] ?? FALLBACK_IMAGE;
  const origin = bean.origin?.country ?? 'P1NTO';
  const price = bean.variants[0]?.price ?? bean.base_price;
  const weight = bean.variants[0]?.weight_grams;
  const notes = bean.flavorNotes.slice(0, 3).join(' · ');

  const isDark = tone === 'dark';

  return (
    <Link
      href={`/coffee/${bean.slug}`}
      className={`group flex flex-col border p-6 transition-colors duration-500 rounded-sm ${
        isDark ? 'border-paper/10 bg-paper/5 hover:bg-paper/10' : 'border-ink/10 bg-white/60 hover:bg-ink/5'
      }`}
    >
      <div className={`relative aspect-square w-full mb-8 overflow-hidden rounded-sm ${isDark ? 'bg-paper/5' : 'bg-ink/5'}`}>
        <Image
          src={image}
          alt={bean.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover group-hover:scale-105 transition-transform duration-1000"
        />
      </div>

      <div className="mb-4">
        <p className={`text-[10px] font-semibold tracking-[0.2em] uppercase mb-2 ${isDark ? 'text-warm' : 'text-coffee'}`}>
          {origin}
        </p>
        <h3 className={`font-display text-3xl mb-1 ${isDark ? 'text-cream' : 'text-ink'}`}>{displayName(bean.name)}</h3>
        {bean.process && (
          <p className={`text-sm ${isDark ? 'text-paper/60' : 'text-muted-foreground'}`}>{bean.process}</p>
        )}
      </div>

      {notes && (
        <p className={`text-sm italic mb-6 ${isDark ? 'text-paper/80' : 'text-ink/70'}`}>{notes}</p>
      )}

      <div className={`mt-auto flex justify-between items-center border-t pt-4 ${isDark ? 'border-paper/10' : 'border-ink/10'}`}>
        <div className="flex flex-col">
          {weight && (
            <span className={`text-xs uppercase tracking-widest ${isDark ? 'text-paper/60' : 'text-muted-foreground'}`}>
              {weight}g
            </span>
          )}
          <span className={`text-base font-semibold ${isDark ? 'text-cream' : 'text-ink'}`}>{formatRupiah(price)}</span>
        </div>
        <span
          className={`rounded-full px-6 py-2 text-sm transition-colors ${
            isDark
              ? 'border border-paper/20 text-cream hover:bg-paper hover:text-ink'
              : 'border border-ink text-ink hover:bg-ink hover:text-paper'
          }`}
        >
          Lihat Kopi
        </span>
      </div>
    </Link>
  );
}

export function CoffeeLink({ bean }: { bean: CoffeeBean }) {
  return (
    <Link
      href={`/coffee/${bean.slug}`}
      className={buttonVariants({ variant: 'outline', className: 'rounded-full px-6 border-paper/20 text-cream hover:bg-paper hover:text-ink transition-colors' })}
    >
      Lihat Kopi
    </Link>
  );
}