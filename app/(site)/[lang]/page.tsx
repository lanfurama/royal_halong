import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { buildMetadata } from '@/lib/seo'
import { getHome, getSiteSettings } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

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
    <SectionRenderer
      sections={(home.sections as unknown[]) ?? []}
      lang={lang}
      widgetId={widgetId}
      siteSettings={settings}
    />
  )
}
