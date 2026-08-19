import { createClient } from '@/lib/supabase/server';

export type CoffeeVariant = {
  id: string;
  weight_grams: number;
  grind_type: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
};

export type CoffeeOrigin = {
  country: string;
  region: string | null;
  farm: string | null;
  description: string | null;
};

export type CoffeeBean = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  is_featured: boolean;
  description: string | null;
  process: string | null;
  roast_level: string | null;
  altitude_min: number | null;
  altitude_max: number | null;
  variety: string | null;
  story: string | null;
  brewing_notes: string | null;
  origin: CoffeeOrigin | null;
  flavorNotes: string[];
  variants: CoffeeVariant[];
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type MenuItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_type: string;
  base_price: number;
  image_url: string | null;
};

export function formatRupiah(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

async function fetchCoffeeData() {
  const supabase = await createClient();
  const [{ data: products }, { data: coffeeProducts }, { data: variants }, { data: flavorNotes }, { data: productNotes }, { data: origins }] =
    await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('product_type', 'COFFEE_BEAN')
        .order('sort_order', { ascending: true }),
      supabase.from('coffee_products').select('*'),
      supabase.from('coffee_variants').select('*').order('weight_grams', { ascending: true }),
      supabase.from('coffee_flavor_notes').select('*'),
      supabase.from('coffee_product_flavor_notes').select('*'),
      supabase.from('coffee_origins').select('*'),
    ]);

  const notesById = new Map((flavorNotes ?? []).map((n) => [n.id, n.name]));
  const originsById = new Map((origins ?? []).map((o) => [o.id, o]));

  return (products ?? [])
    .map((product): CoffeeBean | null => {
      const coffee = (coffeeProducts ?? []).find((c) => c.product_id === product.id);
      if (!coffee) return null;

      const beanNotes = (productNotes ?? [])
        .filter((pn) => pn.coffee_product_id === coffee.id)
        .map((pn) => notesById.get(pn.flavor_note_id))
        .filter((name): name is string => Boolean(name));

      const origin = coffee.origin_id ? (originsById.get(coffee.origin_id) ?? null) : null;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        base_price: product.base_price,
        is_featured: product.is_featured,
        description: product.description,
        process: coffee.process,
        roast_level: coffee.roast_level,
        altitude_min: coffee.altitude_min,
        altitude_max: coffee.altitude_max,
        variety: coffee.variety,
        story: coffee.story,
        brewing_notes: coffee.brewing_notes,
        origin: origin
          ? {
              country: origin.country,
              region: origin.region,
              farm: origin.farm,
              description: origin.description,
            }
          : null,
        flavorNotes: beanNotes,
        variants: (variants ?? [])
          .filter((v) => v.coffee_product_id === coffee.id)
          .map((v) => ({
            id: v.id,
            weight_grams: v.weight_grams,
            grind_type: v.grind_type,
            price: v.price,
            stock_quantity: v.stock_quantity,
            is_available: v.is_available,
          })),
      };
    })
    .filter((bean): bean is CoffeeBean => bean !== null);
}

function matchesFilter(bean: CoffeeBean, filter: string) {
  const query = filter.toLowerCase();
  if (!query) return true;

  if (bean.roast_level?.toLowerCase().includes(query)) return true;
  if (bean.flavorNotes.some((note) => note.toLowerCase().includes(query))) return true;
  if (bean.variants.some((v) => v.grind_type.toLowerCase().includes(query))) return true;
  if (bean.process?.toLowerCase().includes(query)) return true;
  if (bean.name.toLowerCase().includes(query)) return true;
  return false;
}

export async function getCoffeeBeans(filter?: string | null) {
  const beans = await fetchCoffeeData();
  return filter ? beans.filter((bean) => matchesFilter(bean, filter)) : beans;
}

export async function getCoffeeBeanBySlug(slug: string) {
  const beans = await fetchCoffeeData();
  return beans.find((bean) => bean.slug === slug) ?? null;
}

export async function getMenu() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('products').select('*').eq('is_available', true).order('sort_order', { ascending: true }),
  ]);

  const sections: { category: MenuCategory; items: MenuItem[] }[] = [];
  for (const category of categories ?? []) {
    const items = (products ?? [])
      .filter((p) => p.category_id === category.id)
      .map((p): MenuItem => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        product_type: p.product_type,
        base_price: p.base_price,
        image_url: p.image_url,
      }));
    sections.push({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      items,
    });
  }

  return sections;
}