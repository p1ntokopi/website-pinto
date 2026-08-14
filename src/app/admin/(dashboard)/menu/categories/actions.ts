'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
})

export async function createCategory(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      sort_order: formData.get('sort_order'),
      is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    }

    const validatedData = categorySchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
      }
    }

    const slug = validatedData.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...validatedData.data,
        slug,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return { error: 'Category with this name already exists' }
      throw error
    }

    revalidatePath('/admin/menu/categories')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Create category error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to create category' }
  }
}

export async function updateCategory(id: string, prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
      sort_order: formData.get('sort_order'),
      is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    }

    const validatedData = categorySchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
      }
    }

    const slug = validatedData.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { data, error } = await supabase
      .from('categories')
      .update({
        ...validatedData.data,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return { error: 'Category with this name already exists' }
      throw error
    }

    revalidatePath('/admin/menu/categories')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Update category error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to update category' }
  }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  try {
    // Check if category has products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      
    if (countError) throw countError
    if (count && count > 0) {
      return { error: 'Cannot delete category that contains products' }
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/menu/categories')
    return { success: true }
  } catch (err: unknown) {
    console.error('Delete category error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to delete category' }
  }
}
