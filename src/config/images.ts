/**
 * CURATED IMAGE LIBRARY — Pinto Coffee
 * ---------------------------------------------------------------
 * Semua URL di bawah adalah foto editorial PLACEHOLDER dari Unsplash.
 * Ganti dengan foto asli Pinto (produk, barista, interior, biji kopi)
 * lalu perbarui URL di sini — seluruh halaman akan mengikuti otomatis.
 *
 * Target produksi: R2 bucket `pintokopi-assets` → folder `/images/*`
 */

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const images = {
  /** Hero fallback ketika video tidak tersedia. */
  heroFallback: u('photo-1509042239860-f550ce710b93', 2000),

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

  /** Biji kopi / roastery. */
  beans: {
    bagA: u('photo-1559525839-b184a4d698c7'),
    bagB: u('photo-1587734195503-904fca47e0e9'),
    bagC: u('photo-1620189507195-68309c04c4d0'),
    rawA: u('photo-1447933601403-0c6688de566e'),
    rawB: u('photo-1502355984-b2cb47bc08cf'),
    roasted: u('photo-1559925393-8be0ec4767c8'),
    bar: u('photo-1498804103079-a6351b050096'),
    hands: u('photo-1611162458324-aae1eb4129a4'),
    scene: u('photo-1445116572660-236099ec97a0'),
    bagFeet: u('photo-1514432324607-a09d9b4aefdd'),
  },

  /** Kafe / suasana Pinto. */
  cafe: {
    interior: u('photo-1554118811-1e0d58224f24', 1600),
    interiorWarm: u('photo-1501339847302-ac426a4a7cbb', 1600),
    barista: u('photo-1497935586351-b67a49e012bf', 1600),
    pour: u('photo-1541167760496-1628856ab772'),
    table: u('photo-1525640788966-69bdb028aa73'),
    exterior: u('photo-1509042239860-f550ce710b93'),
    morning: u('photo-1504630083239-32187e466b48'),
    window: u('photo-1521017432531-fbd92d768814'),
    latte: u('photo-1534777367038-9404f45b869a'),
  },

  /** Perjalanan dari biji ke cangkir. */
  journey: {
    origin: u('photo-1447933601403-0c6688de566e', 1600),
    sourcing: u('photo-1611162458324-aae1eb4129a4', 1600),
    roasting: u('photo-1559925393-8be0ec4767c8', 1600),
    brewing: u('photo-1524350876685-274059332603', 1600),
  },

  /** Latar final CTA. */
  finalCta: u('photo-1611162617474-5b21e879e113', 2000),
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

export function beanImage(slug?: string | null) {
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

export function drinkImage(slug?: string | null) {
  return (slug && drinkImages[slug]) || images.drinks.espresso;
}