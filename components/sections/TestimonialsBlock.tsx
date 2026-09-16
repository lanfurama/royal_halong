'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

/**
 * Cảm nhận khách KHÔNG phải một section trong `sections[]` — schema để chúng
 * ở trường riêng `homePage.testimonials[]->` (Plan A). `HOME_QUERY` vẫn luôn
 * lấy về đủ 4 document, nhưng trước bản này không component nào render, nên
 * chúng bị lấy rồi bỏ đi: bản gốc có khối này, bản dựng lại thì không.
 *
 * Vì sao chuyển từ lưới tĩnh sang carousel (số đo, không phải gu): lưới
 * `md:grid-cols-2` xếp 4 trích dẫn thành cột dọc ở 390px, đo được khối cao
 * **1377px** — dài hơn một màn hình rưỡi cho nội dung mà người đọc chỉ liếc
 * qua, và đẩy bản đồ/CTA xuống tận 5021px. Bản gốc cũng để khối này ở dạng
 * carousel một trích dẫn kèm chấm chỉ vị trí. Carousel giữ nguyên số lượng
 * trích dẫn nhưng trả lại ~1000px chiều cao trang.
 */
export function TestimonialsBlock({
  testimonials,
  lang,
}: {
  testimonials: unknown[] | null | undefined
  lang: Locale
}) {
  // GROQ trả `null` tường minh khi trường vắng mặt — default parameter chỉ bắt
  // `undefined`, đúng lớp lỗi đã làm CardGridSection nổ trước đây.
  const list = (testimonials ?? []) as any[]

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [selected, setSelected] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

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

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  // Hook chạy đủ trước khi rẽ nhánh render (quy tắc hooks) — cùng cách
  // MobileMenu xử lý nhánh "không có gì để hiện".
  if (list.length === 0) return null

  return (
    <section className="bg-cream py-16 lg:py-24">
      <Container size="wide">
        <SectionHeading heading={{ vi: 'Cảm nhận của khách', en: 'Guest reviews' }} lang={lang} />

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 lg:gap-6">
            {list.map((item: any, index: number) => {
              const heading = t<string>(item.heading, lang)
              const quote = t<string>(item.quote, lang)
              if (!quote) return null

              return (
                <figure
                  key={item._id ?? index}
                  className="bg-cream-soft shadow-card flex min-w-0 shrink-0 basis-full flex-col rounded-card p-6 lg:basis-[calc(50%-0.75rem)] lg:p-8"
                >
                  {/* Dấu ngoặc kép lớn — dấu hiệu thị giác duy nhất cho biết
                      đây là lời của khách, thay cho việc phải viết thêm chữ. */}
                  <span
                    aria-hidden="true"
                    className="font-display text-gold/50 mb-1 block text-5xl leading-none"
                  >
                    &ldquo;
                  </span>

                  {heading && (
                    <h3 className="font-display text-gold-text mb-3 text-lg lg:text-xl">
                      {heading}
                    </h3>
                  )}

                  <blockquote className="flex-1 text-sm leading-relaxed lg:text-base">
                    {quote}
                  </blockquote>

                  <figcaption className="border-line mt-5 border-t pt-4 text-xs tracking-widest uppercase">
                    {item.author}
                    {item.source ? (
                      <span className="text-gold-text"> — {item.source}</span>
                    ) : null}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>

        {snapCount > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1">
            {Array.from({ length: snapCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`Xem cảm nhận ${index + 1}`}
                aria-current={index === selected ? 'true' : undefined}
                // Chấm nhìn thấy chỉ 6px, nhưng nút bọc 44×44 nên vẫn bấm
                // trúng bằng ngón cái.
                className="group flex size-11 items-center justify-center"
              >
                <span
                  className={`h-1.5 rounded-pill transition-all duration-300 ${
                    index === selected ? 'bg-gold w-6' : 'bg-line group-hover:bg-gold/50 w-1.5'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
