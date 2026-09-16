import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'

const BG = {
  white: 'bg-white text-body',
  cream: 'bg-cream text-body',
  ink: 'bg-ink on-dark text-white',
} as const

export function RichTextSection({
  heading,
  content,
  tone = 'white',
  narrow = true,
  lang,
}: any & { lang: Locale }) {
  return (
    <section className={`py-16 lg:py-24 ${BG[tone as keyof typeof BG] ?? BG.white}`}>
      <Container size={narrow ? 'narrow' : 'default'}>
        {heading && (
          <h2
            className={`font-display mb-6 text-[clamp(1.5rem,4vw,2.25rem)] ${
              tone === 'ink' ? 'text-gold-hi' : 'text-gold-deep'
            }`}
          >
            {t<string>(heading, lang)}
          </h2>
        )}
        <RichText value={content} lang={lang} />
      </Container>
    </section>
  )
}
