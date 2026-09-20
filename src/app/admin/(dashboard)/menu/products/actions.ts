'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { deleteObject } from '@/lib/storage/r2'
import { objectKeyFromUrl } from '@/lib/storage/r2'
import { toFriendlyError } from '@/lib/ui/errors'

const productSchema = z.object({
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().nullish(),
  product_type: z.enum(['CAFE_DRINK', 'FOOD', 'PASTRY', 'COFFEE_BEAN', 'DESSERT', 'SERVICE']),
  base_price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
  image_url: z.string().optional().nullable(),
})

const FIELD_LABELS: Record<string, string> = {
  category_id: 'Kategori',
  name: 'Nama',
  description: 'Deskripsi',
  product_type: 'Tipe produk',
  base_price: 'Harga',
  sort_order: 'Urutan',
  image_url: 'Gambar',
}

function summarizeFieldErrors(
  fieldErrors: Record<string, string[] | undefined>
): string {
  return Object.entries(fieldErrors)
    .map(([field, msgs]) => `${FIELD_LABELS[field] ?? field}: ${msgs?.join(', ')}`)
    .join('; ')
}

export async function createProduct(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      category_id: formData.get('category_id'),
      name: formData.get('name'),
      description: formData.get('description'),
      product_type: formData.get('product_type'),
      base_price: formData.get('base_price'),
      is_available: formData.get('is_available') === 'true',
      is_featured: formData.get('is_featured') === 'true',
      sort_order: formData.get('sort_order'),
      image_url: formData.get('image_url') || null,
    }

    const validatedData = productSchema.safeParse(rawData)

    if (!validatedData.success) {
      const fieldErrors = validatedData.error.flatten().fieldErrors
      return {
        error: `Data belum lengkap — ${summarizeFieldErrors(fieldErrors)}`,
        fieldErrors,
      }
    }

    const slug = validatedData.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...validatedData.data,
        slug,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return { error: 'Produk dengan nama ini sudah ada.' }
      throw error
    }

    revalidatePath('/admin/menu/products')
    return { success: true, data }
  } catch (err: unknown) {
    return { error: toFriendlyError('create product', err, 'Gagal membuat produk.') }
  }
}

export async function updateProduct(id: string, prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      category_id: formData.get('category_id'),
      name: formData.get('name'),
      description: formData.get('description'),
      product_type: formData.get('product_type'),
      base_price: formData.get('base_price'),
      is_available: formData.get('is_available') === 'true',
      is_featured: formData.get('is_featured') === 'true',
      sort_order: formData.get('sort_order'),
      image_url: formData.get('image_url') || null,
    }
    const oldImageUrl = (formData.get('old_image_url') as string | null) || null

    const validatedData = productSchema.safeParse(rawData)

    if (!validatedData.success) {
      const fieldErrors = validatedData.error.flatten().fieldErrors
      return {
        error: `Data belum lengkap — ${summarizeFieldErrors(fieldErrors)}`,
        fieldErrors,
      }
    }

    const slug = validatedData.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { data, error } = await supabase
      .from('products')
      .update({
        ...validatedData.data,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return { error: 'Produk dengan nama ini sudah ada.' }
      throw error
    }

    if (oldImageUrl && oldImageUrl !== validatedData.data.image_url) {
      await deleteObject(objectKeyFromUrl(oldImageUrl))
    }

    revalidatePath('/admin/menu/products')
    return { success: true, data }
  } catch (err: unknown) {
    return { error: toFriendlyError('update product', err, 'Gagal memperbarui produk.') }
  }
}

export async function toggleProductAvailability(id: string, is_available: boolean) {
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_available, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/menu/products')
    return { success: true }
  } catch (err: unknown) {
    return {
      error: toFriendlyError(
        'toggle product availability',
        err,
        'Gagal mengubah ketersediaan produk.'
      ),
    }
  }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  try {
    const { data: product } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (product?.image_url) {
      await deleteObject(objectKeyFromUrl(product.image_url))
    }

    revalidatePath('/admin/menu/products')
    return { success: true }
  } catch (err: unknown) {
    return { error: toFriendlyError('delete product', err, 'Gagal menghapus produk.') }
  }
}