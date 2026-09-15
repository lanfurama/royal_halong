import { t, type Locale } from '@/lib/i18n'
import type { SanityDoc } from '@/sanity/lib/fetchers'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

export function RoomPage({ doc, lang }: { doc: SanityDoc; lang: Locale }) {
  const roomTitle = t<string>(doc.title as any, lang)

  return (
    <>
      <section className="relative flex min-h-[55vh] items-center">
        {doc.heroImage != null && (
          <div className="absolute inset-0 -z-10">
            <SanityImage
              image={doc.heroImage}
              lang={lang}
              sizes="100vw"
              priority
              decorative
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>
        )}
        <Container className="relative py-20 text-center text-white">
          <h1 className="font-display text-3xl tracking-wide md:text-5xl">{roomTitle}</h1>
          <p className="mt-3 text-xs tracking-[0.2em] uppercase">
            {[
              doc.areaSqm ? `${doc.areaSqm} m²` : null,
              t<string>(doc.view as any, lang),
              t<string>(doc.capacity as any, lang),
            ]
              .filter(Boolean)
              .join(' | ')}
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
            <div>
              <RichText value={doc.description} lang={lang} />
              <Button href={`/${lang}/reservation`} className="mt-6">
                Đặt phòng
              </Button>
            </div>

            {Array.isArray(doc.features) && doc.features.length > 0 && (
              <div className="bg-cream p-6">
                <h2 className="font-display text-gold-deep mb-4 text-xl">Tiện nghi phòng</h2>
                <ul className="space-y-3">
                  {(doc.features as any[]).map((feature: any, index: number) => (
                    <li key={feature._key ?? index} className="flex items-center gap-3 text-sm">
                      {feature.icon && (
                        <SanityImage
                          image={feature.icon}
                          lang={lang}
                          sizes="24px"
                          decorative
                          className="h-6 w-6 shrink-0 object-contain"
                        />
                      )}
                      <span>{t<string>(feature.label, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Container>
      </section>

      {Array.isArray(doc.gallery) && doc.gallery.length > 0 && (
        <section className="bg-cream py-16">
          <Container size="wide">
            <h2 className="font-display text-gold-deep mb-8 text-center text-3xl">Hình ảnh phòng</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(doc.gallery as any[]).map((image: any, index: number) => (
                <Reveal key={image._key ?? index} delay={index * 60}>
                  <SanityImage
                    image={image}
                    lang={lang}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    fallbackAlt={roomTitle}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
