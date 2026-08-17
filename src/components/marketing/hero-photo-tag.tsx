'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface HeroPhotoTagProps {
  number: string;
  label: string;
}

export function HeroPhotoTag({ number, label }: HeroPhotoTagProps) {
  const tagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.matchMedia();
    
    ctx.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        tagRef.current,
        { rotation: -14, opacity: 0, scale: 0.8 },
        { 
          rotation: -6, 
          opacity: 1, 
          scale: 1, 
          duration: 1.2, 
          ease: 'power3.out',
          delay: 0.8 // Delays after the main sequence
        }
      );
    });

    ctx.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(tagRef.current, { rotation: -6, opacity: 1, scale: 1 });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={tagRef}
      className="bg-paper text-ink border border-border shadow-xl p-5 md:p-7 flex flex-col items-center justify-center origin-top z-20 opacity-0"
    >
      <div className="w-3 h-3 rounded-full bg-ink/10 mb-3 border border-ink/20 shadow-inner" />
      <span className="font-display text-5xl md:text-6xl font-bold leading-none mb-2 text-ink">{number}</span>
      <span className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
    </div>
  );
}
