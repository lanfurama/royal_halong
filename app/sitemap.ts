import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { resolveRouteSlug } from '@/lib/routes'
import { getAllRoutes } from '@/sanity/lib/fetchers'
import { absoluteUrl } from '@/lib/seo'
import { siteUrl as getSiteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const routes = await getAllRoutes()

  const entries: MetadataRoute.Sitemap = LOCALES.map((lang) => ({
    url: absoluteUrl(`/${lang}`, siteUrl),
    changeFrequency: 'weekly',
    priority: 1,
  }))

  for (const route of routes) {
    for (const lang of LOCALES) {
      // Cùng chuỗi fallback với `t()`/`resolveSlug` (<locale> -> en -> vi).
      // Trước đây là `lang === 'vi' ? route.vi : route.en || route.vi` — một
      // biểu thức chỉ đúng khi site có đúng hai ngôn ngữ.
      const slug = resolveRouteSlug(route, lang)
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
