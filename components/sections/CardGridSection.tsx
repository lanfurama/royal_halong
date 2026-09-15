import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { Reveal } from '@/components/ui/Reveal'

const COLS = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' }

export function CardGridSection({
  heading,
  subheading,
  cards = [],
  columns = 3,
  lang,
}: any & { lang: Locale }) {
  return (
    <section className="bg-cream py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-2 text-center text-3xl">
            {t<string>(heading, lang)}
          </h2>
        )}
        {subheading && (
          <p className="mb-10 text-center text-sm tracking-widest uppercase">
            {t<string>(subheading, lang)}
          </p>
        )}
        <div className={`grid gap-8 ${COLS[columns as 2 | 3 | 4] ?? COLS[3]}`}>
          {cards.map((card: any, index: number) => {
            const cardTitle = t<string>(card.title, lang)
            return (
              <Reveal key={card._key ?? index} delay={index * 90}>
                <article className="h-full bg-white">
                  {card.image && (
                    <SanityImage
                      image={card.image}
                      lang={lang}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      fallbackAlt={cardTitle}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="font-display text-gold-deep mb-2 text-xl">{cardTitle}</h3>
                    {card.description && (
                      <p className="text-sm leading-relaxed">{t<string>(card.description, lang)}</p>
                    )}
                    {card.cta && (
                      <SmartLink
                        link={card.cta}
                        lang={lang}
                        className="text-gold-text mt-4 inline-block text-xs font-semibold tracking-wide uppercase underline underline-offset-4"
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
