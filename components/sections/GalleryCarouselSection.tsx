'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { urlFor } from '@/sanity/lib/image'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

export function GalleryCarouselSection({ heading, album, lang }: any & { lang: Locale }) {
  const images: any[] = album?.images ?? []
  const albumTitle = t<string>(album?.title, lang)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', containScroll: 'trimSnaps' })
  const [openAt, setOpenAt] = useState<number | null>(null)
  const [selected, setSelected] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Chấm chỉ vị trí: không có nó, người dùng ở 390px chỉ thấy 1,2 ảnh và
  // không biết dải này dài bao nhiêu — đo được 18 ảnh trong khung 327px, tức
  // 94% nội dung nằm ngoài tầm mắt mà không có dấu hiệu nào báo.
  useEffect(() => {
    if (!emblaApi) return
    const sync = () => {
      setSelected(emblaApi.selectedScrollSnap())
      setSnapCount(emblaApi.scrollSnapList().length)
    }
    sync()
    emblaApi.on('select', sync).on('reInit', sync)
    return () => {
      emblaApi.off('select', sync).off('reInit', sync)
    }
  }, [emblaApi])

  if (images.length === 0) return null

  // `shrink-0` là bắt buộc, không phải thừa: hai nút này là con của một hàng
  // `flex` chung với dải chấm chỉ vị trí. Ở 390px dải chấm (18 chấm) đòi
  // nhiều chỗ hơn phần còn lại, flex bèn co hai nút — đo được **21×44px**,
  // tức đúng nửa ngưỡng theo chiều ngang, dù class đã ghi `size-11`.
  const controlClasses =
    'flex size-11 shrink-0 items-center justify-center rounded-pill border border-line bg-cream-soft text-gold-text transition-colors hover:bg-cream disabled:opacity-40'

  // Neo cuộn để một mục lục album (`cardGridSection` ở đầu /our-gallery) nhảy
  // thẳng xuống đúng dải ảnh. Suy từ `album._id` — projection của section chỉ
  // mở `album->{_id, title, images}` (xem SECTIONS trong queries.ts), không có
  // `slug`, và thêm field mới vào schema chỉ để lấy một cái id là thừa.
  // `scroll-margin-top` cho `section` đã khai toàn cục trong globals.css nên
  // neo không chui xuống dưới header `fixed`.
  const albumId: string | undefined = album?._id
  const anchorId = albumId ? `album-${albumId.replace(/^galleryAlbum\./, '')}` : undefined

  return (
    <section id={anchorId} className="bg-cream-alt py-16 lg:py-24">
      <Container size="wide">
        <SectionHeading heading={heading ?? album?.title} lang={lang} />
      </Container>

      {/* Dải ảnh tràn ra sát mép màn hình (chỉ chừa lề trái) thay vì bị bó
          trong Container: ảnh bị cắt ở mép phải là tín hiệu "còn nữa, vuốt
          đi" rõ hơn mọi mũi tên — và đúng với bản gốc, nơi dải ảnh chạy hết
          bề ngang. Lề trái vẫn khớp Container để thẳng hàng với tiêu đề. */}
      <div className="pl-5 sm:pl-6 lg:pl-10">
        <div
          className="overflow-hidden"
          ref={emblaRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={albumTitle ?? 'Thư viện ảnh'}
          // Mũi tên trái/phải điều khiển carousel khi nó đang được focus.
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') scrollPrev()
            if (event.key === 'ArrowRight') scrollNext()
          }}
        >
          <div className="flex gap-3 lg:gap-4">
            {images.map((image, index) => (
              <button
                key={image._key ?? index}
                type="button"
                onClick={() => setOpenAt(index)}
                className="group min-w-0 shrink-0 basis-[78%] overflow-hidden rounded-card sm:basis-[46%] lg:basis-[31%] xl:basis-[23%]"
              >
                <span className="sr-only">{`${ui('zoomImage', lang)} ${index + 1}`}</span>
                {/* Tên truy cập của nút đã có từ span sr-only ở trên. Accessible
                    name của <button> nối cả text con lẫn alt của <img> bên trong
                    nó — để ảnh có alt riêng ở đây sẽ đọc thành "Phóng to ảnh N"
                    + toàn bộ mô tả ảnh, lặp lại thừa. Mô tả đầy đủ đã có ở
                    lightbox (ảnh phóng to, nơi nó thực sự cần thiết) nên ảnh
                    thumbnail này đặt decorative. */}
                <SanityImage
                  image={image}
                  lang={lang}
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 25vw"
                  decorative
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <Container size="wide" className="mt-6 flex items-center justify-center gap-4">
        <button type="button" onClick={scrollPrev} className={controlClasses}>
          <span className="sr-only">{ui('prevImage', lang)}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Album thật có 18 ảnh -> 18 chấm ở 390px thành một dải lấm tấm vô
            nghĩa, không đọc được vị trí. Trên 8 mốc thì bộ đếm "n / N" nói
            đúng thứ cần biết trong ít chỗ hơn. `aria-live` để người dùng
            screen reader cũng theo dõi được vị trí khi bấm mũi tên. */}
        {snapCount > 8 ? (
          <p
            aria-live="polite"
            className="text-gold-text min-w-16 text-center text-sm tabular-nums"
          >
            <span className="font-semibold">{selected + 1}</span>
            <span className="text-body"> / {snapCount}</span>
          </p>
        ) : (
          snapCount > 1 && (
            <ol className="flex items-center gap-2" aria-hidden="true">
              {Array.from({ length: snapCount }).map((_, index) => (
                <li
                  key={index}
                  className={`h-1.5 rounded-pill transition-all duration-300 ${
                    index === selected ? 'bg-gold w-6' : 'bg-line w-1.5'
                  }`}
                />
              ))}
            </ol>
          )
        )}

        <button type="button" onClick={scrollNext} className={controlClasses}>
          <span className="sr-only">{ui('nextImage', lang)}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </Container>

      <Lightbox
        open={openAt !== null}
        index={openAt ?? 0}
        close={() => setOpenAt(null)}
        slides={images.map((image) => ({
          src: urlFor(image).width(1800).url(),
          alt: t<string>(image.alt, lang) ?? albumTitle ?? '',
        }))}
      />
    </section>
  )
}
