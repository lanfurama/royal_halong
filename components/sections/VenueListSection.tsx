import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { ui } from '@/lib/ui-strings'

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <dt className="text-gold-text min-w-28 text-xs tracking-widest uppercase">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function VenueListSection({ heading, resolved, lang }: any & { lang: Locale }) {
  // Cùng lớp lỗi với `cards` của CardGridSection: default parameter không bắt
  // được `null` tường minh, chỉ bắt `undefined`. `resolved` hôm nay luôn là
  // mảng khi đúng `_type`, nhưng phòng thủ đồng nhất với mọi section khác.
  const list: any[] = resolved ?? []
  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display mb-10 text-center text-3xl">
            {t<string>(heading, lang)}
          </h2>
        )}
        <div className="space-y-16">
          {list.map((venue: any, index: number) => {
            const venueName = t<string>(venue.name, lang)
            return (
              <article key={venue._id} className="grid items-start gap-8 md:grid-cols-2">
                <div className={index % 2 ? 'md:order-2' : ''}>
                  {venue.image && (
                    <SanityImage
                      image={venue.image}
                      lang={lang}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fallbackAlt={venueName}
                      className="h-auto w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-2xl">{venueName}</h3>
                  <div className="mt-3 text-sm">
                    <RichText value={venue.description} lang={lang} />
                  </div>
                  <dl className="mt-4 space-y-2">
                    <MetaRow label={ui('labelLocation', lang)} value={t<string>(venue.location, lang)} />
                    <MetaRow label={ui('labelCapacity', lang)} value={t<string>(venue.capacity, lang)} />
                    <MetaRow label={ui('labelHours', lang)} value={t<string>(venue.hours, lang)} />
                    <MetaRow label={ui('labelPhone', lang)} value={venue.phone} />
                  </dl>
                  {venue.highlights?.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {venue.highlights.map((item: any, i: number) => (
                        <li key={i} className="bg-cream-alt px-3 py-1 text-xs">
                          {t<string>(item, lang)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {venue.menuUrl && (
                    <a
                      href={venue.menuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-text mt-4 inline-block text-xs font-semibold tracking-wide uppercase underline underline-offset-4"
                    >
                      {ui('viewMenu', lang)}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
