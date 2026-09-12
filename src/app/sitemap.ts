import type { MetadataRoute } from 'next'
import { articles } from '@/content/writing'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/drive`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/resume`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...articles.map((a) => ({ url: `${SITE_URL}/writing/${a.slug}`, lastModified: new Date(a.date), changeFrequency: 'yearly' as const, priority: 0.5 })),
  ]
}
