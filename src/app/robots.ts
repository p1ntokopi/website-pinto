import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/auth/', '/t/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
