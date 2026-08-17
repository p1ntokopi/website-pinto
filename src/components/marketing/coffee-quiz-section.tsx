import { getBeanSummaries } from '@/lib/coffee-data';
import { beanImage } from '@/config/images';
import { CoffeeQuiz } from './coffee-quiz';

export async function CoffeeQuizSection() {
  const beans = (await getBeanSummaries()).map((b) => ({
    ...b,
    image: beanImage(b.slug),
  }));

  return <CoffeeQuiz beans={beans} />;
}