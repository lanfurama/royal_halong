import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'

export function FaqSection({
  heading,
  eyebrow,
  description,
  layout = 'stack',
  items,
  lang,
}: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection/VenueListSection — default
  // parameter không chặn được `null` tường minh.
  const list: any[] = items ?? []

  /* `<details>`/`<summary>` gốc, KHÔNG phải accordion tự viết bằng
     `useState`: nó mở/đóng được khi JS chưa tải, Ctrl+F của trình duyệt tìm
     thấy chữ trong phần đang đóng (Chrome tự bung ra), và ngữ nghĩa
     đóng/mở đã có sẵn cho screen reader. Cùng lựa chọn với bản `stack`
     trước đây — giữ nguyên, chỉ đổi cách xếp chỗ. */
  const accordion = (
    <div className="divide-line divide-y border-b border-t border-line">
      {list.map((item: any, index: number) => (
        <details key={item._key ?? index} className="group py-5">
          {/* `<summary>` là vùng bấm; `min-h-11` để nó đạt 44px kể cả khi
              câu hỏi chỉ có một dòng ngắn. `py-5` của thẻ cha không thay
              được: đó là khoảng cách GIỮA các câu, không phải vùng chạm. */}
          <summary className="flex min-h-11 cursor-pointer list-none items-center font-semibold marker:content-none">
            <span className="flex flex-auto items-center justify-between gap-4">
              {t<string>(item.question, lang)}
              <span
                aria-hidden="true"
                className="text-gold ml-4 text-xl transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </span>
          </summary>
          <div className="mt-3 text-sm">
            <RichText value={item.answer} lang={lang} />
          </div>
        </details>
      ))}
    </div>
  )

  if (layout !== 'split') {
    return (
      <section className="py-16">
        <Container size="narrow">
          {heading && (
            <h2 className="font-display mb-8 text-3xl">{t<string>(heading, lang)}</h2>
          )}
          {accordion}
        </Container>
      </section>
    )
  }

  /* Bố cục `split` — tiêu đề đứng yên bên trái, danh sách câu hỏi bên phải.
     Vì sao thêm: ở bản `narrow` một dòng có 12 câu hỏi đóng là một cột chữ
     đơn điệu cao 700px không có điểm nghỉ, và tiêu đề trôi mất ngay câu thứ
     ba. Tách hai cột thì tiêu đề + số điện thoại (chỗ trả lời khi FAQ không
     đủ) nằm trong tầm mắt suốt lúc khách đọc.

     `stack` vẫn là mặc định: trang Cung Hội nghị đang dùng nó, và đổi mặc
     định là đổi một trang ngoài phạm vi việc này. */
  return (
    <section id="faq" className="bg-cream py-16 lg:py-24">
      <Container size="wide">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
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
            {description && (
              <div className="mt-5 max-w-[44ch] text-sm">
                <RichText value={description} lang={lang} />
              </div>
            )}
          </div>
          <div>{accordion}</div>
        </div>
      </Container>
    </section>
  )
}
