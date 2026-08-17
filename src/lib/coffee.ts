/**
 * Logika murni (tanpa dependensi server) untuk fitur kopi.
 * File ini aman diimpor dari komponen client.
 */

export type BeanSummary = {
  slug: string;
  name: string;
  displayName: string;
  originCountry: string | null;
  originRegion: string | null;
  process: string | null;
  roastLevel: string | null;
  flavorNotes: string[];
  weightGrams: number | null;
  price: number;
  priceLabel: string;
  image: string;
};

export type QuizAnswers = {
  temp: 'panas' | 'dingin';
  body: 'ringan' | 'pekat';
  taste: 'manis' | 'pahit';
  milk: 'susu' | 'hitam';
};

/**
 * Petakan 4 jawaban kuis → slug biji kopi nyata dari DB.
 * Logika disederhanakan namun konsisten dengan profil rasa di seed:
 * - susu   → A30:R70 Kopi Susu Blend (blend dirancang untuk kopi susu)
 * - hitam  → karakter tubuh + rasa menentukan asal
 */
export function recommendBeanSlug(a: QuizAnswers): string {
  if (a.milk === 'susu') return 'blend-a30-r70';
  if (a.body === 'pekat' && a.taste === 'pahit') return 'robusta-lampung';
  if (a.body === 'pekat' && a.taste === 'manis') return 'arabika-toraja';
  if (a.body === 'ringan' && a.taste === 'manis') {
    return a.temp === 'dingin' ? 'arabika-bali' : 'arabika-jawa-barat';
  }
  if (a.body === 'ringan' && a.taste === 'pahit') return 'arabika-gayo';
  return 'arabika-gayo';
}