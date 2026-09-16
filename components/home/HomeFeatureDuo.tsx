import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { blocksToPlainText } from '@/lib/home-stats'

/**
 * Hai thẻ lớn cuối trang: "Tiệc cưới" và "Chương trình ưu đãi".
 *
 * Nguồn là hai `imageTextSection` cuối của trang chủ. Bản thiết kế bày
 * chúng thành một hàng hai thẻ CAO BẰNG NHAU, chữ đè lên nền — khác hẳn
 * `components/sections/ImageTextSection.tsx` (ảnh một bên, chữ một bên,
 * dùng ở các trang con).
 *
 * Thẻ thứ hai mang sắc thái khác thẻ thứ nhất (nền vàng chuyển sắc + chữ R
 * cỡ lớn làm hoa văn) đúng như bản thiết kế: nhịp "ảnh — khối màu" là thứ
 * giữ cho hai thẻ cạnh nhau không đọc thành một cặp song sinh. Khác bản
 * thiết kế một điểm: ở đó thẻ vàng KHÔNG có ảnh, còn ở đây ảnh thật do biên
 * tập viên chọn vẫn được dùng, đặt dưới lớp vàng với độ đục thấp — bỏ hẳn
 * một ảnh đã được chọn chỉ vì bản minh hoạ không có ảnh là quyết định của
 * người dựng, không phải của người biên tập.
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

            const shell = `text-cream-hi on-dark group relative isolate flex min-h-[27.5rem] flex-col justify-end overflow-hidden ${
              gold ? 'bg-[linear-gradient(160deg,#c9a24a,#8f6a1c)]' : 'border-gold/30 border'
            }`

            const body = (
              <>
                {section.image?.asset && (
                  <span className="absolute inset-0 overflow-hidden">
                    <SanityImage
                      image={section.image}
                      lang={lang}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      fallbackAlt={heading}
                      className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
                        // `mix-blend-multiply`, KHÔNG phải `luminosity`.
                        // Luminosity lấy độ sáng của ảnh đè lên màu nền: một
                        // bức ảnh phòng ngủ sáng sẽ LÀM SÁNG mảng vàng, và
                        // chữ kem trên đó tụt xuống ~3.3:1 — đo được trên
                        // chính ảnh đang dùng. Multiply thì kết quả luôn TỐI
                        // BẰNG HOẶC HƠN nền vàng, nên tương phản chữ không
                        // bao giờ tệ hơn nền trơn (4.67:1) dù biên tập viên
                        // đổi sang ảnh sáng cỡ nào.
                        gold ? 'opacity-40 mix-blend-multiply' : ''
                      }`}
                    />
                  </span>
                )}

                {/* Thẻ vàng: điểm sáng toả từ góc trên phải + chữ R hoa văn,
                    đúng bản thiết kế. Cả hai `aria-hidden`, thuần trang trí. */}
                {gold && (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(255_255_255/0.28),transparent_55%)]"
                    />
                    <span
                      aria-hidden="true"
                      className="font-display pointer-events-none absolute -top-24 -right-12 text-[22.5rem] leading-none font-semibold text-[rgb(255_248_232/0.14)] select-none"
                    >
                      R
                    </span>
                    {/* Làm tối nửa dưới của thẻ vàng.
                        Dải `linear-gradient(160deg,#c9a24a,#8f6a1c)` của bản
                        thiết kế chỉ đủ tối ở GÓC DƯỚI PHẢI; ở giữa thẻ nó vẫn
                        là `#c9a24a`, mà chữ kem trên màu đó đo được 2.27:1.
                        Bản thiết kế thoát được vì khối chữ của nó nằm sát đáy;
                        ở đây khối chữ cao hơn (tiêu đề tiếng Việt hai dòng +
                        đoạn mô tả + nút) nên mép trên của nó rơi vào vùng
                        sáng. Lớp này kéo nền dưới khối chữ về `#8f6a1c`,
                        cream trên đó đạt 6.3:1. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(120_86_18/0.92)_100%)]"
                    />
                  </>
                )}

                {/* Lớp phủ trải TOÀN thẻ, không chỉ dưới khối chữ.
                    Bản thiết kế đặt gradient ở `inset:0` và đó là điều kiện
                    để nó đủ tối ở vị trí tiêu đề: khối chữ cao 242px trong
                    thẻ 440px, nên nếu gradient chỉ chạy trong 242px đó thì ở
                    chỗ tiêu đề nó mới đạt ~0.42 độ đục — chữ kem trên ảnh
                    cưới nền trắng gần như không đọc được (đo trên chính ảnh
                    đang dùng). Trải hết thẻ thì cũng vị trí ấy đạt ~0.77. */}
                {!gold && (
                  <span
                    aria-hidden="true"
                    className="scrim-feature pointer-events-none absolute inset-0"
                  />
                )}

                <span className="relative px-8 pt-24 pb-9 lg:px-10 lg:pb-10">
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
