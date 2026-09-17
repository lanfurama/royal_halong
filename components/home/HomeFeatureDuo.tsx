import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { blocksToPlainText } from '@/lib/home-stats'

/**
 * Bốn góc của khung vàng lồng trong thẻ — hoạ tiết "khung tranh".
 *
 * Viết đủ CẢ BỐN chuỗi class thay vì ghép động (`border-${side}-2`):
 * Tailwind quét mã nguồn như văn bản thuần, class ghép lúc chạy không bao
 * giờ có mặt trong CSS xuất ra. Đây là lỗi im lặng — không báo gì, chỉ là
 * góc khung không hiện.
 */
const FRAME_CORNERS = [
  'top-3.5 left-3.5 border-t-2 border-l-2 lg:top-5 lg:left-5',
  'top-3.5 right-3.5 border-t-2 border-r-2 lg:top-5 lg:right-5',
  'bottom-3.5 left-3.5 border-b-2 border-l-2 lg:bottom-5 lg:left-5',
  'bottom-3.5 right-3.5 border-b-2 border-r-2 lg:bottom-5 lg:right-5',
]

/**
 * Nét vàng mảnh nằm trên ảnh sáng thì gần như biến mất (kẻ `gold-hi` trên
 * ảnh hoa cưới trắng đo được 2.6:1). Bóng đổ tối 1px kéo nó bật ra khỏi mọi
 * nền, kể cả vùng ảnh chưa bị lớp phủ chạm tới. Dùng chung cho khung, bốn
 * góc và kẻ trang trí trên tiêu đề để ba thứ cùng một độ "dày" thị giác.
 */
const GOLD_EDGE = 'drop-shadow-[0_1px_2px_rgb(0_0_0/0.5)]'

/**
 * Hai thẻ lớn cuối trang: "Tiệc cưới" và "Chương trình ưu đãi".
 *
 * Nguồn là hai `imageTextSection` cuối của trang chủ. Bản thiết kế bày
 * chúng thành một hàng hai thẻ CAO BẰNG NHAU, chữ đè lên nền — khác hẳn
 * `components/sections/ImageTextSection.tsx` (ảnh một bên, chữ một bên,
 * dùng ở các trang con).
 *
 * ẢNH LÀ NHÂN VẬT CHÍNH — ĐỌC TRƯỚC KHI THÊM LỚP MÀU.
 * Bản trước làm thẻ thứ hai thành một mảng vàng đặc
 * (`linear-gradient(160deg,#c9a24a,#8f6a1c)`) với ảnh nằm DƯỚI ở
 * `opacity-40 mix-blend-multiply`; thẻ thứ nhất thì phủ gradient nâu vàng
 * kín mặt. Kết quả: cả hai bức ảnh do biên tập viên chọn đều chìm trong một
 * mảng mù tạt, và tiêu đề kem trên ảnh cưới nền trắng chỉ đạt **2.1:1** —
 * vừa xấu vừa không đọc được. Chủ dự án chốt: bỏ màn vàng, trả ảnh về đúng
 * màu.
 *
 * Nay cả hai thẻ dùng CHUNG một cách xử lý: ảnh thật, lớp phủ ĐEN trung
 * tính chỉ đậm ở nửa dưới (`.scrim-feature`), và một khung vàng lồng bên
 * trong. Đen chứ không phải nâu vì đen chỉ hạ độ sáng, giữ nguyên sắc độ
 * ảnh; nâu là "tô màu".
 *
 * Hai thẻ vẫn KHÔNG đọc thành một cặp song sinh — nhịp khác nhau nay nằm ở
 * hoạ tiết và nút, không nằm ở việc bỏ đi một bức ảnh: thẻ thứ hai mang chữ
 * R vàng cỡ lớn làm dấu triện và nút nền kem đặc, thẻ thứ nhất chỉ có link
 * chữ + mũi tên.
 */
export function HomeFeatureDuo({
  sections,
  lang,
}: {
  sections: any[]
  lang: Locale
}) {
  if (sections.length === 0) return null

  return (
    <section id="offers" className="py-20">
      <Container size="wide">
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section: any, index: number) => {
            const heading = t<string>(section.heading, lang)
            const eyebrow = t<string>(section.eyebrow, lang)
            // `imageTextSection.content` là Portable Text. Ở thẻ này chỉ cần
            // một đoạn dẫn ngắn đè lên ảnh, nên rút thành chữ phẳng thay vì
            // render cả rich text (danh sách, tiêu đề con… không có chỗ trong
            // một thẻ ảnh cao 440px).
            const summary = blocksToPlainText(t<any[]>(section.content, lang))
            const gold = index % 2 === 1

            // `bg-ink` KHÔNG phải trang trí: nó là trạng thái "thẻ chưa có
            // ảnh". Mọi chữ trong thẻ đều là màu kem/vàng sáng (`text-cream-hi`
            // ở đây, `gold-soft` ở eyebrow và CTA) — thiếu ảnh mà nền là kem
            // của trang thì cả khối chữ TRẮNG TRÊN TRẮNG. Nền nâu mực đưa
            // trường hợp đó về 15:1.
            const shell =
              'text-cream-hi on-dark group bg-ink border-gold/35 relative flex min-h-[27.5rem] flex-col justify-end overflow-hidden border'

            const body = (
              <>
                {section.image?.asset && (
                  <span className="absolute inset-0 overflow-hidden">
                    <SanityImage
                      image={section.image}
                      lang={lang}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      fallbackAlt={heading}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </span>
                )}

                {/* Dấu triện R của thẻ thứ hai. Nằm TRƯỚC lớp phủ nên chân
                    chữ chìm dần vào vùng tối ở đáy thay vì nổi đều — một dấu
                    chìm, không phải một chữ dán lên ảnh. Vàng chứ không còn
                    trắng: trên ảnh thật, trắng 14% chỉ là một vệt mờ bạc;
                    vàng đọc ra là hoa văn. */}
                {gold && (
                  <span
                    aria-hidden="true"
                    className="font-display pointer-events-none absolute -top-24 -right-12 text-[22.5rem] leading-none font-semibold text-[rgb(240_215_138/0.18)] select-none"
                  >
                    R
                  </span>
                )}

                {/* Lớp phủ trải TOÀN thẻ, không chỉ dưới khối chữ: khối chữ
                    bắt đầu ở khoảng 50% chiều cao thẻ, nên một gradient chỉ
                    chạy trong phần chữ sẽ còn quá nhạt ngay tại tiêu đề. Chi
                    tiết công thức và số đo tương phản ở `.scrim-feature`
                    trong `app/globals.css`. */}
                <span
                  aria-hidden="true"
                  className="scrim-feature pointer-events-none absolute inset-0"
                />

                {/* Khung vàng lồng trong thẻ + bốn góc nhấn. Đặt SAU lớp phủ
                    để khung nằm trên vùng tối (nếu nằm dưới, nửa khung phía
                    đáy bị phủ đen mất một nửa độ sáng), và TRƯỚC khối chữ để
                    chữ luôn ở trên cùng — thứ tự DOM quyết định, không cần
                    `z-index` nào. */}
                <span
                  aria-hidden="true"
                  className={`border-gold-hi/35 group-hover:border-gold-hi/65 pointer-events-none absolute inset-3.5 border transition-colors duration-500 motion-reduce:transition-none lg:inset-5 ${GOLD_EDGE}`}
                />
                {FRAME_CORNERS.map((corner) => (
                  <span
                    key={corner}
                    aria-hidden="true"
                    className={`border-gold-hi pointer-events-none absolute h-7 w-7 ${GOLD_EDGE} ${corner}`}
                  />
                ))}

                <span className="relative px-8 pt-24 pb-9 lg:px-10 lg:pb-10">
                  {/* Kẻ vàng ngắn — cùng một hoạ tiết với `HeroSection`,
                      `HomeIntro`, `CtaBandSection`. Đây là thứ neo hai thẻ
                      này vào ngôn ngữ thị giác của cả trang, và là hoạ tiết
                      DUY NHẤT chắc chắn hiện: `eyebrow` có thể trống trong
                      Sanity (hiện đang trống ở cả hai thẻ). */}
                  <span
                    aria-hidden="true"
                    className={`bg-gold-hi mb-5 block h-0.5 w-14 ${GOLD_EDGE}`}
                  />
                  {eyebrow && (
                    <span className="text-gold-soft block text-[0.625rem] tracking-[0.1em] uppercase">
                      {eyebrow}
                    </span>
                  )}
                  {heading && (
                    <span className="font-display mt-2.5 block text-[clamp(1.75rem,2.6vw,2.5rem)] leading-tight">
                      {heading}
                    </span>
                  )}
                  {summary && (
                    <span className="text-cream-hi/90 mt-3.5 block max-w-[26rem] text-sm leading-relaxed">
                      {summary}
                    </span>
                  )}
                  {/* Nhãn CTA của `link` trong Sanity ("Xem thêm" / "Khám
                      phá"). Cả thẻ đã là <a>, nên đây chỉ là dấu hiệu thị
                      giác, không phải link lồng trong link. */}
                  {t<string>(section.cta?.label, lang) && (
                    <span
                      className={`mt-6 inline-flex items-center gap-3 text-xs font-semibold tracking-[0.1em] uppercase ${
                        gold
                          ? 'bg-cream-hi text-gold-deep px-6 py-3.5'
                          : 'text-gold-soft'
                      }`}
                    >
                      {t<string>(section.cta?.label, lang)}
                      <span aria-hidden="true">→</span>
                    </span>
                  )}
                </span>
              </>
            )

            // `SmartLink` trả `null` khi thiếu `link` — với cả thẻ làm link
            // thì điều đó có nghĩa là THẺ BIẾN MẤT chứ không phải mất một
            // dòng chữ. Không có đích đi tiếp thì render `<div>`, giữ nội
            // dung lại.
            return section.cta ? (
              <SmartLink
                key={section._key ?? index}
                link={section.cta}
                lang={lang}
                className={shell}
              >
                {body}
              </SmartLink>
            ) : (
              <div key={section._key ?? index} className={shell}>
                {body}
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
