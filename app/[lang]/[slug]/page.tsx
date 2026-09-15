import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { getAllRoutes, getDocBySlug, getSiteSettings } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { RoomPage } from '@/components/pages/RoomPage'
import { PostPage } from '@/components/pages/PostPage'
import { OfferPage } from '@/components/pages/OfferPage'

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

  switch (doc._type) {
    case 'room':
      return <RoomPage doc={doc} lang={lang} />
    case 'post':
      return <PostPage doc={doc} lang={lang} />
    case 'offer':
      return <OfferPage doc={doc} lang={lang} />
    default: {
      const widgetId = (settings as any)?.secureBookingsWidgetId as string | undefined
      return (
        <SectionRenderer sections={(doc.sections as unknown[]) ?? []} lang={lang} widgetId={widgetId} />
      )
    }
  }
}
