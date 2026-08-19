import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { waLink } from '@/config/whatsapp';
import { cn } from '@/lib/utils';

export function WhatsAppLink({
  className,
  children = 'Order via WhatsApp',
  solid = false,
}: {
  className?: string;
  children?: React.ReactNode;
  solid?: boolean;
}) {
  return (
    <Link
      href={waLink()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink',
        solid
          ? 'h-14 rounded-full bg-ink px-8 text-paper hover:bg-coffee'
          : 'border-b border-ink/30 text-ink hover:border-coffee hover:text-coffee',
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}