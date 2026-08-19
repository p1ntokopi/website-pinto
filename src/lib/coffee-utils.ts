/**
 * Logika murni katalog biji kopi (tanpa dependensi server).
 * Kategori & bucket rasa diturunkan dari data asli (nama & catatan rasa DB).
 */

export type BeanCategory = 'ARABICA' | 'ROBUSTA' | 'BLEND';

export function formatRupiah(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function displayName(name: string) {
  return name.replace(/\s*Beans?$/i, '').trim();
}

export function beanCategory(name: string): BeanCategory | null {
  const n = name.toLowerCase();
  if (n.includes('arabika')) return 'ARABICA';
  if (n.includes('robusta')) return 'ROBUSTA';
  if (n.includes('blend')) return 'BLEND';
  return null;
}

export type TasteBucketId = 'cokelat' | 'buah' | 'floral' | 'rempah';

export const TASTE_BUCKETS: { id: TasteBucketId; label: string; keywords: string[] }[] = [
  {
    id: 'cokelat',
    label: 'Cokelat & Manis',
    keywords: ['Cokelat', 'Karamel', 'Kacang', 'Manis'],
  },
  {
    id: 'buah',
    label: 'Buah',
    keywords: ['Citrus', 'Buah Beri', 'Buah Merah'],
  },
  {
    id: 'floral',
    label: 'Floral & Teh',
    keywords: ['Floral', 'Khas Teh'],
  },
  {
    id: 'rempah',
    label: 'Rempah & Earthy',
    keywords: ['Rempah', 'Herbal', 'Tanah / Earthy'],
  },
];

export function beanTasteIds(flavorNotes: string[]): TasteBucketId[] {
  const notes = flavorNotes.map((n) => n.toLowerCase());
  return TASTE_BUCKETS.filter((bucket) =>
    bucket.keywords.some((keyword) =>
      notes.some((note) => note.includes(keyword.toLowerCase())),
    ),
  ).map((bucket) => bucket.id);
}