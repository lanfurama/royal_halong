import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'

// Bản thiết kế KHÔNG có trắng thuần ở đâu cả. `white` (mặc định của
// schema) giờ là chính nền trang `#faf6ee`, `cream` là dải kem ngả nâu
// `#f3ebdb` dùng để xen kẽ. Giữ nguyên TÊN khoá vì chúng là giá trị biên
// tập viên đã chọn trong Sanity — đổi tên khoá sẽ làm mọi section đang đặt
// `tone: 'white'` rơi về mặc định.
const BG = {
  white: 'bg-cream text-body',
  cream: 'bg-cream-alt text-body',
  ink: 'bg-ink on-dark text-cream-hi',
} as const

export function RichTextSection({
  heading,
  content,
  tone = 'white',
  narrow = true,
  lang,
}: any & { lang: Locale }) {
  return (
    <section className={`py-16 lg:py-24 ${BG[tone as keyof typeof BG] ?? BG.white}`}>
      <Container size={narrow ? 'narrow' : 'default'}>
        {heading && (
          // Tiêu đề màu NÂU MỰC, không phải vàng. Trong bản thiết kế mới,
          // vàng chỉ dành cho nhãn nhỏ, viền và nút — tiêu đề Playfair lấy
          // sức nặng từ kiểu chữ chứ không từ màu. (Tiện thể: ink trên kem
          // đo được 14:1, so với 4.59:1 của vàng đậm.)
          <h2
            className={`font-display mb-6 text-[clamp(1.5rem,4vw,2.25rem)] ${
              tone === 'ink' ? 'text-cream-hi' : ''
            }`}
          >
            {t<string>(heading, lang)}
          </h2>
        )}
        <RichText value={content} lang={lang} />
      </Container>
    </section>
  )
}
