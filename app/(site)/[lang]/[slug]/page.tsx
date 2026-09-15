import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { buildMetadata } from '@/lib/seo'
import { getAllRoutes, getDocBySlug, getSiteSettings } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { RoomPage } from '@/components/pages/RoomPage'
import { PostPage } from '@/components/pages/PostPage'
import { OfferPage } from '@/components/pages/OfferPage'
import { SiteChrome } from '@/components/layout/SiteChrome'

export async function generateMetadata({ params }: PageProps<'/[lang]/[slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  const [doc, settings] = await Promise.all([getDocBySlug(slug), getSiteSettings()])
  return buildMetadata({ doc, lang, settings })
}

export async function generateStaticParams() {
  const routes = await getAllRoutes()
  const params: { lang: string; slug: string }[] = []
  for (const route of routes) {
    if (route.vi) params.push({ lang: 'vi', slug: route.vi })
    params.push({ lang: 'en', slug: route.en || route.vi })
  }
  // cacheComponents bắt buộc trả ít nhất một param.
  if (params.length === 0) {
    throw new Error(
      'Sanity chưa có document nào có slug. Chạy `pnpm run import:all` (Plan B) trước khi build.',
    )
  }
  return params
}

export default async function DynamicPage({ params }: PageProps<'/[lang]/[slug]'>) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()

  const [doc, settings] = await Promise.all([getDocBySlug(slug), getSiteSettings()])
  if (!doc) notFound()

  // `doc.slug` (song ngữ) truyền xuống `SiteChrome` -> `Header` ->
  // `LangSwitcher`, để nút chuyển ngôn ngữ suy đúng slug riêng từng locale
  // (giống hệt cách `buildMetadata` sinh `hreflang`) thay vì hoán prefix mù —
  // xem `components/layout/SiteChrome.tsx` và Fix c9-8.
  const slugField = doc.slug as any

  switch (doc._type) {
    case 'room':
      return (
        <SiteChrome lang={lang} slug={slugField}>
          <RoomPage doc={doc} lang={lang} />
        </SiteChrome>
      )
    case 'post':
      return (
        <SiteChrome lang={lang} slug={slugField}>
          <PostPage doc={doc} lang={lang} />
        </SiteChrome>
      )
    case 'offer':
      return (
        <SiteChrome lang={lang} slug={slugField}>
          <OfferPage doc={doc} lang={lang} />
        </SiteChrome>
      )
    default: {
      const widgetId = (settings as any)?.secureBookingsWidgetId as string | undefined
      return (
        <SiteChrome lang={lang} slug={slugField}>
          <SectionRenderer
            sections={(doc.sections as unknown[]) ?? []}
            lang={lang}
            widgetId={widgetId}
            siteSettings={settings}
          />
        </SiteChrome>
      )
    }
  }
}
