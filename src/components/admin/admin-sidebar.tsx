'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Coffee, 
  UtensilsCrossed, 
  Tags, 
  Bean, 
  Armchair, 
  Settings,
  LogOut,
  ChevronRight,
  ShoppingBag,
  QrCode
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: 'admin' | 'staff'
}

export function AdminSidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const navGroups = [
    {
      title: 'Dashboard',
      items: [
        { title: 'Overview', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'staff'] }
      ]
    },
    {
      title: 'Menu',
      items: [
        { title: 'Products', href: '/admin/menu/products', icon: Coffee, roles: ['admin', 'staff'] },
        { title: 'Categories', href: '/admin/menu/categories', icon: Tags, roles: ['admin'] }
      ]
    },
    {
      title: 'Coffee Roastery',
      items: [
        { title: 'Coffee Beans', href: '/admin/coffee/products', icon: Bean, roles: ['admin'] }
      ]
    },
    {
      title: 'Operations',
      items: [
        { title: 'Orders', href: '/admin/orders', icon: ShoppingBag, roles: ['admin', 'staff'] },
        { title: 'Live Tables', href: '/admin/tables/live', icon: Armchair, roles: ['admin', 'staff'] },
        { title: 'Manage Tables & QR', href: '/admin/tables', icon: QrCode, roles: ['admin'] }
      ]
    },
    {
      title: 'System',
      items: [
        { title: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] }
      ]
    }
  ]

  return (
    <aside className="w-64 border-r border-border/40 bg-card h-[calc(100vh-4rem)] lg:h-screen flex flex-col hidden lg:flex">
      <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
        <Link href="/admin" className="font-display text-2xl font-bold tracking-tight text-primary">
          P1NTO<span className="text-muted-foreground font-sans text-sm ml-2 font-normal tracking-normal">Admin</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                {group.title}
              </h4>
              <nav className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.title}
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-border/40 mt-auto">
        <form action="/auth/signout" method="post">
          <button type="submit" className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
