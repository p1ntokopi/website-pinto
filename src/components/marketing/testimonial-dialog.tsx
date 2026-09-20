'use client';

import { useState } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { submitTestimonialAction } from '@/app/(marketing)/testimonials-actions';

interface TestimonialDialogProps {
  children?: React.ReactNode;
}

export function TestimonialDialog({ children }: TestimonialDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setName('');
    setRole('');
    setQuote('');
    setRating(5);
    setHoverRating(null);
    setErrorMessage(null);
    setIsSuccess(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(resetForm, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage('Mohon masukkan nama Anda (minimal 2 karakter).');
      return;
    }
    if (quote.trim().length < 10) {
      setErrorMessage('Mohon tuliskan ulasan Anda minimal 10 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitTestimonialAction({
        customer_name: name.trim(),
        customer_role: role.trim() || undefined,
        rating,
        quote: quote.trim(),
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'Gagal mengirim testimoni. Silakan coba lagi.');
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-ink/20 bg-transparent px-5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4 text-coffee" />
            Tulis Ulasan
          </Button>
        }
      />

      <DialogContent className="max-w-md border-ink/15 bg-paper p-6 text-ink sm:max-w-lg">
        {isSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-coffee/10 text-coffee">
              <CheckCircle2 className="h-8 w-8 text-coffee" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">
              Terima Kasih Banyak!
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Ulasan Anda telah kami terima dengan baik. Demi menjaga kenyamanan bersama, ulasan
              akan ditinjau oleh tim kami terlebih dahulu sebelum ditampilkan di halaman utama.
            </p>
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="mt-6 rounded-full bg-ink px-8 text-paper hover:bg-ink/90"
            >
              Tutup
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-display text-2xl font-bold tracking-tight text-ink">
                Bagikan Pengalaman Anda
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Ceritakan momen santai dan kesan Anda saat menikmati seduhan Pinto Kupi.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger"
                >
                  {errorMessage}
                </div>
              )}

              {/* Rating Bintang */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kepuasan Anda
                </Label>
                <div
                  className="flex items-center gap-1.5 pt-1"
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating ?? rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        aria-label={`Beri rating ${star} bintang`}
                        className="rounded-sm p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            active
                              ? 'fill-warm text-warm'
                              : 'fill-transparent text-ink/20 hover:text-ink/40'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {rating === 5
                      ? 'Sangat Memuaskan'
                      : rating === 4
                        ? 'Memuaskan'
                        : rating === 3
                          ? 'Cukup Baik'
                          : rating === 2
                            ? 'Kurang'
                            : 'Perlu Perbaikan'}
                  </span>
                </div>
              </div>

              {/* Nama */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="testimonial-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Nama Anda <span className="text-danger">*</span>
                </Label>
                <Input
                  id="testimonial-name"
                  required
                  placeholder="Contoh: Dimas Aditya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="border-ink/20 bg-card text-ink focus-visible:ring-coffee"
                />
              </div>

              {/* Peran / Keterangan */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="testimonial-role"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Peran / Kunjungan <span className="text-[10px] text-muted-foreground/70">(Opsional)</span>
                </Label>
                <Input
                  id="testimonial-role"
                  placeholder="Contoh: Penikmat Kopi Susu / Pengunjung Mingguan"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSubmitting}
                  className="border-ink/20 bg-card text-ink focus-visible:ring-coffee"
                />
              </div>

              {/* Ulasan */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="testimonial-quote"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Ulasan / Cerita Anda <span className="text-danger">*</span>
                </Label>
                <Textarea
                  id="testimonial-quote"
                  required
                  rows={4}
                  placeholder="Ceritakan suasana, rasa kopi, keramahan barista, atau momen favorit Anda di Pinto..."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  disabled={isSubmitting}
                  className="border-ink/20 bg-card text-ink focus-visible:ring-coffee"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Minimal 10 karakter</span>
                  <span>{quote.length}/500</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                  className="rounded-full text-muted-foreground hover:text-ink"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-coffee px-6 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Ulasan'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
