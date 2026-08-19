import { StoryHero } from '@/components/marketing/story/story-hero';
import { StoryIntro } from '@/components/marketing/story/story-intro';
import { StoryJourney } from '@/components/marketing/story/story-journey';
import { StoryManifesto } from '@/components/marketing/story/story-manifesto';
import { StoryCraft } from '@/components/marketing/story/story-craft';
import { StoryRoastery } from '@/components/marketing/story/story-roastery';
import { StoryFaq } from '@/components/marketing/story/story-faq';
import { StoryClosing } from '@/components/marketing/story/story-closing';

export const metadata = {
  title: 'Kisah Kami | Pinto Coffee',
  description:
    'Pinto lahir dari hasrat sederhana akan kopi hebat dan koneksi yang bermakna. Temukan bagaimana kami mencari, menyangrai, dan menyajikan.',
};

export default function StoryPage() {
  return (
    <>
      <StoryHero />
      <StoryIntro />
      <StoryJourney />
      <StoryManifesto />
      <StoryCraft />
      <StoryRoastery />
      <StoryFaq />
      <StoryClosing />
    </>
  );
}