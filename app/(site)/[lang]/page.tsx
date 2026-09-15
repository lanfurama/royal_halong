import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { buildMetadata } from '@/lib/seo'
import { getHome, getSiteSettings } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { SiteChrome } from '@/components/layout/SiteChrome'

export async function generateMetadata({ params }: PageProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const [home, settings] = await Promise.all([getHome(), getSiteSettings()])
  return buildMetadata({ doc: home, lang, settings })
}

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [home, settings] = await Promise.all([getHome(), getSiteSettings()])
  if (!home) notFound()

  const widgetId = (settings as any)?.secureBookingsWidgetId as string | undefined

  return (
    // Trang chủ không có `slug` (route luôn là `/${lang}`, không phải
    // `/${lang}/<slug>`) -> truyền `slug={null}` tường minh (không phải bỏ
    // qua) để `LangSwitcher` đi nhánh suy-từ-slug thay vì fallback hoán
    // prefix — kết quả giống nhau (`/${locale}`) nhưng nhất quán với mọi
    // trang khác, không phụ thuộc `usePathname()`.
    <SiteChrome lang={lang} slug={null}>
      <SectionRenderer
        sections={(home.sections as unknown[]) ?? []}
        lang={lang}
        widgetId={widgetId}
        siteSettings={settings}
      />
    </SiteChrome>
  )
}
