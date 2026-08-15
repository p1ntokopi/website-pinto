'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

interface AdminShellProps {
  user: { full_name: string; role: string }
  role: 'admin' | 'staff'
  children: React.ReactNode
}

export function AdminShell({ user, role, children }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

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
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader user={user} onMenuOpen={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 lg:p-8">{children}</main>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden', menuOpen ? '' : 'pointer-events-none')}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/30 transition-opacity duration-200',
            menuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-card shadow-popover transition-transform duration-200',
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu"
            className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          >
            <X className="h-5 w-5" />
          </button>
          <AdminSidebar role={role} mobile />
        </div>
      </div>
    </div>
  )
}
