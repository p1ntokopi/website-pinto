/**
 * CURATED IMAGE LIBRARY — Pinto Coffee
 * ---------------------------------------------------------------
 * Semua URL di bawah adalah foto editorial PLACEHOLDER dari Unsplash.
 * Ganti dengan foto asli Pinto (produk, barista, interior, biji kopi)
 * lalu perbarui URL di sini — seluruh halaman akan mengikuti otomatis.
 *
 * Target produksi: R2 bucket `pintokopi-assets` → folder `/images/*`
 */

const rawBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
// Jika domain masih berupa *.r2.dev (yang diblokir ISP Indonesia), arahkan ke proxy lokal /api/storage
const base = rawBase.includes('.r2.dev') || !rawBase ? '/api/storage' : rawBase.replace(/\/$/, '');

function r2Image(filename: string) {
  const clean = filename.replace(/^\/+/, '');
  const encoded = clean.split('/').map(encodeURIComponent).join('/');
  return `${base}/images/${encoded}`;
}

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const images = {
  /** Hero fallback ketika video tidak tersedia. */
  heroFallback: r2Image('hero-poster.webp'),

  /** Menu signature — minuman andalan dari bar. */
  drinks: {
    sanger: u('photo-1572442388796-11668a67e53d'),
    aren: u('photo-1461023058943-07fcbe16d735'),
    v60: u('photo-1512568400610-62da28bc8a13'),
    espresso: u('photo-1510591509098-f4fdc6d0ff04'),
    matcha: u('photo-1578314675249-a6910f80cc4e'),
    latteArt: u('photo-1600093463592-8e36ae95ef56'),
    coldBrew: u('photo-1461023058943-07fcbe16d735'),
  },

  /** Biji kopi / roastery — foto asli Pinto Kupi. */
  beans: {
    bagA: r2Image('IMG_1109.jpg'), // Rak toples single origin & display pack Pinto
    bagB: r2Image('IMG_2125.jpg'), // Kraft pouch 'PINTÖ KUPI EST. 1993'
    bagC: r2Image('IMG_1109.jpg'), // Rak toples display roastery
    rawA: r2Image('IMG_1116.jpg'), // Macro medium roast beans
    rawB: r2Image('hero-poster.webp'), // Biji kopi sangrai flat lay
    roasted: r2Image('IMG_1118.jpg'), // Macro dark roast coffee beans
    bar: r2Image('IMG_2030.jpg'), // Barista espresso bar station & takeaway cups
    hands: r2Image('CEO PINTO.jpg'), // Founder / Roaster Pinto Kupi
    scene: r2Image('IMG_1112.jpg'), // Plakat kayu Pinto Kupi 1993 & alat manual brew
    bagFeet: r2Image('IMG_2125.jpg'),
  },

  /** Kafe / suasana Pinto — foto asli Pinto Kupi. */
  cafe: {
    interior: r2Image('IMG_1996.jpg'), // Ruang santai indoor, meja marmer & art frame
    interiorWarm: r2Image('IMG_1994.jpg'), // Teras ngopi lantai 2, kursi rotan & tanaman asri
    barista: r2Image('CEO PINTO.jpg'), // Founder / Roaster Pinto Kupi di bar
    pour: r2Image('IMG_1112.jpg'), // Manual brewing gear & plakat kayu 1993
    table: r2Image('IMG_2030.jpg'), // Detail meja bar espresso & cup Pinto
    exterior: r2Image('IMG_2014.jpg'), // Tampak depan gedung Pinto siang hari
    morning: r2Image('IMG_1994.jpg'), // Suasana santai teras lantai 2
    window: r2Image('IMG_2019.jpg'), // Counter kasir / order & pay bar
    latte: r2Image('IMG_2030.jpg'), // Bar station
  },

  /** Perjalanan dari biji ke cangkir. */
  journey: {
    origin: r2Image('IMG_1109.jpg'), // Toples single origin Nusantara (Gayo Winey, Luwak, dll)
    sourcing: r2Image('CEO PINTO.jpg'), // Kurasi & seleksi biji oleh roaster Pinto
    roasting: r2Image('IMG_1116.jpg'), // Biji kopi sangrai segar pilihan
    brewing: r2Image('IMG_1112.jpg'), // Peralatan seduh presisi di bar Pinto
  },

  /** Latar final CTA. */
  finalCta: r2Image('IMG_2016.jpg'), // Gedung Pinto Kupi malam hari dengan lampu hangat
};

/**
 * Peta foto PLACEHOLDER per biji kopi (key = slug produk dari DB).
 * Karena stok foto belum tersedia, beberapa biji berbagi foto yang sama.
 * Saat foto asli siap, ganti nilai di sini per slug.
 */
export const beanImages: Record<string, string> = {
  'arabika-gayo-luwak': images.beans.bagA,
  'arabika-gayo-winey': images.beans.bar,
  'arabika-gayo-natural': images.beans.rawA,
  'arabika-gayo-peaberry': images.beans.hands,
  'arabika-gayo': images.beans.bagB,
  'arabika-mandailing': images.beans.bagC,
  'arabika-jawa-barat': images.beans.bar,
  'arabika-jawa-barat-natural': images.beans.scene,
  'arabika-bali': images.beans.rawB,
  'arabika-toraja': images.beans.roasted,
  'arabika-kerinci': images.beans.rawA,
  'arabika-flores-bajawa': images.beans.bagA,
  'robusta-gayo': images.beans.rawB,
  'robusta-sanger': images.beans.bagB,
  'robusta-toraja': images.beans.bar,
  'robusta-lampung': images.beans.scene,
  'robusta-sidikalang': images.beans.hands,
  'robusta-jawa-barat': images.beans.bagC,
  'robusta-jawa-tengah': images.beans.rawA,
  'blend-a70-r30': images.beans.bagA,
  'blend-a50-r50': images.beans.bar,
  'blend-a30-r70': images.beans.rawB,
};

const FALLBACK_BEAN = images.beans.bagA;

export function beanImage(slug?: string | null, customUrl?: string | null) {
  if (customUrl) return customUrl;
  return (slug && beanImages[slug]) || FALLBACK_BEAN;
}

/** Peta foto PLACEHOLDER per minuman signature (key = slug dari DB). */
export const drinkImages: Record<string, string> = {
  'sanger-latte': images.drinks.sanger,
  'aren-latte': images.drinks.aren,
  'v-60': images.drinks.v60,
  'espresso': images.drinks.espresso,
  'matcha-latte': images.drinks.matcha,
  'vanilla-latte': images.drinks.latteArt,
  'coffee-latte': images.drinks.latteArt,
  'mochachino-latte': images.drinks.latteArt,
  'bottle-package-500': images.beans.bagFeet,
  'bottle-package-1l': images.beans.bagFeet,
};

export function drinkImage(slug?: string | null, customUrl?: string | null) {
  if (customUrl) return customUrl;
  return (slug && drinkImages[slug]) || images.drinks.espresso;
}