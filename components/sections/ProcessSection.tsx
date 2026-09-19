import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Các bước tuần tự, đánh số, kẻ một nét ngang ở đầu mỗi bước.
 *
 * Dựng bằng `<ol>` chứ không phải lưới `<div>`: thứ tự ở đây LÀ nội dung —
 * "thử thực đơn" đứng sau "xem sảnh" là một thông tin, không phải một lựa
 * chọn bố cục. Người dùng screen reader nghe "danh sách 5 mục, mục 2/5" mà
 * không cần đọc con số trang trí.
 *
 * Số thứ tự hiển thị lấy từ `index`, KHÔNG phải một field trong Sanity: biên
 * tập viên kéo thả đổi thứ tự bước là số phải đi theo, và một cặp `order` +
 * vị trí mảng trôi khỏi nhau là chuyện của thời gian. `aria-hidden` vì
 * `<ol>` đã tự đánh số cho công nghệ trợ giúp — đọc "01, bước một" là thừa.
 */
export function ProcessSection({ eyebrow, heading, description, steps, lang }: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection — GROQ trả `null` tường minh.
  const list: any[] = steps ?? []
  if (list.length === 0) return null

  return (
    /* `id` cố định chứ không phải một field trong Sanity: nó là NEO, và neo
       chỉ có ích khi thanh mục lục biết trước tên nó. Bốn khối khác của
       trang /wedding cũng làm vậy (`khong-gian`, `suc-chua`, `tu-van`,
       `faq`) — xem mô tả field `anchor` trong `pageNavSection.ts`, nơi liệt
       kê đủ danh sách id hiện có cho biên tập viên. */
    <section id="quy-trinh" className="bg-cream py-16 lg:py-24">
      <Container size="wide">
        <div className="mb-10 max-w-[58ch] lg:mb-14">
          {eyebrow && (
            <p className="text-gold-text mb-3 text-xs tracking-[0.18em] uppercase">
              {t<string>(eyebrow, lang)}
            </p>
          )}
          {heading && (
            <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)]">
              {t<string>(heading, lang)}
            </h2>
          )}
          {description && <p className="mt-4">{t<string>(description, lang)}</p>}
        </div>

        {/* `minmax(14rem,1fr)` + `auto-fit`: 5 bước xếp một hàng ở 1440px, hai
            hàng ở tablet, một cột ở điện thoại — không cần khai breakpoint
            nào. Đây là loại "progressive enhancement đúng ở mọi bề rộng" mà
            ngưỡng `nav` duy nhất của dự án cho phép (xem AGENTS/CLAUDE.md):
            số cột đổi theo chỗ trống thật, không theo một mốc đoán trước.

            Nét ngang ở ĐẦU mỗi bước thay cho đường nối giữa các bước: đường
            nối chỉ đúng khi 5 bước nằm CÙNG một hàng, và vỡ ngay khi lưới
            xuống hai hàng — nét riêng của từng bước thì bề ngang nào cũng
            đọc được. */}
        <ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-x-6">
          {list.map((step: any, index: number) => (
            <li
              key={step._key ?? index}
              // Bước ĐẦU dùng nét vàng đậm, các bước sau nét nhạt: điểm bắt
              // đầu phải nhìn ra ngay ở một hàng 5 khối giống hệt nhau.
              className={`border-t-2 pt-7 pr-6 pb-7 ${index === 0 ? 'border-gold' : 'border-line'}`}
            >
              <Reveal delay={index * 80}>
                <p
                  aria-hidden="true"
                  className="text-gold-deep mb-3.5 text-xs tracking-[0.18em]"
                >
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="font-display text-xl">{t<string>(step.title, lang)}</h3>
                {step.description && (
                  <p className="mt-2.5 text-sm leading-relaxed">
                    {t<string>(step.description, lang)}
                  </p>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
