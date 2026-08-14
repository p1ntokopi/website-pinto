'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  user: {
    full_name: string
    role: string
  }
}

export function AdminHeader({ user }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border/40 bg-card flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="lg:hidden font-display text-xl font-bold text-primary">P1NTO</div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">{user.full_name}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{user.role}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border border-primary/20">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
