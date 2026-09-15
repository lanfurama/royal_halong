import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Cảm nhận khách KHÔNG phải một section trong `sections[]` — schema để chúng
 * ở trường riêng `homePage.testimonials[]->` (Plan A). `HOME_QUERY` vẫn luôn
 * lấy về đủ 4 document, nhưng trước bản này không component nào render, nên
 * chúng bị lấy rồi bỏ đi: bản gốc có khối này, bản dựng lại thì không.
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
  if (list.length === 0) return null

  return (
    <section className="bg-white py-16">
      <Container>
        <h2 className="font-display text-gold-deep mb-10 text-center text-3xl">
          Cảm nhận của khách
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {list.map((item: any, index: number) => {
            const heading = t<string>(item.heading, lang)
            const quote = t<string>(item.quote, lang)
            if (!quote) return null
            return (
              <Reveal key={item._id ?? index} delay={index * 90}>
                <figure className="bg-cream h-full p-6">
                  {heading && (
                    <h3 className="font-display text-gold-text mb-3 text-xl">{heading}</h3>
                  )}
                  <blockquote className="text-sm leading-relaxed">{quote}</blockquote>
                  <figcaption className="mt-4 text-xs tracking-widest uppercase">
                    {item.author}
                    {item.source ? ` — ${item.source}` : ''}
                  </figcaption>
                </figure>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
