import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { CTA_BAND_BUTTON_CLASSES } from '@/components/ui/Button'

export function CtaBandSection({
  heading,
  description,
  background,
  cta,
  lang,
}: any & { lang: Locale }) {
  return (
    <section className="relative py-24">
      {background && (
        <div className="absolute inset-0 -z-10">
          <SanityImage
            image={background}
            lang={lang}
            sizes="100vw"
            decorative
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
      <Container className="relative text-center text-white">
        {heading && <h2 className="font-display text-3xl">{t<string>(heading, lang)}</h2>}
        {description && <p className="mx-auto mt-3 max-w-xl">{t<string>(description, lang)}</p>}
        {cta && (
          <SmartLink link={cta} lang={lang} className={CTA_BAND_BUTTON_CLASSES} />
        )}
      </Container>
    </section>
  )
}
