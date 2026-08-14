import { createClient } from '@/lib/supabase/server'
import { startOrResumeDiningSession } from '@/app/t/[slug]/actions'
import { Button } from '@/components/ui/button'
import { Coffee, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TableLandingPage({ params }: { params: { slug: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: table, error } = await supabase
    .from('tables')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single()

  if (error || !table) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-display font-bold mb-2">Table Not Found</h1>
        <p className="text-muted-foreground mb-8">
          This QR code may be invalid or the table does not exist.
        </p>
        <Button render={<Link href="/" />} variant="outline">
          Back to P1NTO
        </Button>
      </div>
    )
  }

  if (!table.is_active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-display font-bold mb-2">Table Unavailable</h1>
        <p className="text-muted-foreground mb-8">
          This table is not currently accepting orders.
        </p>
        <Button render={<Link href="/" />} variant="outline">
          Back to P1NTO
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-6 text-center max-w-md mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-display font-bold tracking-tight text-primary uppercase tracking-widest mb-2">P1NTO</h1>
        <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Coffee</p>
      </div>

      <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-border/50 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
          <Coffee className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Table {table.table_number}</h2>
        <p className="text-muted-foreground text-sm">Welcome. You can order directly from this device.</p>
      </div>

      <form action={startOrResumeDiningSession.bind(null, table.slug)} className="w-full">
        <Button type="submit" className="w-full h-14 text-lg font-medium shadow-md transition-transform active:scale-95 rounded-xl">
          View Menu & Order
        </Button>
      </form>
    </div>
  )
}
