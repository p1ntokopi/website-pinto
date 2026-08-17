import { RevealHeading, RevealFade, type HeadingLine } from './reveal-heading';
import { cn } from '@/lib/utils';

export function SectionHeader({
  eyebrow,
  lines,
  description,
  align = 'start',
  dark = false,
  className,
  titleClassName,
  eyebrowClassName,
}: {
  eyebrow: string;
  lines: HeadingLine[];
  description?: string;
  align?: 'start' | 'center';
  dark?: boolean;
  className?: string;
  titleClassName?: string;
  eyebrowClassName?: string;
}) {
  const centered = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        centered && 'items-center text-center',
        className,
      )}
    >
      <p
        className={cn(
          'flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em]',
          centered && 'justify-center',
          dark ? 'text-warm' : 'text-coffee',
          eyebrowClassName,
        )}
      >
        <span className={cn('h-px w-8', dark ? 'bg-warm/50' : 'bg-coffee/40')} />
        {eyebrow}
        {centered && <span className={cn('h-px w-8', dark ? 'bg-warm/50' : 'bg-coffee/40')} />}
      </p>

      <RevealHeading
        lines={lines}
        className={cn(
          'font-display text-4xl leading-[1.04] tracking-tight md:text-5xl lg:text-6xl',
          dark ? 'text-cream' : 'text-ink',
          titleClassName,
        )}
      />

      {description && (
        <RevealFade delay={0.15}>
          <p
            className={cn(
              'max-w-xl text-lg leading-relaxed',
              dark ? 'text-paper/70' : 'text-muted-foreground',
              centered && 'mx-auto',
            )}
          >
            {description}
          </p>
        </RevealFade>
      )}
    </div>
  );
}