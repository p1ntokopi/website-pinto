import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { QRPreview } from '@/components/admin/qr-preview'
import { PrintButton } from '@/components/admin/print-button'

export const metadata: Metadata = {
  title: 'Cetak Kode QR - Pinto',
}

export default async function PrintQRsPage() {
  const supabase = await createClient()

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('is_active', true)
    .order('table_number', { ascending: true })

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-bold mb-4">Cetak Kode QR</h1>
        <p className="mb-4 text-muted-foreground">Tekan Ctrl+P (atau Cmd+P) untuk mencetak halaman ini. Pastikan grafis latar belakang diaktifkan.</p>
        <PrintButton />
      </div>

      <div className="grid grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:bg-white">
        {tables?.map((table) => (
          <div key={table.id} className="break-inside-avoid mb-8">
            <QRPreview slug={table.slug} tableNumber={table.table_number} />
          </div>
        ))}
      </div>
    </div>
  )
}
