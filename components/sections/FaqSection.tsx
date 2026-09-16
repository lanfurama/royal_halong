import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'

export function FaqSection({ heading, items, lang }: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection/VenueListSection — default
  // parameter không chặn được `null` tường minh.
  const list: any[] = items ?? []
  return (
    <section className="py-16">
      <Container size="narrow">
        {heading && (
          <h2 className="font-display mb-8 text-3xl">{t<string>(heading, lang)}</h2>
        )}
        {/* `<dl>` chỉ cho phép nhóm `<dt>`/`<dd>` (hoặc `<div>` bọc chúng) làm con
            trực tiếp — `<details>` không hợp lệ ở đó. `<details>`/`<summary>` gốc
            đã đủ ngữ nghĩa câu hỏi/trả lời, không cần thêm dl/dt/dd. */}
        <div className="divide-line divide-y">
          {list.map((item: any, index: number) => (
            <details key={item._key ?? index} className="group py-4">
              <summary className="marker:content-none cursor-pointer list-none font-semibold">
                <span className="flex items-center justify-between">
                  {t<string>(item.question, lang)}
                  <span
                    aria-hidden="true"
                    className="text-gold ml-4 transition-transform group-open:rotate-45"
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
      </Container>
    </section>
  )
}
