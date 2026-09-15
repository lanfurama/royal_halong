import Script from 'next/script'
import { notFound } from 'next/navigation'
import { isLocale, LOCALES } from '@/lib/i18n'
import { getNavigation, getSiteSettings } from '@/sanity/lib/fetchers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildHotelJsonLd } from '@/lib/seo'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export default async function LangLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()])
  const hotelJsonLd = buildHotelJsonLd({ settings, lang })

  return (
    <>
      {/* `lang` ở đây tĩnh (đúng route đã generateStaticParams), không phải
          API động — script chỉ sửa DOM bằng giá trị đã biết trước khi build.
          `beforeInteractive` đảm bảo chạy trước khi trang tương tác được, nên
          không có khung hình nào hiển thị sai `lang`. Xem lý do đầy đủ ở
          app/layout.tsx. */}
      <Script id="set-html-lang" strategy="beforeInteractive">
        {`document.documentElement.lang=${JSON.stringify(lang)};`}
      </Script>
      <JsonLd data={hotelJsonLd} />
      <Header lang={lang} navigation={navigation} settings={settings} />
      <main id="main">{children}</main>
      <Footer lang={lang} navigation={navigation} settings={settings} />
    </>
  )
}
