import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type HeadingLine = string | { text: string; italic?: boolean };

/**
 * Display headline dengan reveal per baris (mask + slide-up).
 *
 * Menggunakan animasi CSS yang berjalan sekali saat mount dan selalu berakhir
 * dalam keadaan terlihat (animation-fill-mode: both). Tidak bergantung pada
 * IntersectionObserver/scroll-trigger sehingga teks tidak akan pernah
 * tertahan dalam keadaan tersembunyi. prefers-reduced-motion ditangani oleh
 * override global di globals.css.
 */
export function RevealHeading({
  lines,
  className,
  as: Tag = 'h2',
  delay = 0,
  stagger = 0.14,
}: {
  lines: HeadingLine[];
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  delay?: number;
  stagger?: number;
}) {
  const renderLine = (line: HeadingLine, key: number) => {
    const text = typeof line === 'string' ? line : line.text;
    const italic = typeof line === 'string' ? false : line.italic;

    return (
      <span key={key} className="reveal-mask">
        <span
          className={cn('reveal-line', italic && 'italic')}
          style={{ animationDelay: `${delay + key * stagger}s` }}
        >
          {text}
        </span>
      </span>
    );
  };

  return <Tag className={className}>{lines.map(renderLine)}</Tag>;
}

/** Reveal halus untuk paragraf / konten pendukung — CSS-only, selalu berakhir terlihat. */
export function RevealFade({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const style: CSSProperties = {
    animationDelay: `${delay}s`,
    ['--reveal-y' as string]: `${y}px`,
  };

  return (
    <div className={cn('reveal-fade', className)} style={style}>
      {children}
    </div>
  );
}
