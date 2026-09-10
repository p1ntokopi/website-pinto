'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { getImageUploadUrl } from '@/lib/storage/actions'
import { normalizeImageUrl } from '@/lib/storage/r2'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, X } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Card, CardContent } from '@/components/ui/card'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

// Value -> label maps so the closed Select shows names, not raw ids/enums.
const PRODUCT_TYPE_ITEMS = [
  { value: 'CAFE_DRINK', label: 'Minuman Kafe' },
  { value: 'FOOD', label: 'Makanan' },
  { value: 'PASTRY', label: 'Pastry' },
  { value: 'COFFEE_BEAN', label: 'Biji Kopi' },
  { value: 'DESSERT', label: 'Dessert & Es Krim' },
  { value: 'SERVICE', label: 'Jasa / Layanan' },
]

const formSchema = z.object({
  category_id: z.string().min(1, 'Kategori wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  product_type: z.enum(['CAFE_DRINK', 'FOOD', 'PASTRY', 'COFFEE_BEAN', 'DESSERT', 'SERVICE']),
  base_price: z.coerce.number().min(0, 'Harga tidak valid'),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
})

interface ProductFormProps {
  product?: ProductRow | null
  categories: CategoryRow[]
}

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= 1.5 * 1024 * 1024 || file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxDim = 1600
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const ext = file.type === 'image/png' ? 'png' : 'jpg'
            const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), {
              type: outType,
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const initialImg = normalizeImageUrl(product?.image_url) || null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(initialImg)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImg)
  const [imageLoadError, setImageLoadError] = useState(false)

  const originalImageUrl = product?.image_url || null
  
  const { toast } = useToast()
  const router = useRouter()
  const isEditing = !!product

  const form = useForm<z.input<typeof formSchema>, undefined, z.infer<typeof formSchema>>({
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

    setImageLoadError(false)
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setUploadingImage(true)

    try {
      const fileToUpload = await compressImageIfNeeded(file)
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('folder', 'products')

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengunggah ke penyimpanan.')
      }

      setImageUrl(data.url)
      setPreviewUrl(data.url)
      toast({ title: 'Berhasil', description: 'Gambar berhasil diunggah.' })
    } catch (err) {
      setPreviewUrl(imageUrl)
      toast({
        variant: 'destructive',
        title: 'Pengunggahan Gagal',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah.',
      })
    } finally {
      setUploadingImage(false)
      URL.revokeObjectURL(localPreview)
      e.target.value = ''
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
    if (isEditing && originalImageUrl) formData.append('old_image_url', originalImageUrl)

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
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        items={categories.map((c) => ({ value: c.id, label: c.name }))}
                      >
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={PRODUCT_TYPE_ITEMS}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_TYPE_ITEMS.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
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
              {previewUrl && !imageLoadError ? (
                <div className="relative group rounded-md overflow-hidden border bg-muted aspect-square">
                  <img
                    src={previewUrl}
                    alt="Pratinjau"
                    className="w-full h-full object-cover"
                    onError={() => setImageLoadError(true)}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setImageUrl(null)
                        setPreviewUrl(null)
                        setImageLoadError(false)
                      }}
                    >
                      <X className="w-4 h-4 mr-2" /> Hapus
                    </Button>
                  </div>
                </div>
              ) : imageLoadError ? (
                <div className="w-full aspect-square bg-destructive/5 rounded-md border-2 border-dashed border-destructive/30 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <X className="w-8 h-8 mb-2 text-destructive opacity-70" />
                  <p className="text-sm font-medium text-foreground">Gambar tidak dapat dimuat</p>
                  <p className="text-xs text-muted-foreground mt-1">Ganti gambar dengan memilih file baru</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    type="button"
                    onClick={() => {
                      setImageUrl(null)
                      setPreviewUrl(null)
                      setImageLoadError(false)
                    }}
                  >
                    Reset Gambar
                  </Button>
                </div>
              ) : (
                <div className="w-full aspect-square bg-muted rounded-md border-2 border-dashed flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <Upload className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Unggah gambar produk</p>
                  <p className="text-xs opacity-70 mt-1">PNG, JPG, WebP maksimal 10MB</p>
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

