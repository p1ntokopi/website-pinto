'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const productSchema = z.object({
  category_id: z.string().uuid('Category is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  product_type: z.enum(['CAFE_DRINK', 'FOOD', 'PASTRY', 'COFFEE_BEAN']),
  base_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
  image_url: z.string().optional().nullable(),
})

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
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
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
      if (error.code === '23505') return { error: 'Product with this name already exists' }
      throw error
    }

    revalidatePath('/admin/menu/products')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Create product error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to create product' }
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

    const validatedData = productSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
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
      if (error.code === '23505') return { error: 'Product with this name already exists' }
      throw error
    }

    revalidatePath('/admin/menu/products')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Update product error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to update product' }
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
    return { error: err instanceof Error ? err.message : 'Failed to toggle availability' }
  }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/menu/products')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete product' }
  }
}
