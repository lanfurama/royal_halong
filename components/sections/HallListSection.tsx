import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'

export function HallListSection({ heading, resolved, lang }: any & { lang: Locale }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection/VenueListSection — default
  // parameter không chặn được `null` tường minh.
  const list: any[] = resolved ?? []
  return (
    <section className="bg-cream-alt py-16">
      <Container>
        {heading && (
          <h2 className="font-display mb-10 text-center text-3xl">
            {t<string>(heading, lang)}
          </h2>
        )}
        <div className="space-y-12">
          {list.map((hall: any, index: number) => {
            const hallName = t<string>(hall.name, lang)
            return (
              <article key={hall._id} className="grid items-center gap-8 md:grid-cols-2">
                <div className={index % 2 ? 'md:order-2' : ''}>
                  {hall.image && (
                    <SanityImage
                      image={hall.image}
                      lang={lang}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fallbackAlt={hallName}
                      className="h-auto w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-2xl">{hallName}</h3>
                  <p className="text-gold-text mt-1 text-xs tracking-widest uppercase">
                    {[
                      hall.areaSqm ? `Diện tích: ${hall.areaSqm} m²` : null,
                      t<string>(hall.capacity, lang) ? `Sức chứa: ${t<string>(hall.capacity, lang)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' | ')}
                  </p>
                  <div className="mt-3 text-sm">
                    <RichText value={hall.description} lang={lang} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
