import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { getHome } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const home = await getHome()
  if (!home) notFound()

  return <SectionRenderer sections={home.sections ?? []} lang={lang} />
}
