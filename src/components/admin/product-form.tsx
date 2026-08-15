'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createBrowserClient } from '@supabase/ssr'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProduct, updateProduct } from '@/app/admin/(dashboard)/menu/products/actions'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, X } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Card, CardContent } from '@/components/ui/card'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

const formSchema = z.object({
  category_id: z.string().min(1, 'Kategori wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  product_type: z.enum(['CAFE_DRINK', 'FOOD', 'PASTRY', 'COFFEE_BEAN']),
  base_price: z.coerce.number().min(0, 'Harga tidak valid'),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
})

interface ProductFormProps {
  product?: ProductRow | null
  categories: CategoryRow[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url || null)
  
  const { toast } = useToast()
  const router = useRouter()
  const isEditing = !!product

  const form = useForm<z.input<typeof formSchema>, any, z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: product?.category_id || '',
      name: product?.name || '',
      description: product?.description || '',
      product_type: product?.product_type || 'CAFE_DRINK',
      base_price: product?.base_price || 0,
      is_available: product?.is_available ?? true,
      is_featured: product?.is_featured ?? false,
      sort_order: product?.sort_order || 0,
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Kesalahan', description: 'File harus berupa gambar.' })
      return
    }

    setUploadingImage(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
toast({ title: 'Berhasil', description: 'Gambar berhasil diunggah.' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Pengunggahan Gagal', description: err.message })
    } finally {
      setUploadingImage(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('category_id', values.category_id)
    formData.append('name', values.name)
    if (values.description) formData.append('description', values.description)
    formData.append('product_type', values.product_type)
    formData.append('base_price', values.base_price.toString())
    formData.append('is_available', values.is_available.toString())
    formData.append('is_featured', values.is_featured.toString())
    formData.append('sort_order', values.sort_order.toString())
    if (imageUrl) formData.append('image_url', imageUrl)

    let result
    if (isEditing && product) {
      result = await updateProduct(product.id, null, formData)
    } else {
      result = await createProduct(null, formData)
    }

    setIsSubmitting(false)

    if (result.error) {
toast({
      variant: 'destructive',
      title: 'Kesalahan',
      description: result.error,
    })
    return
  }

  toast({
    title: 'Berhasil',
    description: isEditing ? 'Produk berhasil diperbarui.' : 'Produk berhasil dibuat.',
  })
    
    router.push('/admin/menu/products')
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
<FormLabel>Nama Produk *</FormLabel>
                    <FormControl>
                      <Input placeholder="mis., Iced Cafe Latte" {...field} />
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
<FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Input placeholder="Deskripsi singkat produk..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
<FormLabel>Kategori *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="product_type"
                  render={({ field }) => (
                    <FormItem>
<FormLabel>Tipe Produk *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CAFE_DRINK">Minuman Kafe</SelectItem>
                          <SelectItem value="FOOD">Makanan</SelectItem>
                          <SelectItem value="PASTRY">Pastry</SelectItem>
                          <SelectItem value="COFFEE_BEAN">Biji Kopi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Dasar (IDR) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={String(field.value ?? '')}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
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
                      <FormLabel>Urutan</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={String(field.value ?? '')}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-4">
<h3 className="font-semibold text-lg">Visibilitas</h3>
              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tersedia untuk Dipesan</FormLabel>
                      <FormDescription>Jika dimatikan, produk akan tampil sebagai Habis.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Produk Unggulan</FormLabel>
                      <FormDescription>Tampilkan ini secara menonjol di menu digital.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
<Button type="button" variant="outline" onClick={() => router.push('/admin/menu/products')}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Simpan Perubahan' : 'Buat Produk'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
<h3 className="font-semibold text-lg">Gambar Produk</h3>
            
            <div className="flex flex-col gap-4">
              {imageUrl ? (
                <div className="relative group rounded-md overflow-hidden border">
                  <img src={imageUrl} alt="Pratinjau" className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="sm" onClick={() => setImageUrl(null)}>
                      <X className="w-4 h-4 mr-2" /> Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-square bg-muted rounded-md border-2 border-dashed flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <Upload className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Unggah gambar produk</p>
                  <p className="text-xs opacity-70 mt-1">PNG, JPG maksimal 2MB</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" className="w-full relative" disabled={uploadingImage}>
                  {uploadingImage ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...</>
                  ) : (
                    <>Pilih Gambar</>
                  )}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

