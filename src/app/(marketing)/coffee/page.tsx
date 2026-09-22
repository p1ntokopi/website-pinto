import { getCoffeeBeans } from '@/lib/shop';
import { CoffeeHero } from '@/components/marketing/coffee/coffee-hero';
import { CoffeeCatalogue } from '@/components/marketing/coffee/coffee-catalogue';
import { RoasteryStory } from '@/components/marketing/coffee/roastery-story';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Beli Biji Kopi Sangrai Segar',
  description:
    'Biji kopi pilihan Nusantara, disangrai in-house dari roastery Pinto Kupi Bogor. Single origin dan house blend segar siap seduh di rumah.',
  alternates: {
    canonical: '/coffee',
  },
  openGraph: {
    title: 'Beli Biji Kopi Sangrai Segar | Pinto Kupi',
    description:
      'Biji kopi pilihan Nusantara, disangrai in-house dari roastery Pinto Kupi Bogor. Single origin dan house blend segar siap seduh di rumah.',
    url: '/coffee',
  },
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