import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { buildMetadata } from '@/lib/seo'
import { getHome, getSiteSettings } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { TestimonialsBlock } from '@/components/sections/TestimonialsBlock'
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

  // Cảm nhận khách nằm ở TRƯỜNG RIÊNG `testimonials`, không nằm trong
  // `sections[]`, nên `SectionRenderer` không thể tự chèn. Bản gốc đặt khối
  // này NGAY SAU khối 4 thẻ và TRƯỚC bản đồ — tách mảng section tại đúng chỗ
  // đó thay vì dán khối xuống cuối trang. Không có cardGridSection (các trang
  // dữ liệu khác) thì rơi về "chèn cuối", không mất khối.
  const sections = (home.sections as any[]) ?? []
  const gridAt = sections.findIndex((s) => s?._type === 'cardGridSection')
  const splitAt = gridAt === -1 ? sections.length : gridAt + 1

  return (
    // Trang chủ không có `slug` (route luôn là `/${lang}`, không phải
    // `/${lang}/<slug>`) -> truyền `slug={null}` tường minh (không phải bỏ
    // qua) để `LangSwitcher` đi nhánh suy-từ-slug thay vì fallback hoán
    // prefix — kết quả giống nhau (`/${locale}`) nhưng nhất quán với mọi
    // trang khác, không phụ thuộc `usePathname()`.
    <SiteChrome lang={lang} slug={null}>
      <SectionRenderer
        sections={sections.slice(0, splitAt)}
        lang={lang}
        widgetId={widgetId}
        siteSettings={settings}
        currentSlug=""
      />
      <TestimonialsBlock testimonials={home.testimonials as unknown[]} lang={lang} />
      <SectionRenderer
        sections={sections.slice(splitAt)}
        lang={lang}
        widgetId={widgetId}
        siteSettings={settings}
        currentSlug=""
      />
    </SiteChrome>
  )
}
