import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'
import { Reveal } from '@/components/ui/Reveal'

const BG = {
  white: 'bg-white text-body',
  cream: 'bg-cream text-body',
  ink: 'bg-ink text-white',
} as const

export function ImageTextSection({
  heading,
  eyebrow,
  content,
  image,
  imageSide = 'left',
  tone = 'white',
  cta,
  lang,
}: any & { lang: Locale }) {
  // Ảnh minh hoạ nội dung, không phải ảnh nền trang trí -> cần fallbackAlt có
  // ý nghĩa. Dữ liệu liền kề duy nhất là tiêu đề của chính khối này.
  const headingText = t<string>(heading, lang)

  return (
    <section className={`py-16 ${BG[tone as keyof typeof BG] ?? BG.white}`}>
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal className={imageSide === 'right' ? 'md:order-2' : ''}>
            <SanityImage
              image={image}
              lang={lang}
              sizes="(max-width: 768px) 100vw, 50vw"
              fallbackAlt={headingText}
              className="h-auto w-full object-cover"
            />
          </Reveal>
          <Reveal delay={120}>
            {eyebrow && (
              <p
                className={`mb-3 text-xs tracking-[0.18em] uppercase ${
                  tone === 'ink' ? 'text-gold-hi' : 'text-gold-text'
                }`}
              >
                {t<string>(eyebrow, lang)}
              </p>
            )}
            {heading && (
              <h2
                className={`font-display mb-4 text-3xl ${
                  tone === 'ink' ? 'text-gold-hi' : 'text-gold-deep'
                }`}
              >
                {headingText}
              </h2>
            )}
            <RichText value={content} lang={lang} />
            {cta && (
              <SmartLink
                link={cta}
                lang={lang}
                className="text-gold-text mt-4 inline-block text-sm font-semibold tracking-wide uppercase underline underline-offset-4"
              />
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
