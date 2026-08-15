'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Coffee,
  Tags,
  Armchair,
  LogOut,
  ChevronRight,
  ShoppingBag,
  QrCode,
  CookingPot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOutAction } from '@/app/auth/signout/actions'

interface SidebarProps {
  role: 'admin' | 'staff'
  mobile?: boolean
}

export function AdminSidebar({ role, mobile = false }: SidebarProps) {
  const pathname = usePathname()

  const navGroups = [
    {
      title: 'Dasbor',
      items: [{ title: 'Ringkasan', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'staff'] }],
    },
    {
      title: 'Menu',
      items: [
        { title: 'Produk', href: '/admin/menu/products', icon: Coffee, roles: ['admin', 'staff'] },
        { title: 'Kategori', href: '/admin/menu/categories', icon: Tags, roles: ['admin'] },
      ],
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
  ]

  return (
    <aside
      className={cn(
        'flex w-64 flex-col border-r border-border/40 bg-card',
        mobile
          ? 'h-full'
          : 'hidden lg:flex lg:h-screen'
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-border/40 px-6">
        <Link href="/admin" className="font-display text-2xl font-bold tracking-tight text-primary">
          P1NTO
          <span className="ml-2 font-sans text-sm font-normal tracking-normal text-muted-foreground">
            Admin
          </span>
        </Link>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title}>
              <h4 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h4>
              <nav className="space-y-1">
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
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                      {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      <div className="mt-auto border-t border-border/40 p-4">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}
