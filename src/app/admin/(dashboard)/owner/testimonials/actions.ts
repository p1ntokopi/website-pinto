'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/auth/authorization';
import type { TestimonialStatus } from '@/types/testimonials';

export type TestimonialActionState = { ok: boolean; error?: string };

async function getOwnerClient() {
  const result = await requireOwner({
    forbidden: 'Hanya owner yang memiliki hak akses untuk memoderasi testimoni.',
  });

  if (!result.ok) {
    return { supabase: result.supabase, user: null, error: result.error };
  }

  return { supabase: result.context.supabase, user: result.context.profile, error: null };
}

export async function setTestimonialStatusAction(
  testimonialId: string,
  newStatus: TestimonialStatus,
): Promise<TestimonialActionState> {
  const { supabase, user, error } = await getOwnerClient();
  if (error || !user) return { ok: false, error };

  const { error: updateError } = await supabase
    .from('testimonials')
    .update({ status: newStatus })
    .eq('id', testimonialId);

  if (updateError) {
    console.error('Error updating testimonial status:', updateError);
    return { ok: false, error: 'Gagal memperbarui status testimoni.' };
  }

  revalidatePath('/');
  revalidatePath('/admin/owner/testimonials');
  return { ok: true };
}

export async function deleteTestimonialAction(
  testimonialId: string,
): Promise<TestimonialActionState> {
  const { supabase, user, error } = await getOwnerClient();
  if (error || !user) return { ok: false, error };

  const { error: deleteError } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', testimonialId);

  if (deleteError) {
    console.error('Error deleting testimonial:', deleteError);
    return { ok: false, error: 'Gagal menghapus testimoni.' };
  }

  revalidatePath('/');
  revalidatePath('/admin/owner/testimonials');
  return { ok: true };
}
