import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { TableLandingForm } from "@/components/ordering/table-landing-form"

export default async function TableLandingPage({
  params,
}: {
  params: { slug: string }
}) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: table, error } = await supabase
    .from("tables")
    .select("*")
    .eq("slug", resolvedParams.slug)
    .single()

  if (error || !table) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
        <h1 className="mb-2 text-2xl font-display font-bold">Meja Tidak Ditemukan</h1>
        <p className="mb-8 text-muted-foreground">
          Kode QR ini mungkin tidak valid atau meja tidak tersedia.
        </p>
        <Button render={<Link href="/" />} variant="outline">
          Kembali ke P1NTO
        </Button>
      </div>
    )
  }

  if (!table.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-display font-bold">Meja Tidak Tersedia</h1>
        <p className="mb-8 text-muted-foreground">
          Meja ini saat ini tidak menerima pesanan.
        </p>
        <Button render={<Link href="/" />} variant="outline">
          Kembali ke P1NTO
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-3">
          P1NTO Coffee
        </p>
        <h1 className="font-display text-5xl font-bold tracking-tight text-ink leading-none">
          P1NTO
        </h1>
      </div>

      <div className="w-full border border-border/60 bg-white p-8 mb-6">
        <h2 className="text-2xl font-bold mb-1">Meja {table.table_number}</h2>
        <p className="text-sm text-muted-foreground">
          Selamat datang. Anda dapat memesan langsung dari perangkat ini.
        </p>
      </div>

      <TableLandingForm tableSlug={table.slug} />
    </div>
  )
}
