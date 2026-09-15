import { notFound } from 'next/navigation'
import { isLocale, LOCALES } from '@/lib/i18n'
import { getNavigation, getSiteSettings } from '@/sanity/lib/fetchers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export default async function LangLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()])

  return (
    <>
      <Header lang={lang} navigation={navigation} settings={settings} />
      <main id="main">{children}</main>
      <Footer lang={lang} navigation={navigation} settings={settings} />
    </>
  )
}
