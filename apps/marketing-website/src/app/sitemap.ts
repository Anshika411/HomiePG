import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/constants/site';
import { CITIES } from '@/constants/cities';

const staticRoutes = [
  '',
  '/search',
  '/cities',
  '/owners',
  '/pricing',
  '/blog',
  '/about',
  '/contact',
  '/how-it-works',
  '/faqs',
  '/safety',
  '/privacy',
  '/terms',
  '/refund',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.url;
  const now = new Date();

  const statics: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${base}/search?city=${city.name}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [...statics, ...cityRoutes];
}
