'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Coffee,
  Tags,
  Armchair,
  LogOut,
  ShoppingBag,
  QrCode,
  CookingPot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOutAction } from '@/app/auth/signout/actions'

interface SidebarProps {
  role: 'admin' | 'staff'
  user?: { full_name: string; role: string }
  mobile?: boolean
}

export function AdminSidebar({ role, user, mobile = false }: SidebarProps) {
  const pathname = usePathname()

  const navGroups = [
    {
      title: 'Overview',
      items: [{ title: 'Ringkasan', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'staff'] }],
    },
    {
      title: 'Operasional',
      items: [
        { title: 'Pesanan', href: '/admin/orders', icon: ShoppingBag, roles: ['admin', 'staff'] },
        { title: 'Meja Langsung', href: '/admin/tables/live', icon: Armchair, roles: ['admin', 'staff'] },
        { title: 'Meja & QR', href: '/admin/tables', icon: QrCode, roles: ['admin'] },
        { title: 'Display Dapur', href: '/admin/kitchen', icon: CookingPot, roles: ['admin', 'staff'] },
      ],
    },
    {
      title: 'Katalog',
      items: [
        { title: 'Produk', href: '/admin/menu/products', icon: Coffee, roles: ['admin', 'staff'] },
        { title: 'Kategori', href: '/admin/menu/categories', icon: Tags, roles: ['admin'] },
      ],
    },
  ]

  return (
    <aside
      className={cn(
        'flex w-[15.5rem] flex-col border-r border-border-custom/60 bg-paper',
        mobile ? 'h-full' : 'hidden lg:flex lg:h-screen'
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border-custom/60 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-coffee font-display text-lg font-bold text-paper">
          P
        </div>
        <div className="leading-none">
          <div className="font-display text-xl font-bold tracking-tight text-ink">P1NTO</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-text">
            Coffee Admin
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title}>
              <h4 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-text">
                {group.title}
              </h4>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-3 rounded-sm px-3 py-2 text-[0.85rem] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                        isActive
                          ? 'bg-coffee/10 text-ink'
                          : 'text-muted-text hover:bg-muted/60 hover:text-ink'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-coffee" />
                      )}
                      <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-coffee' : 'text-muted-text')} />
                      {item.title}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      <div className="border-t border-border-custom/60 p-3">
        {user ? (
          <div className="mb-2 flex items-center gap-3 rounded-sm px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-coffee text-sm font-bold text-paper">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-ink">{user.full_name}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-text">
                {user.role === 'admin' ? 'Admin' : 'Staf'}
              </div>
            </div>
          </div>
        ) : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-[0.85rem] font-medium text-muted-text transition-colors hover:bg-danger/10 hover:text-danger focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}