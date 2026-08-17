const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

function asset(path: string) {
  return `${base}${path}`
}

/**
 * Daftar aset media statis yang di-host di Cloudflare R2 (bucket `pintokopi-assets`).
 * Nama file di bawah harus sesuai dengan file yang di-upload ke folder `/videos` dan `/images` di R2.
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