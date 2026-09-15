import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { getAllRoutes } from '@/sanity/lib/fetchers'
import { absoluteUrl } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const routes = await getAllRoutes()

  const entries: MetadataRoute.Sitemap = LOCALES.map((lang) => ({
    url: absoluteUrl(`/${lang}`, siteUrl),
    changeFrequency: 'weekly',
    priority: 1,
  }))

  for (const route of routes) {
    for (const lang of LOCALES) {
      const slug = lang === 'vi' ? route.vi : route.en || route.vi
      if (!slug) continue
      entries.push({
        url: absoluteUrl(`/${lang}/${slug}`, siteUrl),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return entries
}
