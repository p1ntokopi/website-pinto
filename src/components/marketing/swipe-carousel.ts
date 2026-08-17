'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Pantau slide aktif pada scroller horizontal snap (berbasis posisi tengah viewport). */
export function useActiveSlide() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    el.querySelectorAll<HTMLElement>('[data-slide]').forEach((slide, i) => {
      const s = slide.getBoundingClientRect();
      const dist = Math.abs(s.left + s.width / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => requestAnimationFrame(handleScroll);
    el.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();
    const onResize = () => requestAnimationFrame(handleScroll);
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [handleScroll]);

  return { scrollerRef, active };
}

/** Scroll ke slide tertentu (smooth kecuali reduced-motion). */
export function useScrollToSlide(reduced: boolean | null) {
  const go = (el: HTMLDivElement | null, index: number) => {
    if (!el) return;
    el.querySelectorAll<HTMLElement>('[data-slide]')[index]?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };
  return go;
}
