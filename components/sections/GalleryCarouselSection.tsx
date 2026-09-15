'use client'

import { useCallback, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { t, type Locale } from '@/lib/i18n'
import { urlFor } from '@/sanity/lib/image'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'

export function GalleryCarouselSection({ heading, album, lang }: any & { lang: Locale }) {
  const images: any[] = album?.images ?? []
  const albumTitle = t<string>(album?.title, lang)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [openAt, setOpenAt] = useState<number | null>(null)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (images.length === 0) return null

  return (
    <section className="py-16">
      <Container size="wide">
        {(heading || album?.title) && (
          <h2 className="font-display text-gold-deep mb-8 text-center text-3xl">
            {t<string>(heading, lang) ?? albumTitle}
          </h2>
        )}

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
          <div className="flex gap-3">
            {images.map((image, index) => (
              <button
                key={image._key ?? index}
                type="button"
                onClick={() => setOpenAt(index)}
                className="focus-visible:outline-gold-deep min-w-0 shrink-0 basis-4/5 focus-visible:outline-2 md:basis-1/3 lg:basis-1/4"
              >
                <span className="sr-only">Phóng to ảnh {index + 1}</span>
                <SanityImage
                  image={image}
                  lang={lang}
                  sizes="(max-width: 768px) 80vw, 25vw"
                  fallbackAlt={albumTitle}
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button type="button" onClick={scrollPrev} className="border-line border px-4 py-2 text-sm">
            <span className="sr-only">Ảnh trước</span>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" onClick={scrollNext} className="border-line border px-4 py-2 text-sm">
            <span className="sr-only">Ảnh sau</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <Lightbox
          open={openAt !== null}
          index={openAt ?? 0}
          close={() => setOpenAt(null)}
          slides={images.map((image) => ({
            src: urlFor(image).width(1800).url(),
            alt: t<string>(image.alt, lang) ?? albumTitle ?? '',
          }))}
        />
      </Container>
    </section>
  )
}
