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
    <section className="on-dark relative overflow-hidden py-20 lg:py-28">
      {background && (
        <div className="absolute inset-0 -z-10">
          <SanityImage
            image={background}
            lang={lang}
            sizes="100vw"
            decorative
            className="h-full w-full object-cover"
          />
          {/* `.scrim-band` — công thức riêng cho dải CTA, khác ba scrim kia vì
              chữ ở đây canh vào GIỮA khung chứ không nằm sát đáy. Chi tiết
              số đo và cách tính alpha ở ngay khối `.scrim-band` trong
              `app/globals.css`. */}
          <div className="scrim-band absolute inset-0" />
        </div>
      )}
      <Container className="relative text-center text-white">
        <span aria-hidden="true" className="bg-gold mx-auto mb-6 block h-px w-12" />
        {heading && (
          <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)]">
            {t<string>(heading, lang)}
          </h2>
        )}
        {description && <p className="mx-auto mt-3 max-w-xl">{t<string>(description, lang)}</p>}
        {cta && (
          <SmartLink link={cta} lang={lang} className={CTA_BAND_BUTTON_CLASSES} />
        )}
      </Container>
    </section>
  )
}
