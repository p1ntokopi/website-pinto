'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const testimonialSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter')
    .max(60, 'Nama maksimal 60 karakter'),
  customer_role: z
    .string()
    .trim()
    .max(60, 'Keterangan maksimal 60 karakter')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : 'Pelanggan Pinto Kupi')),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z
    .string()
    .trim()
    .min(10, 'Ulasan minimal 10 karakter')
    .max(500, 'Ulasan maksimal 500 karakter'),
});

export type SubmitTestimonialResult = {
  success: boolean;
  error?: string;
};

export async function submitTestimonialAction(
  formData: FormData | Record<string, unknown>,
): Promise<SubmitTestimonialResult> {
  try {
    const rawData =
      formData instanceof FormData
        ? {
            customer_name: formData.get('customer_name'),
            customer_role: formData.get('customer_role'),
            rating: formData.get('rating'),
            quote: formData.get('quote'),
          }
        : formData;

    const parsed = testimonialSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Data yang dimasukkan tidak valid.';
      return { success: false, error: firstError };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('testimonials').insert({
      customer_name: parsed.data.customer_name,
      customer_role: parsed.data.customer_role,
      rating: parsed.data.rating,
      quote: parsed.data.quote,
      status: 'pending',
    });

    if (error) {
      console.error('Error submitting testimonial:', error);
      return {
        success: false,
        error: 'Gagal mengirim testimoni. Silakan coba beberapa saat lagi.',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in submitTestimonialAction:', err);
    return {
      success: false,
      error: 'Terjadi kesalahan sistem. Silakan coba lagi.',
    };
  }
}
