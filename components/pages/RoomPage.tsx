import { t, type Locale } from '@/lib/i18n'
import { getReservationSlug, type SanityDoc } from '@/sanity/lib/fetchers'
import { hrefFor } from '@/lib/routes'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ui } from '@/lib/ui-strings'

export async function RoomPage({ doc, lang }: { doc: SanityDoc; lang: Locale }) {
  const roomTitle = t<string>(doc.title as any, lang)
  // Trước đây hardcode `/${lang}/reservation` — gãy ngay khi trang "Đặt
  // phòng" đổi slug hoặc có slug EN riêng khác slug vi (hreflang sẽ trỏ khác
  // với nút này). Suy ra từ Sanity qua `_id` tất định `page.reservation`
  // (xem `RESERVATION_SLUG_QUERY`), cùng cách `resolveSlug`/`hrefFor` đã
  // dùng cho mọi link nội bộ khác trong dự án. `reservationSlug` null (doc bị
  // xoá/đổi `_id`) -> `hrefFor` tự rơi về `/${lang}` — fallback an toàn hơn
  // hardcode một slug có thể đã đổi, dù không lý tưởng bằng có slug thật.
  const reservationSlug = await getReservationSlug()
  const reservationHref = reservationSlug ? hrefFor(lang, reservationSlug) : `/${lang}/reservation`

  return (
    <>
      {/* `rhl-hero` + `on-dark`: header trôi hẳn lên ảnh này (xem
          `app/globals.css`). Class tự thêm `padding-top` bằng chiều cao
          header, nên tiêu đề nằm giữa phần NHÌN THẤY chứ không bị header ăn
          mất một nửa lề trên — với `items-center` đó là khác biệt thấy rõ.
          `on-dark` để viền focus đổi sang `gold-hi`, đọc được trên nền tối. */}
      <section className="rhl-hero on-dark relative flex min-h-[55vh] items-center">
        {doc.heroImage != null && (
          <div className="absolute inset-0 -z-10">
            <SanityImage
              image={doc.heroImage}
              lang={lang}
              sizes="100vw"
              priority
              decorative
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>
        )}
        <Container className="relative py-20 text-center text-white">
          <h1 className="font-display text-3xl tracking-wide md:text-5xl">{roomTitle}</h1>
          <p className="mt-3 text-xs tracking-[0.2em] uppercase">
            {[
              doc.areaSqm ? `${doc.areaSqm} m²` : null,
              t<string>(doc.view as any, lang),
              t<string>(doc.capacity as any, lang),
            ]
              .filter(Boolean)
              .join(' | ')}
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
            <div>
              <RichText value={doc.description} lang={lang} />
              <Button href={reservationHref} className="mt-6">
                {ui('bookNow', lang)}
              </Button>
            </div>

            {Array.isArray(doc.features) && doc.features.length > 0 && (
              <div className="bg-cream-soft shadow-card p-6">
                {/* 20px trong khối phụ (aside) cạnh h1 lớn — giữ cỡ chữ nhỏ để không
                    lấn tiêu đề trang, đổi màu sang gold-text (5.32:1 trên trắng) thay
                    vì tăng lên 24px. */}
                <h2 className="font-display text-gold-text mb-4 text-xl">{ui('roomAmenities', lang)}</h2>
                <ul className="space-y-3">
                  {(doc.features as any[]).map((feature: any, index: number) => (
                    <li key={feature._key ?? index} className="flex items-center gap-3 text-sm">
                      {feature.icon && (
                        <SanityImage
                          image={feature.icon}
                          lang={lang}
                          sizes="24px"
                          decorative
                          className="h-6 w-6 shrink-0 object-contain"
                        />
                      )}
                      <span>{t<string>(feature.label, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Container>
      </section>

      {Array.isArray(doc.gallery) && doc.gallery.length > 0 && (
        <section className="bg-cream-alt py-16">
          <Container size="wide">
            <h2 className="font-display mb-8 text-center text-3xl">{ui('roomPhotos', lang)}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(doc.gallery as any[]).map((image: any, index: number) => (
                <Reveal key={image._key ?? index} delay={index * 60}>
                  <SanityImage
                    image={image}
                    lang={lang}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    // Vẫn dùng tên phòng làm gốc (dữ liệu liền kề duy nhất có ý
                    // nghĩa), nhưng thêm số thứ tự để mỗi ảnh trong lưới có alt
                    // riêng biệt thay vì N ảnh cùng đọc một câu giống hệt nhau.
                    fallbackAlt={roomTitle ? `${roomTitle} — ảnh ${index + 1}` : undefined}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
