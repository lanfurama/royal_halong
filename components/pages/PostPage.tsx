import { t, type Locale } from '@/lib/i18n'
import { INTL_LOCALES } from '@/lib/i18n'
import type { SanityDoc } from '@/sanity/lib/fetchers'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'

export function PostPage({ doc, lang }: { doc: SanityDoc; lang: Locale }) {
  const postTitle = t<string>(doc.title as any, lang)
  const published = doc.publishedAt ? new Date(doc.publishedAt as string) : null

  return (
    <article className="py-16">
      <Container size="narrow">
        <h1 className="font-display text-3xl md:text-4xl">{postTitle}</h1>
        {published && (
          <p className="mt-3 text-xs tracking-widest uppercase">
            <time dateTime={published.toISOString()}>
              {published.toLocaleDateString(INTL_LOCALES[lang], {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </time>
            {doc.author ? ` — ${doc.author}` : ''}
          </p>
        )}
        {doc.coverImage != null && (
          <SanityImage
            image={doc.coverImage}
            lang={lang}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            fallbackAlt={postTitle}
            className="mt-8 h-auto w-full object-cover"
          />
        )}
        <div className="mt-8">
          <RichText value={doc.body} lang={lang} />
        </div>
      </Container>
    </article>
  )
}
