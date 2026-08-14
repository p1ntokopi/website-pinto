import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/product-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Edit Product - P1NTO Admin',
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Ensure params.id exists and is awaited according to Next.js 15+ patterns
  const resolvedParams = await params

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (productError || !product) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/menu/products" className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update details for {product.name}.</p>
        </div>
      </div>

      <ProductForm product={product} categories={categories || []} />
    </div>
  )
}
