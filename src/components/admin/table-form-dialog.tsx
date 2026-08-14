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
import { createTable, updateTable } from '@/app/admin/(dashboard)/tables/actions'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'

type TableRow = Database['public']['Tables']['tables']['Row']

const formSchema = z.object({
  table_number: z.string().min(1, 'Table number is required'),
  name: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  is_active: z.boolean().default(true),
})

interface TableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table?: TableRow | null
}

export function TableFormDialog({ open, onOpenChange, table }: TableFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const isEditing = !!table

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      table_number: table?.table_number || '',
      name: table?.name || '',
      capacity: table?.capacity || 2,
      is_active: table?.is_active ?? true,
    },
  })

  // Reset form when table changes
  useEffect(() => {
    if (open) {
      form.reset({
        table_number: table?.table_number || '',
        name: table?.name || '',
        capacity: table?.capacity || 2,
        is_active: table?.is_active ?? true,
      })
    }
  }, [table, open, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('table_number', values.table_number)
    if (values.name) formData.append('name', values.name)
    formData.append('capacity', values.capacity.toString())
    formData.append('is_active', values.is_active.toString())

    let result
    if (isEditing && table) {
      result = await updateTable(table.id, null, formData)
    } else {
      result = await createTable(null, formData)
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
      description: isEditing ? 'Table updated successfully.' : 'Table created successfully.',
    })
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Table' : 'Add New Table'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the details for this table.' 
              : 'Create a new table for the cafe. A unique QR code will be generated automatically.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="table_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 01, 02, VIP-1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Will be used to generate the QR URL slug (e.g., table-01).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Window Seat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
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
                    <FormLabel className="text-base">
                      Active Status
                    </FormLabel>
                    <FormDescription>
                      Inactive tables cannot be ordered from and show as archived.
                    </FormDescription>
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
                {isEditing ? 'Save Changes' : 'Create Table'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
