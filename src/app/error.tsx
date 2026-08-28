'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper p-4">
      <div className="max-w-md text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-warning" aria-hidden="true" />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
          Ada yang salah
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-text">
          Terjadi kesalahan yang tidak terduga. Coba muat ulang halaman ini — jika masalah
          berlanjut, hubungi admin.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset}>Coba Lagi</Button>
          <Button render={<Link href="/" />} variant="outline">
            Ke Beranda
          </Button>
        </div>
      </div>
    </div>
  )
}
