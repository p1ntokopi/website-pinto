import { getMenu, getCoffeeBeans, type CoffeeBean } from '@/lib/shop';
import { MenuHero } from '@/components/marketing/menu/menu-hero';
import { MenuCategoryNav, type MenuNavItem } from '@/components/marketing/menu/menu-category-nav';
import {
  MenuCategorySection,
  type MenuCategoryData,
} from '@/components/marketing/menu/menu-category-section';
import { MenuSignatures, type SignatureDrink } from '@/components/marketing/menu/menu-signatures';
import { MenuRoastery } from '@/components/marketing/menu/menu-roastery';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Menu | Pinto Coffee',
  description:
    'Jelajahi menu kopi, minuman, dan pastry kami — diracik dengan cermat dan disajikan satu cangkir demi satu cangkir.',
};

const CAFE_TYPES = new Set(['CAFE_DRINK', 'DESSERT', 'FOOD']);

const SIGNATURE_SLUGS = ['sanger-latte', 'aren-latte', 'v-60', 'matcha-latte'];
const SIGNATURE_LABELS: Record<string, string> = {
  'sanger-latte': 'Signature',
  'aren-latte': 'Klasik',
  'v-60': 'Manual Brew',
  'matcha-latte': 'Non-Kopi',
};

export default async function MenuPage() {
  const [sections, beans] = await Promise.all([getMenu(), getCoffeeBeans()]);

  const cafeSections: MenuCategoryData[] = sections
    .map(({ category, items }) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      items: items.filter((i) => CAFE_TYPES.has(i.product_type)),
    }))
    .filter((s) => s.items.length > 0);

  const navItems: MenuNavItem[] = cafeSections.map((s) => ({ id: s.id, name: s.name }));
  navItems.push({ id: 'roastery', name: 'Roastery' });

  const signatures: SignatureDrink[] = SIGNATURE_SLUGS.map((slug) => {
    for (const section of cafeSections) {
      const item = section.items.find((i) => i.slug === slug);
      if (item) {
        return { item, label: SIGNATURE_LABELS[slug] ?? 'Menu', categoryId: section.id };
      }
    }
    return null;
  }).filter((s): s is SignatureDrink => s !== null);

  const bySlug = (slug: string) => beans.find((b) => b.slug === slug);
  const featured =
    bySlug('arabika-gayo') ?? bySlug('blend-a70-r30') ?? (beans[0] as CoffeeBean | undefined) ?? null;
  const supporting = [
    bySlug('arabika-toraja'),
    bySlug('robusta-lampung'),
    bySlug('blend-a70-r30'),
    bySlug('blend-a30-r70'),
  ].filter((b): b is CoffeeBean => Boolean(b));

  return (
    <>
      <MenuHero />
      <MenuCategoryNav items={navItems} />
      {cafeSections.length === 0 ? (
        <section className="w-full bg-paper py-24 text-center">
          <div className="container mx-auto max-w-xl px-4">
            <h2 className="font-display text-3xl text-ink">Menu Segera Hadir</h2>
            <p className="mt-3 text-muted-foreground">
              Kami masih menyempurnakan menu kami. Kunjungi kafe untuk pilihan hari ini.
            </p>
          </div>
        </section>
      ) : (
        <>
          {cafeSections.map((section, index) => (
            <MenuCategorySection key={section.id} category={section} index={index} />
          ))}
          <MenuSignatures signatures={signatures} />
        </>
      )}
      <MenuRoastery featured={featured} supporting={supporting} />
    </>
  );
}
