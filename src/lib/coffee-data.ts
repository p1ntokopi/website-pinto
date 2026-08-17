import { formatRupiah, getCoffeeBeans, type CoffeeBean } from '@/lib/shop';
import type { BeanSummary } from '@/lib/coffee';

function displayName(name: string) {
  return name.replace(/\s*Beans?$/i, '').trim();
}

export function toBeanSummary(bean: CoffeeBean, image: string): BeanSummary {
  const price = bean.variants[0]?.price ?? bean.base_price;
  const weight = bean.variants[0]?.weight_grams ?? null;

  return {
    slug: bean.slug,
    name: bean.name,
    displayName: displayName(bean.name),
    originCountry: bean.origin?.country ?? null,
    originRegion: bean.origin?.region ?? null,
    process: bean.process,
    roastLevel: bean.roast_level,
    flavorNotes: bean.flavorNotes,
    weightGrams: weight,
    price,
    priceLabel: formatRupiah(price),
    image,
  };
}

export async function getBeanSummaries(): Promise<BeanSummary[]> {
  const beans = await getCoffeeBeans();
  return beans.map((bean) => toBeanSummary(bean, ''));
}