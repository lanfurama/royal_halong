import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { CTA_BAND_BUTTON_CLASSES } from '@/components/ui/Button'

// Nút phụ: viền vàng sáng trên ảnh tối. Cùng hình dáng và nhịp chữ với
// `CTA_BAND_BUTTON_CLASSES`, chỉ khác nền — hai nút đứng cạnh nhau phải cao
// bằng nhau, nên phần `min-h-11 px-8 py-3` là chép đúng chứ không phải tình cờ.
const CTA_BAND_SECONDARY_CLASSES =
  'text-sm font-semibold tracking-wide uppercase transition-colors inline-flex min-h-11 items-center justify-center rounded-pill border border-gold-hi text-gold-hi hover:bg-gold-hi/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-hi mt-8 px-8 py-3'

export function CtaBandSection({
  heading,
  description,
  background,
  cta,
  secondaryCta,
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
        {/* `justify-center` trên hàng flex thay cho một nút đứng một mình:
            với một nút kết quả y hệt bản cũ (`text-center` của cha đã canh
            giữa), với hai nút thì chúng xuống dòng cùng nhau ở khổ hẹp thay
            vì cái nọ lệch khỏi cái kia. */}
        <div className="flex flex-wrap justify-center gap-3.5">
          {cta && <SmartLink link={cta} lang={lang} className={CTA_BAND_BUTTON_CLASSES} />}
          {secondaryCta && (
            <SmartLink link={secondaryCta} lang={lang} className={CTA_BAND_SECONDARY_CLASSES} />
          )}
        </div>
      </Container>
    </section>
  )
}
