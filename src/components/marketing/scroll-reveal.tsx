import type { CSSProperties } from 'react';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/**
 * Reveal CSS-only — animasi berjalan sekali saat mount dan selalu berakhir
 * terlihat. Tidak bergantung pada IntersectionObserver/scroll-trigger.
 */
export function ScrollReveal({
  children,
  delay = 0,
  y = 30,
  className = '',
}: ScrollRevealProps) {
  const style: CSSProperties = {
    animationDelay: `${delay}s`,
    ['--reveal-y' as string]: `${y}px`,
  };

  return (
    <div className={`reveal-fade ${className}`} style={style}>
      {children}
    </div>
  );
}
