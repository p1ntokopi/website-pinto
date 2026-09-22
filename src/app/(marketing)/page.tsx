import { HeroSection } from '@/components/marketing/hero-section';
import { BrandValuesSection } from '@/components/marketing/brand-values-section';
import { SignatureMenuSection } from '@/components/marketing/signature-menu-section';
import { RoasterySection } from '@/components/marketing/roastery-section';
import { CoffeeQuizSection } from '@/components/marketing/coffee-quiz-section';
import { BeanToCupSection } from '@/components/marketing/bean-to-cup-section';
import { BrandStorySection } from '@/components/marketing/brand-story-section';
import { PintoSpaceSection } from '@/components/marketing/pinto-space-section';
import { TakeHomeSection } from '@/components/marketing/take-home-section';
import { AboutSection } from '@/components/marketing/about-section';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { FinalCtaSection } from '@/components/marketing/final-cta-section';
import { getApprovedTestimonials } from '@/lib/testimonials';

export const revalidate = 60;

export const metadata = {
  title: {
    absolute: 'Pinto Kupi — Roastery & Kafe di Bogor',
  },
  description:
    'Pinto Kupi — kafe dan roastery di Bogor. Biji kopi Nusantara pilihan, disangrai in-house, dan disajikan untuk setiap momen. Kunjungi kafe atau bawa pulang bijinya.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pinto Kupi — Roastery & Kafe di Bogor',
    description:
      'Pinto Kupi — kafe dan roastery di Bogor. Biji kopi Nusantara pilihan, disangrai in-house, dan disajikan untuk setiap momen.',
    url: '/',
  },
};

export default async function MarketingPage() {
  const testimonials = await getApprovedTestimonials();

  return (
    <>
      <HeroSection />
      <BrandValuesSection />
      <SignatureMenuSection />
      <RoasterySection />
      <CoffeeQuizSection />
      <BeanToCupSection />
      <BrandStorySection />
      <PintoSpaceSection />
      <TakeHomeSection />
      <AboutSection />
      <TestimonialsSection testimonials={testimonials} />
      <FinalCtaSection />
    </>
  );
}