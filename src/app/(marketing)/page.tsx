import { HeroSection } from '@/components/marketing/hero-section';
import { BrandValuesSection } from '@/components/marketing/brand-values-section';
import { SignatureMenuSection } from '@/components/marketing/signature-menu-section';
import { RoasterySection } from '@/components/marketing/roastery-section';
import { FindCoffeeSection } from '@/components/marketing/find-coffee-section';
import { BeanToCupSection } from '@/components/marketing/bean-to-cup-section';
import { BrandStorySection } from '@/components/marketing/brand-story-section';
import { PintoSpaceSection } from '@/components/marketing/pinto-space-section';
import { TakeHomeSection } from '@/components/marketing/take-home-section';
import { LocationSection } from '@/components/marketing/location-section';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { FinalCtaSection } from '@/components/marketing/final-cta-section';

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <BrandValuesSection />
      <SignatureMenuSection />
      <RoasterySection />
      <FindCoffeeSection />
      <BeanToCupSection />
      <BrandStorySection />
      <PintoSpaceSection />
      <TakeHomeSection />
      <LocationSection />
      <TestimonialsSection />
      <FinalCtaSection />
    </>
  );
}
