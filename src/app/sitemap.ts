import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const routes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/cafe', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/coffee', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/menu', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/story', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/locations', priority: 0.8, changeFrequency: 'weekly' },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
