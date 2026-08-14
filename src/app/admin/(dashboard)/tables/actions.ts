'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const tableSchema = z.object({
  table_number: z.string().min(1, 'Table number is required'),
  name: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  is_active: z.boolean().default(true),
})

export async function createTable(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      table_number: formData.get('table_number'),
      name: formData.get('name'),
      capacity: formData.get('capacity'),
      is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    }

    const validatedData = tableSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
      }
    }

    // Auto-generate slug
    const slug = `table-${validatedData.data.table_number.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

    const { data, error } = await supabase
      .from('tables')
      .insert({
        ...validatedData.data,
        slug,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'A table with this number or slug already exists.' }
      }
      throw error
    }

    revalidatePath('/admin/tables')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Create table error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to create table.' }
  }
}

export async function updateTable(id: string, prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      table_number: formData.get('table_number'),
      name: formData.get('name'),
      capacity: formData.get('capacity'),
      is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    }

    const validatedData = tableSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
      }
    }

    // Auto-generate slug based on new number
    const slug = `table-${validatedData.data.table_number.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

    const { data, error } = await supabase
      .from('tables')
      .update({
        ...validatedData.data,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'A table with this number or slug already exists.' }
      }
      throw error
    }

    revalidatePath('/admin/tables')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Update table error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to update table.' }
  }
}

export async function archiveTable(id: string, is_active: boolean) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('tables')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/tables')
    return { success: true }
  } catch (err: unknown) {
    console.error('Archive table error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to archive table.' }
  }
}
