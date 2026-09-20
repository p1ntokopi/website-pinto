import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TestimonialsClient } from '@/components/admin/owner/testimonials-client';
import type { Testimonial } from '@/types/testimonials';

export const metadata: Metadata = {
  title: 'Testimoni Pelanggan - Pinto Admin',
};

export default async function OwnerTestimonialsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: testimonialsData } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  const testimonials: Testimonial[] = (testimonialsData as Testimonial[]) ?? [];

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-xs-plus font-semibold uppercase tracking-[0.16em] text-coffee">
          Pemasaran &amp; Komunitas
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Testimoni Pelanggan
        </h1>
        <p className="text-sm text-muted-text">
          Tinjau ulasan dan cerita dari pelanggan. Testimoni yang disetujui akan langsung tampil di
          bagian ulasan pada halaman utama Pinto Kupi.
        </p>
      </div>

      <TestimonialsClient testimonials={testimonials} />
    </div>
  );
}
