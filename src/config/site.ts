/**
 * SOURCE OF TRUTH UNTUK DOMAIN & SITUS PRODUKSI PINTO KUPI
 * --------------------------------------------------------
 * Canonical host: https://pintokupi.my.id
 *
 * Kebijakan lingkungan:
 * - DEVELOPMENT: http://localhost:3000 (atau URL lokal yang dikonfigurasi)
 * - PRODUCTION : https://pintokupi.my.id (DILARANG KERAS menghasilkan localhost)
 */

export const PRODUCTION_SITE_URL = 'https://pintokupi.my.id';
export const DEVELOPMENT_SITE_URL = 'http://localhost:3000';

/**
 * Mengembalikan origin URL situs yang sesuai dengan lingkungan saat ini.
 * Dalam mode build/produksi atau deployment cloud (Vercel), fungsi ini menjamin
 * tidak akan pernah menghasilkan alamat localhost/127.0.0.1.
 */
export function getSiteUrl(): string {
  // Mode produksi (build statis atau runtime produksi)
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (configuredUrl) {
      const trimmed = configuredUrl.trim().replace(/\/+$/, '');
      // Tolak alamat yang mengarah ke localhost atau loopback IP
      if (
        !trimmed.includes('localhost') &&
        !trimmed.includes('127.0.0.1') &&
        !trimmed.includes('0.0.0.0')
      ) {
        // Normalisasi subdomain www ke apex domain kanonikal
        if (trimmed === 'https://www.pintokupi.my.id' || trimmed === 'http://www.pintokupi.my.id') {
          return PRODUCTION_SITE_URL;
        }
        return trimmed;
      }
    }
    return PRODUCTION_SITE_URL;
  }

  // Mode pengembangan lokal (development / test)
  const localUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (localUrl) {
    return localUrl.trim().replace(/\/+$/, '');
  }
  return DEVELOPMENT_SITE_URL;
}

export const SITE_CONFIG = {
  name: 'Pinto Kupi',
  tagline: 'Roastery & Kafe di Bogor',
  description:
    'Pinto Kupi — roastery dan kafe di Bogor. Biji kopi Nusantara pilihan, disangrai in-house dalam batch kecil, dan disajikan segar untuk setiap momen.',
  canonicalUrl: PRODUCTION_SITE_URL,
  locale: 'id_ID',
  ogImage: '/Pintokupi.webp',
  address: {
    street: 'Jl. Flamboyan No. 8, Perumahan Bumi Insani',
    subdistrict: 'Desa Tonjong, Kec. Tajur Halang',
    city: 'Bogor',
    province: 'Jawa Barat',
    postalCode: '16320',
    country: 'ID',
  },
  openingHours: 'Buka setiap hari 13.00 — 24.00',
  mapsUrl: 'https://maps.app.goo.gl/p7UhDrsRF1SbVEVh9',
} as const;
