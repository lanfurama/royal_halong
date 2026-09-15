import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { Button } from '@/components/ui/Button'
import { hrefFor } from '@/lib/routes'
import { Reveal } from '@/components/ui/Reveal'

export function RoomListSection({ heading, resolved = [], lang }: any & { lang: Locale }) {
  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-10 text-center text-3xl">
            {t<string>(heading, lang)}
          </h2>
        )}
        <div className="grid gap-8 md:grid-cols-2">
          {resolved.map((room: any, index: number) => {
            const roomTitle = t<string>(room.title, lang)
            return (
              <Reveal key={room._id} delay={index * 90}>
                <article className="bg-cream h-full">
                  {room.heroImage && (
                    <SanityImage
                      image={room.heroImage}
                      lang={lang}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fallbackAlt={roomTitle}
                      className="aspect-[3/2] w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    {/* 20px, không đạt ngưỡng "chữ lớn" của gold-deep (>=24px) ->
                        dùng gold-text (5.32:1 trên trắng), vẫn giữ cỡ chữ card title. */}
                    <h3 className="font-display text-gold-text text-xl">{roomTitle}</h3>
                    <p className="text-gold-text mt-1 text-xs tracking-widest uppercase">
                      {[
                        room.areaSqm ? `${room.areaSqm} m²` : null,
                        t<string>(room.view, lang),
                        t<string>(room.capacity, lang),
                      ]
                        .filter(Boolean)
                        .join(' | ')}
                    </p>
                    {room.summary && <p className="mt-3 text-sm">{t<string>(room.summary, lang)}</p>}
                    <Button href={hrefFor(lang, room.slug)} variant="ghost" className="mt-4">
                      Xem chi tiết
                    </Button>
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
