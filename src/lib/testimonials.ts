import { createClient } from '@/lib/supabase/server';
import type { Testimonial } from '@/types/testimonials';

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) return [];
    return data as Testimonial[];
  } catch {
    return [];
  }
}
