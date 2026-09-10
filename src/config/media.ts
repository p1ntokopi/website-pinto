const rawBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''
// Jika domain masih berupa *.r2.dev (yang diblokir ISP Indonesia), arahkan ke proxy lokal /api/storage
const base = rawBase.includes('.r2.dev') || !rawBase ? '/api/storage' : rawBase.replace(/\/$/, '')

function asset(path: string) {
  const cleanPath = path.replace(/^\/+/, '')
  return `${base}/${cleanPath}`
}

/**
 * Daftar aset media statis yang di-host di Cloudflare R2 (bucket `pintokupi-assets`).
 * Disajikan via proxy lokal /api/storage agar tidak diblokir ISP di Indonesia.
 */
export const media = {
  hero: {
    video: asset('/videos/hero.mp4'),
    poster: asset('/images/hero-poster.webp'),
  },
  gallery: {
    video1: asset('/videos/gallery-1.mp4'),
    video2: asset('/videos/gallery-2.mp4'),
  },
}