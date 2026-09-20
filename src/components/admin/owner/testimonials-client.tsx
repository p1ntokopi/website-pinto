'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Trash2,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquareQuote,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Testimonial, TestimonialStatus } from '@/types/testimonials';
import {
  setTestimonialStatusAction,
  deleteTestimonialAction,
} from '@/app/admin/(dashboard)/owner/testimonials/actions';

interface TestimonialsClientProps {
  testimonials: Testimonial[];
}

function formatTestimonialDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function TestimonialsClient({ testimonials: initialTestimonials }: TestimonialsClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | TestimonialStatus>('all');
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pendingCount = initialTestimonials.filter((t) => t.status === 'pending').length;
  const approvedCount = initialTestimonials.filter((t) => t.status === 'approved').length;
  const rejectedCount = initialTestimonials.filter((t) => t.status === 'rejected').length;

  const filteredTestimonials = initialTestimonials.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleStatusChange = (id: string, newStatus: TestimonialStatus) => {
    setError(null);
    setActionId(id);
    startTransition(async () => {
      const res = await setTestimonialStatusAction(id, newStatus);
      setActionId(null);
      if (!res.ok) {
        setError(res.error || 'Gagal mengubah status testimoni.');
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    setError(null);
    setActionId(id);
    startTransition(async () => {
      const res = await deleteTestimonialAction(id);
      setActionId(null);
      setConfirmDeleteId(null);
      if (!res.ok) {
        setError(res.error || 'Gagal menghapus testimoni.');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-sm border border-border-custom bg-card p-4">
          <p className="text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
            Total Ulasan
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
            {initialTestimonials.length}
          </p>
        </div>

        <div className="rounded-sm border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs-plus font-semibold uppercase tracking-wider text-warning">
              Menunggu Approval
            </p>
            {pendingCount > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-warning animate-pulse" />
            )}
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-warning sm:text-3xl">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-sm border border-success/20 bg-success/5 p-4">
          <p className="text-xs-plus font-semibold uppercase tracking-wider text-success">
            Aktif di Homepage
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-success sm:text-3xl">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-sm border border-border-custom bg-card p-4">
          <p className="text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
            Ditolak
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-custom/80 pb-3">
        <Button
          type="button"
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="rounded-full text-xs font-medium"
        >
          Semua ({initialTestimonials.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          className={cn(
            'rounded-full text-xs font-medium',
            filter === 'pending'
              ? 'bg-warning text-paper hover:bg-warning/90'
              : 'text-warning border-warning/30 hover:bg-warning/10',
          )}
        >
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          Menunggu ({pendingCount})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          className={cn(
            'rounded-full text-xs font-medium',
            filter === 'approved'
              ? 'bg-success text-paper hover:bg-success/90'
              : 'text-success border-success/30 hover:bg-success/10',
          )}
        >
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          Disetujui ({approvedCount})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setFilter('rejected')}
          className="rounded-full text-xs font-medium"
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          Ditolak ({rejectedCount})
        </Button>
      </div>

      {/* Testimonials List */}
      {filteredTestimonials.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border-custom p-12 text-center">
          <MessageSquareQuote className="mx-auto h-10 w-10 text-muted-text/50" />
          <h3 className="mt-3 font-display text-lg font-semibold text-ink">
            Tidak ada testimoni pada kategori ini
          </h3>
          <p className="mt-1 text-xs text-muted-text">
            Testimoni baru dari pelanggan akan otomatis tercatat di halaman ini untuk Anda moderasi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTestimonials.map((item) => {
            const isProcessing = isPending && actionId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  'relative rounded-sm border p-4 sm:p-5 transition-colors',
                  item.status === 'pending'
                    ? 'border-warning/40 bg-warning/5'
                    : item.status === 'approved'
                      ? 'border-success/30 bg-card'
                      : 'border-border-custom bg-muted/20 opacity-80',
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Info Header */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold text-ink">
                        {item.customer_name}
                      </span>
                      <span className="text-xs text-muted-text">({item.customer_role})</span>

                      {/* Status Badge */}
                      {item.status === 'pending' && (
                        <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning text-2xs font-semibold">
                          <Clock className="mr-1 h-3 w-3" />
                          Menunggu Persetujuan
                        </Badge>
                      )}
                      {item.status === 'approved' && (
                        <Badge variant="outline" className="border-success/50 bg-success/10 text-success text-2xs font-semibold">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Aktif di Homepage
                        </Badge>
                      )}
                      {item.status === 'rejected' && (
                        <Badge variant="outline" className="border-border-custom text-muted-text text-2xs font-semibold">
                          Ditolak
                        </Badge>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 py-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-3.5 w-3.5',
                            star <= item.rating
                              ? 'fill-warm text-warm'
                              : 'fill-ink/10 text-ink/10',
                          )}
                        />
                      ))}
                      <span className="ml-1.5 text-xs-plus text-muted-text">
                        {formatTestimonialDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {isProcessing ? (
                      <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-text">
                        <Loader2 className="h-4 w-4 animate-spin text-coffee" />
                        <span>Memproses...</span>
                      </div>
                    ) : (
                      <>
                        {item.status !== 'approved' && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'approved')}
                            className="min-h-11 rounded-sm md:min-h-0 bg-success px-3 text-xs font-semibold text-white hover:bg-success"
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Setujui
                          </Button>
                        )}

                        {item.status !== 'rejected' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(item.id, 'rejected')}
                            className="min-h-11 rounded-sm md:min-h-0 border-border-custom text-xs font-semibold text-muted-text hover:bg-muted hover:text-ink"
                          >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Tolak
                          </Button>
                        )}

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                              className="min-h-11 rounded-sm md:min-h-0 px-2 text-xs"
                            >
                              Yakin?
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-11 rounded-sm md:min-h-0 px-2 text-xs"
                            >
                              Batal
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(item.id)}
                            aria-label="Hapus testimoni"
                            className="min-h-11 min-w-11 rounded-sm md:min-h-0 md:min-w-0 p-0 text-muted-text hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Quote Content */}
                <div className="mt-3 rounded-sm bg-paper/60 p-3 text-sm leading-relaxed text-ink/90 dark:bg-muted/30">
                  &ldquo;{item.quote}&rdquo;
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
