import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { HeroPhotoTag } from './hero-photo-tag';
import { HeroAnimations } from './hero-animations';

const COPY = {
  eyebrow: "P1NTO COFFEE",
  headlineLine1: "FROM OUR BAR",
  headlineLine2: {
    normal: "TO YOUR ",
    highlight: "HOME.",
    after: ""
  },
  sub: "Carefully sourced, thoughtfully roasted, and served one cup at a time.",
  ctaPrimary: {
    label: "Shop Coffee",
    href: "/coffee"
  },
  ctaSecondary: {
    label: "Visit P1NTO",
    href: "#location"
  },
  tag: {
    number: "EST",
    label: "2024"
  }
};

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[100vh] bg-paper overflow-hidden flex flex-col xl:flex-row">
      <HeroAnimations />
      
      {/* LEFT: Text Content */}
      <div className="w-full xl:w-[45%] flex flex-col justify-center px-6 md:px-12 lg:px-20 py-16 xl:py-0 order-2 xl:order-1 z-10 mt-auto xl:mt-0 pb-24 xl:pb-0">
        <div className="max-w-2xl">
          <p className="gsap-reveal text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-6 opacity-0">
            {COPY.eyebrow}
          </p>
          
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] tracking-tight text-ink leading-[1.1] mb-8">
            <span className="gsap-reveal block opacity-0">
              {COPY.headlineLine1}
            </span>
            <span className="gsap-reveal block opacity-0 mt-1 md:mt-2">
              {COPY.headlineLine2.normal}
              <i className="text-primary italic font-medium">{COPY.headlineLine2.highlight}</i>
              {COPY.headlineLine2.after}
            </span>
          </h1>
          
          <p className="gsap-reveal text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 opacity-0 max-w-xl">
            {COPY.sub}
          </p>
          
          <div className="gsap-reveal flex flex-col sm:flex-row gap-4 opacity-0">
            <Link href={COPY.ctaPrimary.href} className={buttonVariants({ size: "lg", className: "rounded-full h-14 px-8 text-lg w-full sm:w-auto hover:scale-105 transition-transform duration-300" })}>
              {COPY.ctaPrimary.label}
            </Link>
            <Link href={COPY.ctaSecondary.href} className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full h-14 px-8 text-lg w-full sm:w-auto border-border bg-transparent hover:bg-ink/5 text-ink hover:scale-105 transition-transform duration-300" })}>
              {COPY.ctaSecondary.label}
            </Link>
          </div>
        </div>
      </div>
      
      {/* RIGHT: Photo */}
      <div className="w-full xl:w-[55%] h-[45vh] md:h-[50vh] xl:h-[100vh] relative order-1 xl:order-2 overflow-visible bg-warm/20">
        <div className="gsap-photo-inner absolute inset-0 w-full h-full opacity-0 origin-center">
          {/* PLACEHOLDER GRADIENT */}
          <div className="absolute inset-0 bg-gradient-to-br from-warm/40 to-ink/20" />
          
          {/* 
            TODO: Ganti atribut hidden di className ketika gambar asli sudah ada.
            Jangan lupa sesuaikan src gambar.
          */}
          <Image 
            src="/hero-placeholder.jpg" 
            alt="Suasana hangat P1NTO Coffee di sore hari" 
            fill
            className="object-cover object-center hidden" 
            priority
          />
        </div>
        
        {/* Kraft Tag Signature Element */}
        <HeroPhotoTag number={COPY.tag.number} label={COPY.tag.label} />
      </div>
    </section>
  );
}
