import Link from 'next/link'
import { Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper p-4">
      <div className="max-w-md text-center">
        <Coffee className="mx-auto h-8 w-8 text-coffee" aria-hidden="true" />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          404
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-text">
          Halaman yang kamu cari mungkin sudah dipindahkan atau tidak pernah ada. Sambil di sini,
          kopinya masih tersaji.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button render={<Link href="/" />}>Ke Beranda</Button>
          <Button render={<Link href="/menu" />} variant="outline">
            Lihat Menu
          </Button>
        </div>
      </div>
    </div>
  )
}
