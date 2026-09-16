import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'

/**
 * Nhịp 7-5 / 5-7 của bản thiết kế, lặp lại theo từng cặp thẻ. Khai bằng
 * class TĨNH (không ghép chuỗi `md:col-span-${n}`): Tailwind quét mã nguồn
 * bằng văn bản, một class dựng lúc chạy sẽ không có trong CSS xuất ra.
 */
const SPANS = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'] as const

/**
 * Lưới "bốn thế giới trong một điểm đến" — bốn thẻ ảnh lớn, tên khu vực đè
 * lên ảnh.
 *
 * Nguồn dữ liệu là `cardGridSection` của trang chủ (KHÁCH SẠN VÀ VILLA /
 * CUNG HỘI NGHỊ QUỐC TẾ / CÂU LẠC BỘ QUỐC TẾ HOÀNG GIA / ẨM THỰC). Khác
 * `components/sections/CardGridSection.tsx` (lưới 2 cột đều nhau, dùng cho
 * các trang con) ở chỗ tỉ lệ các ô không đều — đó là toàn bộ đặc trưng thị
 * giác của khối này trong bản thiết kế.
 *
 * Là Server Component: hiệu ứng phóng ảnh và hiện mô tả khi rê chuột làm
 * hoàn toàn bằng CSS (`group-hover`), không cần state như bản thiết kế
 * (bản đó giữ `hover` trong React vì môi trường xem trước không có
 * `group-hover`).
 */
export function HomeServices({
  heading,
  subheading,
  cards,
  lang,
}: {
  heading?: any
  subheading?: any
  cards?: any[] | null
  lang: Locale
}) {
  // GROQ trả `null` tường minh khi field vắng mặt — default parameter chỉ bắt
  // `undefined`. Đây chính là lỗi đã làm `CardGridSection` nổ trước đây.
  const list: any[] = cards ?? []
  if (list.length === 0) return null

  const headingText = t<string>(heading, lang)
  const subText = t<string>(subheading, lang)

  return (
    <section id="services" className="pb-24">
      <Container size="wide">
        {(headingText || subText) && (
          <div className="mx-auto mb-10 max-w-3xl text-center">
            {subText && (
              <p className="text-gold mb-3 text-[0.6875rem] tracking-[0.18em] uppercase">
                {subText}
              </p>
            )}
            {headingText && (
              <h2 className="text-[clamp(1.75rem,3vw,2.875rem)]">{headingText}</h2>
            )}
          </div>
        )}

        <div className="grid gap-4 md:auto-rows-[260px] md:grid-cols-12">
          {list.map((card: any, index: number) => {
            const title = t<string>(card.title, lang)
            const description = t<string>(card.description, lang)
            const span = SPANS[index % SPANS.length]

            const inner = (
              <>
                <span className="absolute inset-0 overflow-hidden">
                  {card.image && (
                    <SanityImage
                      image={card.image}
                      lang={lang}
                      sizes="(max-width: 768px) 100vw, 60vw"
                      fallbackAlt={title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  )}
                </span>
                {/* Lớp phủ nằm TRÊN CHÍNH khối chữ với `pt-24` làm vùng
                    chuyển, không phải một lớp cao theo % chiều cao thẻ: chiều
                    cao khối chữ đổi theo độ dài tiêu đề, neo theo % thẻ là
                    cách chắc chắn để một ngày nào đó chữ trôi ra khỏi vùng đủ
                    tối. */}
                <span className="scrim-card pointer-events-none absolute inset-x-0 bottom-0 px-8 pt-24 pb-7">
                  <span className="font-display block text-[1.75rem] leading-tight">{title}</span>
                  {description && (
                    // Mô tả hiện ra khi rê chuột, đúng bản thiết kế. Dùng
                    // `grid-rows-[0fr]` -> `[1fr]` thay vì `max-height`: nó
                    // mở đúng chiều cao thật của nội dung, không cần đoán một
                    // con số `max-h` rồi cắt mất dòng cuối ở màn hẹp.
                    <span className="mt-2.5 grid grid-rows-[0fr] opacity-0 transition-all duration-500 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100 motion-reduce:transition-none">
                      <span className="text-cream-hi/90 block overflow-hidden text-[0.8125rem] leading-relaxed">
                        {description}
                      </span>
                    </span>
                  )}
                </span>
              </>
            )

            const shell = `group text-cream-hi on-dark relative isolate block min-h-[260px] overflow-hidden ${span}`

            // Có link đích -> cả thẻ là một <a> (vùng bấm bằng cả thẻ, không
            // phải một dòng chữ 68×16px). Không có -> <div>, không dựng một
            // link không dẫn đi đâu.
            return card.cta ? (
              <SmartLink key={card._key ?? index} link={card.cta} lang={lang} className={shell}>
                {inner}
              </SmartLink>
            ) : (
              <div key={card._key ?? index} className={shell}>
                {inner}
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
