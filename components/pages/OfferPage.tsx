import { t, INTL_LOCALES, type Locale } from '@/lib/i18n'
import type { SanityDoc } from '@/sanity/lib/fetchers'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'
import { CTA_BAND_BUTTON_CLASSES } from '@/components/ui/Button'

/**
 * `validFrom`/`validTo` là kiểu `date` của Sanity — chuỗi `YYYY-MM-DD`, không
 * có giờ và không có múi giờ. `new Date('2026-09-01')` được ECMAScript hiểu là
 * NỬA ĐÊM UTC, nên ở múi giờ âm ngày sẽ lùi một hôm khi định dạng theo giờ
 * địa phương. Dựng bằng ba số nguyên để ngày hiển thị luôn đúng ngày biên tập
 * viên đã nhập, ở mọi máy chủ.
 */
function parseDateOnly(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatDate(date: Date, lang: Locale): string {
  return date.toLocaleDateString(INTL_LOCALES[lang], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function OfferPage({ doc, lang }: { doc: SanityDoc; lang: Locale }) {
  const offerTitle = t<string>(doc.title as any, lang) ?? ''
  const priceNote = t<string>(doc.priceNote as any, lang)
  const excerpt = t<string>(doc.excerpt as any, lang)

  const from = parseDateOnly(doc.validFrom)
  const to = parseDateOnly(doc.validTo)
  // Chương trình diễn ra đúng một ngày (buffet lễ) thì in MỘT ngày, không in
  // "01/09/2026 – 01/09/2026".
  const sameDay = from && to && from.getTime() === to.getTime()

  return (
    <article>
      {/* Không phải `.rhl-hero`: ảnh của mỗi chương trình là ẤN PHẨM vuông có
          chữ in sẵn (giá, ngày, hotline). Trải nó làm nền hero toàn màn hình
          sẽ cắt mất đúng phần chữ đó. Tiêu đề đứng trên dải kem đậm, ảnh
          xuống dưới và được hiện TRỌN VẸN. */}
      <header className="bg-cream-alt py-14 lg:py-20">
        <Container size="narrow">
          <span aria-hidden="true" className="bg-gold mb-6 block h-0.5 w-16" />
          <h1 className="font-display text-[clamp(1.75rem,5vw,3rem)] tracking-wide">
            {offerTitle}
          </h1>

          {(priceNote || from) && (
            <p className="text-gold-text mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-[0.18em] uppercase">
              {priceNote && <span>{priceNote}</span>}
              {priceNote && from && (
                <span aria-hidden="true" className="text-muted">
                  ·
                </span>
              )}
              {from && (
                <span>
                  <time dateTime={doc.validFrom as string}>{formatDate(from, lang)}</time>
                  {to && !sameDay && (
                    <>
                      {' – '}
                      <time dateTime={doc.validTo as string}>{formatDate(to, lang)}</time>
                    </>
                  )}
                </span>
              )}
            </p>
          )}

          {excerpt && (
            <p className="text-body mt-7 max-w-prose text-lg leading-relaxed">{excerpt}</p>
          )}
        </Container>
      </header>

      <div className="bg-cream py-12 lg:py-16">
        <Container size="narrow">
          {doc.image != null && (
            <SanityImage
              image={doc.image}
              lang={lang}
              sizes="(max-width: 768px) 100vw, 672px"
              priority
              fallbackAlt={offerTitle}
              // `h-auto` + không `object-cover`: ảnh giữ đúng tỉ lệ gốc. Cắt
              // một ấn phẩm quảng cáo vào khung 4:3 là cắt mất giá và ngày in
              // trên đó.
              className="shadow-card mx-auto h-auto w-full max-w-2xl"
            />
          )}

          <div className="mt-12 max-w-prose">
            <RichText value={doc.body} lang={lang} />
          </div>

          {doc.cta != null && (
            <SmartLink link={doc.cta} lang={lang} className={CTA_BAND_BUTTON_CLASSES} />
          )}
        </Container>
      </div>
    </article>
  )
}
