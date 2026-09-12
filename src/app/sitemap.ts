import type { MetadataRoute } from 'next'
import { articles } from '@/content/writing'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const newest = new Date(Math.max(...articles.map((a) => new Date(a.date).getTime())))
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/drive`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/resume`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/writing`, lastModified: newest, changeFrequency: 'monthly', priority: 0.6 },
    ...articles.map((a) => ({ url: `${SITE_URL}/writing/${a.slug}`, lastModified: new Date(a.date), changeFrequency: 'yearly' as const, priority: 0.5 })),
  ]
}
