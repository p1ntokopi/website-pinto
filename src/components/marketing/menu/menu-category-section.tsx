import { formatRupiah, type MenuItem } from '@/lib/shop';
import { RevealHeading, RevealFade } from '../reveal-heading';
import { cn } from '@/lib/utils';

export type MenuCategoryData = {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
};

function DottedRow({ item }: { item: MenuItem }) {
  return (
    <div className="group py-4">
      <div className="flex items-baseline gap-3">
        <h3 className="font-display text-xl leading-tight text-ink transition-colors duration-300 group-hover:text-coffee md:text-2xl">
          {item.name}
        </h3>
        <span
          aria-hidden="true"
          className="mx-1 flex-1 border-b border-dotted border-ink/25"
        />
        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
          {formatRupiah(item.base_price)}
        </span>
      </div>
      {item.description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      )}
    </div>
  );
}

const TONES = ['bg-paper', 'bg-white', 'bg-cream/30'];

export function MenuCategorySection({
  category,
  index,
}: {
  category: MenuCategoryData;
  index: number;
}) {
  return (
    <section
      id={`menu-${category.id}`}
      aria-labelledby={`heading-${category.id}`}
      className={cn('w-full scroll-mt-44', TONES[index % TONES.length])}
    >
      <div className="container mx-auto px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 border-b border-ink/10 pb-8 md:mb-12">
            <RevealFade>
              <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
                <span className="tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <span className="h-px w-8 bg-coffee/40" aria-hidden="true" />
                Menu
              </p>
            </RevealFade>
            <div id={`heading-${category.id}`}>
              <RevealHeading
                as="h2"
                lines={[category.name]}
                className="font-display text-4xl leading-none tracking-tight text-ink md:text-5xl lg:text-6xl"
              />
            </div>
            {category.description && (
              <RevealFade delay={0.15}>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </RevealFade>
            )}
          </div>

          {category.items.length === 0 ? (
            <p className="text-muted-foreground">Item segera hadir.</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
              {category.items.map((item, itemIndex) => (
                <RevealFade key={item.id} delay={Math.min(itemIndex, 5) * 0.05}>
                  <DottedRow item={item} />
                </RevealFade>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
