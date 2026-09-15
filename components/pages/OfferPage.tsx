import { t, type Locale } from '@/lib/i18n'
import type { SanityDoc } from '@/sanity/lib/fetchers'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'

export function OfferPage({ doc, lang }: { doc: SanityDoc; lang: Locale }) {
  const offerTitle = t<string>(doc.title as any, lang)

  return (
    <article className="py-16">
      <Container size="narrow">
        <h1 className="font-display text-gold-deep text-3xl md:text-4xl">{offerTitle}</h1>
        {doc.priceNote != null && (
          <p className="text-gold-text mt-2 text-sm font-semibold tracking-widest uppercase">
            {t<string>(doc.priceNote as any, lang)}
          </p>
        )}
        {doc.image != null && (
          <SanityImage
            image={doc.image}
            lang={lang}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            fallbackAlt={offerTitle}
            className="mt-8 h-auto w-full object-cover"
          />
        )}
        <div className="mt-8">
          <RichText value={doc.body} lang={lang} />
        </div>
        {doc.cta != null && (
          <SmartLink
            link={doc.cta}
            lang={lang}
            className="bg-gold text-ink hover:bg-gold-hi mt-8 inline-block px-8 py-3 text-sm font-semibold tracking-wide uppercase"
          />
        )}
      </Container>
    </article>
  )
}
