import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'
import { TableBody } from './TableSection'

/**
 * Danh sách các khối GẬP xếp chồng — tiêu đề là chỗ bấm, nội dung ẩn tới khi
 * mở.
 *
 * Vì sao tồn tại: trang /casino có 9 khối tra cứu (luật chơi, nguyên tắc rút
 * lá thứ 3, bảng trả thưởng của ba trò) mà bản gốc để trong accordion đóng
 * sẵn. Bản nhập lần đầu trải phẳng cả 9 khối thành 9 section luôn mở, biến
 * trang thành một bức tường chữ cao 8.334px ở 1440px — luật Baccarat, thứ
 * chỉ người đang ngồi ở bàn mới cần, đẩy ảnh sòng bài và số hotline ra ngoài
 * tầm mắt. Gập lại trả đúng thứ tự ưu tiên của trang.
 *
 * KHÔNG dùng cho hành động bắt buộc hay nội dung mà khách BẮT BUỘC phải đọc
 * (điều kiện vào cửa, giá, cảnh báo) — những thứ đó phải hiện sẵn. Đây chỉ
 * dành cho tài liệu tra cứu dài.
 *
 * `<details>`/`<summary>` gốc, không phải nút + state React: mở/đóng chạy
 * ngay cả khi JS chưa tải, có sẵn ngữ nghĩa cho screen reader, và Ctrl+F của
 * trình duyệt hiện đại tự bung khối đang đóng khi tìm thấy chữ bên trong.
 */

// Cùng bảng nền với `RichTextSection`/`ImageTextSection` — cụm accordion phải
// nằm trên CÙNG một mặt nền với khối giới thiệu ngay trên nó, nếu không có một
// đường đổi màu cắt ngang giữa "BACCARAT + ảnh" và bốn khối luật của chính nó.
const BG = {
  white: 'bg-cream text-body',
  cream: 'bg-cream-alt text-body',
  ink: 'bg-ink on-dark text-cream-hi',
} as const

/**
 * Chỉ RIÊNG danh sách gập, không có `<section>`/`<Container>` bọc ngoài.
 *
 * Tách ra vì danh sách này xuất hiện ở hai chỗ: là một dải riêng xếp dọc
 * trang (`CollapsibleGroup` bên dưới — đường đi mặc định của
 * `SectionRenderer`), và nằm LỒNG trong cột chữ của một khối trò chơi
 * (`GameBand` ở trang /casino), nơi nền và lề đã do khối cha lo.
 *
 * `dark` không suy ra từ `.on-dark` của tổ tiên được: Tailwind sinh class
 * tĩnh, nên màu viền/chữ phải chọn ngay tại đây.
 */
export function CollapsibleList({
  sections,
  lang,
  dark = false,
}: {
  sections: any[]
  lang: Locale
  dark?: boolean
}) {
  const list = (sections ?? []).filter(Boolean)
  if (list.length === 0) return null

  // Viền vàng nhạt trên nền tối: `--color-line` (#e9dcc2) trên `ink` sáng
  // chói thành một cái khung kẻ ô; `gold-hi` pha 26% cho ra đúng nét mảnh
  // của bản thiết kế.
  const edge = dark ? 'border-gold-hi/25 divide-gold-hi/25' : 'border-line divide-line'
  const titleColor = dark ? 'text-cream-hi' : ''
  const signColor = dark ? 'text-gold-hi' : 'text-gold-text'
  const bodyColor = dark ? 'text-cream-dim' : ''

  return (
    <div className={`divide-y border-y ${edge}`}>
      {list.map((section: any, index: number) => {
        const heading = t<string>(section.heading, lang)
        return (
          <details key={section._key ?? index} className="group">
            {/* `min-h-11` + `py-4`: vùng bấm 44px thật kể cả khi tiêu đề chỉ
                một dòng ngắn ("Luật chơi" = 17px chữ). `list-none` +
                `marker:content-none` bỏ mũi tam giác mặc định của trình duyệt
                (khác nhau ở mỗi engine) để dùng dấu + của hệ thiết kế — cùng
                ngôn ngữ thị giác với `FaqSection`. */}
            <summary className="marker:content-none flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left">
              <span className={`font-display text-lg lg:text-xl ${titleColor}`}>{heading}</span>
              <span
                aria-hidden="true"
                className={`shrink-0 text-xl leading-none transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none ${signColor}`}
              >
                +
              </span>
            </summary>

            <div className={`pb-6 ${bodyColor}`}>
              {section._type === 'tableSection' ? (
                <TableBody
                  caption={section.caption}
                  headers={section.headers}
                  rows={section.rows}
                  lang={lang}
                  label={heading}
                />
              ) : (
                <RichText value={section.content} lang={lang} />
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}

export function CollapsibleGroup({ sections, lang }: { sections: any[]; lang: Locale }) {
  const list = (sections ?? []).filter(Boolean)
  if (list.length === 0) return null

  // `tableSection` không có field `tone` (nó không tự vẽ nền), nên lấy nền từ
  // khối ĐẦU TIÊN trong cụm có khai `tone` thay vì cứng nhắc lấy phần tử [0].
  const tone: string = list.find((section) => section?.tone)?.tone ?? 'white'

  return (
    // Không có `padding-top`: khối gập luôn đi NGAY SAU khối giới thiệu của
    // chính trò chơi đó (`imageTextSection`), và khối ấy đã có `pb-16 lg:pb-24`
    // của riêng nó. Thêm đệm trên ở đây là cộng hai lần, đẩy danh sách trôi
    // khỏi phần nội dung mà nó thuộc về.
    <section className={`pb-16 lg:pb-24 ${BG[tone as keyof typeof BG] ?? BG.white}`}>
      <Container>
        <CollapsibleList sections={list} lang={lang} dark={tone === 'ink'} />
      </Container>
    </section>
  )
}
