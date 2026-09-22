import { StoryHero } from '@/components/marketing/story/story-hero';
import { StoryIntro } from '@/components/marketing/story/story-intro';
import { StoryJourney } from '@/components/marketing/story/story-journey';
import { StoryManifesto } from '@/components/marketing/story/story-manifesto';
import { StoryCraft } from '@/components/marketing/story/story-craft';
import { StoryRoastery } from '@/components/marketing/story/story-roastery';
import { StoryFaq } from '@/components/marketing/story/story-faq';
import { StoryClosing } from '@/components/marketing/story/story-closing';

export const metadata = {
  title: 'Kisah Kami',
  description:
    'Pinto lahir dari hasrat sederhana akan kopi hebat Nusantara dan ruang berkumpul yang bermakna di Bogor.',
  alternates: {
    canonical: '/story',
  },
  openGraph: {
    title: 'Kisah Kami | Pinto Kupi',
    description:
      'Pinto lahir dari hasrat sederhana akan kopi hebat Nusantara dan ruang berkumpul yang bermakna di Bogor.',
    url: '/story',
  },
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