import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { Receipt, PhilippinePeso, Armchair, Coffee, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Dashboard - P1NTO Admin',
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // For M2, Orders and Revenue are 0 (Ordering system is M3)
  const ordersCount = 0
  const revenue = 0

  // Active Tables
  const { count: tablesCount } = await supabase
    .from('tables')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Active Menu Items
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_available', true)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight text-primary">Overview</h2>
        <p className="text-muted-foreground mt-1">Today&apos;s operational metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Orders
            </CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending implementation</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Revenue
            </CardTitle>
            <PhilippinePeso className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(revenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending implementation</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Active Tables
            </CardTitle>
            <Armchair className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tablesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for seating</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Menu Items
            </CardTitle>
            <Coffee className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Available on digital menu</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button render={<Link href="/admin/menu/products/new" />} className="flex-1">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
            <Button render={<Link href="/admin/tables" />} variant="outline" className="flex-1">
              <Plus className="w-4 h-4 mr-2" /> Add Table
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground flex items-center justify-center h-20 border border-dashed rounded-md">
              No recent activity
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
