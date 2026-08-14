import { HeroSection } from '@/components/marketing/hero-section';
import { BrandValuesSection } from '@/components/marketing/brand-values-section';
import { SignatureMenuSection } from '@/components/marketing/signature-menu-section';
import { BrandStorySection } from '@/components/marketing/brand-story-section';
import { PromotionalSection } from '@/components/marketing/promotional-section';
import { GallerySection } from '@/components/marketing/gallery-section';
import { LocationSection } from '@/components/marketing/location-section';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { FinalCtaSection } from '@/components/marketing/final-cta-section';

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <BrandValuesSection />
      <SignatureMenuSection />
      <BrandStorySection />
      <PromotionalSection />
      <GallerySection />
      <LocationSection />
      <TestimonialsSection />
      <FinalCtaSection />
    </>
  );
}
