'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { createCategory, updateCategory } from '@/app/admin/(dashboard)/menu/categories/actions'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'

type CategoryRow = Database['public']['Tables']['categories']['Row']

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
})

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CategoryRow | null
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const isEditing = !!category

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      sort_order: category?.sort_order || 0,
      is_active: category?.is_active ?? true,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name || '',
        description: category?.description || '',
        sort_order: category?.sort_order || 0,
        is_active: category?.is_active ?? true,
      })
    }
  }, [category, open, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('name', values.name)
    if (values.description) formData.append('description', values.description)
    formData.append('sort_order', values.sort_order.toString())
    formData.append('is_active', values.is_active.toString())

    let result
    if (isEditing && category) {
      result = await updateCategory(category.id, null, formData)
    } else {
      result = await createCategory(null, formData)
    }

    setIsSubmitting(false)

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      })
      return
    }

    toast({
      title: 'Success',
      description: isEditing ? 'Category updated successfully.' : 'Category created successfully.',
    })
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update category details.' : 'Create a new menu category.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Signature Coffee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>Lower numbers appear first.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
