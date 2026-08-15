import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/product-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tambah Produk - P1NTO Admin',
}

export default async function NewProductPage() {
  const supabase = await createClient()

  // Fetch categories for the form dropdown
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error || !categories) {
    return <div className="text-destructive p-8">Gagal memuat kategori. Silakan buat kategori terlebih dahulu.</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/menu/products" className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Tambah Produk Baru</h1>
          <p className="text-muted-foreground mt-1">Buat item baru untuk menu digital Anda.</p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  )
}
