import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'

// Thiết kế gốc đặt bốn khối này thành lưới 2×2 ảnh lớn, tên khu vực ĐÈ LÊN
// ảnh. Bản dựng lại trước đó dùng thẻ trắng (ảnh trên, chữ dưới) xếp 4 cột ở
// lg — đo ở 1440px ra 4 ảnh chỉ 252×189px, nhỏ hơn cả thumbnail thư viện, và
// tiêu đề "CUNG HỘI NGHỊ QUỐC TẾ" vỡ thành 2 dòng làm 4 thẻ lệch chiều cao.
// Ở 390px thì ngược lại: 4 thẻ xếp dọc thành một khối cao **1827px**.
//
// Lưới tối đa 2 cột giữ ảnh đủ lớn ở mọi bề rộng (632px ở 1440, 100% ở 390),
// và `columns=4` từ Sanity cũng quy về 2 — bốn cột ảnh không còn ý nghĩa khi
// ảnh là nội dung chính chứ không phải hình minh hoạ.
const COLS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2',
} as const

export function CardGridSection({
  heading,
  subheading,
  cards,
  columns = 3,
  lang,
}: any & { lang: Locale }) {
  // `cards` chạy qua `cards[]{...}` trong SECTIONS projection (xem
  // `sanity/lib/queries.ts`) — projection này áp lên MỌI section, không chỉ
  // cardGridSection. Với section nào không có field `cards`, GROQ trả về
  // `null` tường minh, không phải `undefined` — default parameter (`cards =
  // []`) chỉ bắt `undefined`, không bắt `null`, nên `cards.map` từng nổ
  // (`Cannot read properties of null (reading 'map')`) ngay khi editor lưu
  // một cardGridSection còn trống. `?? []` bắt cả hai.
  const list: any[] = cards ?? []

  return (
    <section className="bg-cream-alt py-16 lg:py-24">
      <Container size="wide">
        <SectionHeading heading={heading} subheading={subheading} lang={lang} />

        <div className={`grid gap-4 lg:gap-6 ${COLS[columns as 2 | 3 | 4] ?? COLS[3]}`}>
          {list.map((card: any, index: number) => {
            const cardTitle = t<string>(card.title, lang)
            const description = t<string>(card.description, lang)

            return (
              <Reveal key={card._key ?? index} delay={index * 90}>
                {/* `group` + `isolate`: ảnh phóng nhẹ khi hover/focus trong
                    thẻ, `overflow-hidden` cắt phần tràn. `isolate` tạo
                    stacking context riêng để scrim không leo lên trên thẻ
                    bên cạnh. */}
                <article className="group on-dark shadow-card relative isolate h-full overflow-hidden rounded-card">
                  {card.image && (
                    <SanityImage
                      image={card.image}
                      lang={lang}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                      fallbackAlt={cardTitle}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 lg:aspect-[16/10]"
                    />
                  )}

                  {/* Scrim nằm TRÊN CHÍNH khối chữ (không phải một lớp cao
                      theo % chiều cao thẻ), với `pt-20` làm vùng chuyển: chữ
                      luôn rơi vào đoạn >= 86% đen bất kể tiêu đề dài mấy
                      dòng. Xem ghi chú tính toán ở `.scrim-bottom` trong
                      globals.css. */}
                  <div className="scrim-bottom absolute inset-x-0 bottom-0 px-5 pt-20 pb-5 lg:px-7 lg:pb-7">
                    <h3 className="font-display text-xl text-white lg:text-2xl">{cardTitle}</h3>
                    {description && (
                      <p className="mt-2 line-clamp-2 max-w-md text-sm leading-relaxed text-white/85">
                        {description}
                      </p>
                    )}
                    {card.cta && (
                      <SmartLink
                        link={card.cta}
                        lang={lang}
                        // Toàn bộ thẻ là vùng bấm (::after trải kín thẻ) —
                        // trước đây chỉ 68×16px chữ "XEM THÊM" bấm được.
                        // `after:absolute after:inset-0` biến chính link này
                        // thành vùng chạm cỡ cả thẻ mà không cần lồng <a>
                        // trong <a> (HTML không hợp lệ) hay onClick giả.
                        className="text-gold-hi mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold tracking-widest uppercase after:absolute after:inset-0"
                      />
                    )}
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
