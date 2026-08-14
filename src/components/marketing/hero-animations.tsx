'use client';

import { useEffect } from 'react';
import gsap from 'gsap';

export function HeroAnimations() {
  useEffect(() => {
    const ctx = gsap.matchMedia();
    
    ctx.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline();
      
      // Stagger fade-up sequence (~0.12s delay between)
      tl.fromTo(
        '.gsap-reveal',
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.12, 
          ease: 'power3.out' 
        },
        0
      );

      // Photo scale-in
      tl.fromTo(
        '.gsap-photo-inner',
        { scale: 1.03, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
        0
      );
    });

    ctx.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set('.gsap-reveal', { y: 0, opacity: 1 });
      gsap.set('.gsap-photo-inner', { scale: 1, opacity: 1 });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
