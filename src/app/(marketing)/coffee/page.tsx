import { getCoffeeBeans } from '@/lib/shop';
import { CoffeeHero } from '@/components/marketing/coffee/coffee-hero';
import { CoffeeCatalogue } from '@/components/marketing/coffee/coffee-catalogue';
import { RoasteryStory } from '@/components/marketing/coffee/roastery-story';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Beli Kopi | P1NTO Coffee',
  description:
    'Biji kopi pilihan, disangrai dengan penuh perhatian dari roastery kami. Single origin dan house blend, siap Anda seduh di rumah.',
};

export default async function CoffeePage() {
  const beans = await getCoffeeBeans();

  return (
    <>
      <CoffeeHero />
      <CoffeeCatalogue beans={beans} />
      <RoasteryStory />
    </>
  );
}