'use client'

import { useState } from 'react'
import Link from 'next/link'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { urlFor } from '@/sanity/lib/image'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'

/**
 * Dải ảnh chạy ngang vô tận, đúng bản thiết kế.
 *
 * Khác `GalleryCarouselSection` (carousel Embla có nút bấm, dùng ở trang
 * `/our-gallery` và các trang con): ở trang chủ dải ảnh là một BĂNG TRANG
 * TRÍ tự chạy, không phải một công cụ duyệt ảnh. Vẫn bấm được để phóng to.
 *
 * Ba ràng buộc khiến bố cục dưới đây trông rườm hơn một `<div>` với
 * `animation`:
 *
 * 1. **Vòng lặp không thấy mối nối** cần nội dung được NHÂN ĐÔI và dịch đúng
 *    `-50%` (xem `@keyframes rhl-marquee` trong globals.css). Bản sao thứ
 *    hai là thuần trang trí -> `aria-hidden` + `tabIndex={-1}`, nếu không
 *    người dùng screen reader nghe 18 ảnh thành 36 và người dùng bàn phím
 *    phải Tab qua gấp đôi số nút.
 * 2. **Dừng khi rê chuột hoặc khi focus vào trong** — không dừng thì không
 *    ai bấm trúng một tấm đang trôi, và người dùng bàn phím focus vào một
 *    nút đang chạy ra khỏi màn hình.
 * 3. **`prefers-reduced-motion`** phải tắt hẳn animation VÀ trả lại khả năng
 *    cuộn tay (`.rhl-marquee-viewport`, xem globals.css) — dải đứng yên vẫn
 *    rộng hơn màn hình, không cuộn được thì mất phần lớn số ảnh.
 */
export function HomeGallery({
  heading,
  album,
  lang,
  viewAllHref,
}: {
  heading?: any
  album?: any
  lang: Locale
  /** Trang thư viện đầy đủ. `null` -> bỏ hẳn link "Xem toàn bộ". */
  viewAllHref?: string | null
}) {
  const images: any[] = album?.images ?? []
  const [openAt, setOpenAt] = useState<number | null>(null)

  if (images.length === 0) return null

  const title = t<string>(heading, lang) ?? t<string>(album?.title, lang) ?? ui('photoGallery', lang)

  const tile = 'relative h-[260px] w-[360px] shrink-0 overflow-hidden'

  return (
    <section id="gallery" className="py-6 pb-24">
      <Container size="wide" className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <h2 className="text-[clamp(1.625rem,2.4vw,2.25rem)]">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-gold-text hover:text-gold-deep inline-flex min-h-11 items-center gap-2 text-xs tracking-[0.1em] uppercase transition-colors"
          >
            {ui('viewAll', lang)}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </Container>

      <div className="rhl-marquee-viewport overflow-hidden">
        <div
          // `w-max` để dải rộng đúng bằng nội dung (không bị bó theo khung);
          // `hover:[animation-play-state:paused]` + `focus-within:` cho hai
          // cách dừng, chuột và bàn phím.
          className="rhl-marquee-track flex w-max gap-4 [animation:rhl-marquee_48s_linear_infinite] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
        >
          {images.map((image, index) => (
            <button
              key={image._key ?? index}
              type="button"
              onClick={() => setOpenAt(index)}
              className={`${tile} group`}
            >
              <span className="sr-only">{`${ui('zoomImage', lang)} ${index + 1}`}</span>
              {/* Tên truy cập của nút đã có từ span sr-only ở trên. Accessible
                  name của <button> nối cả text con lẫn alt của <img> bên trong,
                  nên để ảnh có alt riêng ở đây sẽ đọc thành "Phóng to ảnh N" +
                  toàn bộ mô tả ảnh. Mô tả đầy đủ đã có ở lightbox. */}
              <SanityImage
                image={image}
                lang={lang}
                sizes="360px"
                decorative
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </button>
          ))}

          {/* Bản sao để vòng lặp khép kín — xem ghi chú (1) ở đầu file. */}
          {images.map((image, index) => (
            <div key={`dup-${image._key ?? index}`} aria-hidden="true" className={tile}>
              <SanityImage
                image={image}
                lang={lang}
                sizes="360px"
                decorative
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <Lightbox
        open={openAt !== null}
        index={openAt ?? 0}
        close={() => setOpenAt(null)}
        slides={images.map((image) => ({
          src: urlFor(image).width(1800).url(),
          alt: t<string>(image.alt, lang) ?? title,
        }))}
      />
    </section>
  )
}
