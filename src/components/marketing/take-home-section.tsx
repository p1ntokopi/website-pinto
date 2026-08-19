import { getBeanSummaries } from '@/lib/coffee-data';
import { beanImage } from '@/config/images';
import { SectionHeader } from './section-header';
import { TakeHomeSlider } from './take-home-slider';

export async function TakeHomeSection() {
  const beans = (await getBeanSummaries()).map((b) => ({
    ...b,
    image: beanImage(b.slug),
  }));

  return (
    <section className="w-full border-t border-ink/5 bg-paper py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-14 md:mb-20">
          <SectionHeader
            eyebrow="Bring Pinto Home"
            lines={[
              'Kopi untuk',
              { text: 'rak dapur Anda.', italic: true },
            ]}
            description="Biji pilihan yang sama dengan di bar — disangrai segar, dikemas rapat, dan siap diseduh di rumah."
          />
        </div>
        <TakeHomeSlider beans={beans} />
      </div>
    </section>
  );
}