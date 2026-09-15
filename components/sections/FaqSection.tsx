import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'

export function FaqSection({ heading, items = [], lang }: any & { lang: Locale }) {
  return (
    <section className="py-16">
      <Container size="narrow">
        {heading && (
          <h2 className="font-display text-gold-deep mb-8 text-3xl">{t<string>(heading, lang)}</h2>
        )}
        <dl className="divide-line divide-y">
          {items.map((item: any, index: number) => (
            <details key={item._key ?? index} className="group py-4">
              <summary className="marker:content-none cursor-pointer list-none font-semibold">
                <dt className="flex items-center justify-between">
                  {t<string>(item.question, lang)}
                  <span
                    aria-hidden="true"
                    className="text-gold-deep ml-4 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </dt>
              </summary>
              <dd className="mt-3 text-sm">
                <RichText value={item.answer} lang={lang} />
              </dd>
            </details>
          ))}
        </dl>
      </Container>
    </section>
  )
}
