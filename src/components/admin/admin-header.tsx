'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  user: {
    full_name: string
    role: string
  }
  onMenuOpen?: () => void
}

const TITLE_MAP: Array<{ prefix: string; title: string }> = [
  { prefix: '/admin/orders/', title: 'Detail Pesanan' },
  { prefix: '/admin/menu/products/', title: 'Detail Produk' },
  { prefix: '/admin/menu/categories', title: 'Kategori' },
  { prefix: '/admin/menu/products', title: 'Produk' },
  { prefix: '/admin/tables/live', title: 'Meja Langsung' },
  { prefix: '/admin/tables', title: 'Meja & QR' },
  { prefix: '/admin/orders', title: 'Pesanan' },
  { prefix: '/admin', title: 'Ringkasan' },
]

function getPageTitle(pathname: string): string {
  const match = TITLE_MAP.find((entry) => pathname.startsWith(entry.prefix))
  return match?.title ?? 'Admin'
}

function formatToday(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AdminHeader({ user, onMenuOpen }: HeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-custom/60 bg-paper/95 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuOpen}
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka menu</span>
        </Button>
        <div>
          <div className="text-sm font-semibold leading-tight text-ink lg:text-base">{title}</div>
          <div className="hidden text-xs text-muted-text sm:block">{formatToday()}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold leading-tight text-ink">{user.full_name}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-text">
              {user.role === 'admin' ? 'Admin' : 'Staf'}
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-coffee text-sm font-bold text-paper">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}