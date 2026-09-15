import type { MetadataRoute } from 'next'
import { siteUrl as getSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/studio', '/api'] }],
    sitemap: `${siteUrl.replace(/\/+$/, '')}/sitemap.xml`,
  }
}
