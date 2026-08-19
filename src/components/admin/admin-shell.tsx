'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Armchair, Coffee, MoreHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

interface AdminShellProps {
  user: { full_name: string; role: string }
  role: 'admin' | 'staff'
  children: React.ReactNode
}

const BOTTOM_NAV = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/tables/live', label: 'Meja', icon: Armchair },
  { href: '/admin/menu/products', label: 'Menu', icon: Coffee },
]

export function AdminShell({ user, role, children }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // Lock body scroll and close on Escape while the drawer is open
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-screen w-full bg-paper">
      <AdminSidebar role={role} user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader user={user} onMenuOpen={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-5 lg:px-8 lg:pb-8 lg:pt-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border-custom bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {BOTTOM_NAV.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-coffee' : 'text-muted-text'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              {item.label}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Buka menu lainnya"
          className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-text transition-colors hover:text-ink"
        >
          <MoreHorizontal className="h-5 w-5" />
          Lainnya
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden', menuOpen ? '' : 'pointer-events-none')}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/30 transition-opacity duration-200',
            menuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-paper shadow-[2px_0_20px_rgba(23,21,19,0.08)] transition-transform duration-200',
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu"
            className="absolute right-3 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-sm text-muted-text transition-colors hover:bg-muted hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
          >
            <X className="h-5 w-5" />
          </button>
          <AdminSidebar role={role} user={user} mobile />
        </div>
      </div>
    </div>
  )
}