import { t, type Locale } from '@/lib/i18n'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'

const HEIGHTS = {
  full: 'min-h-[85vh]',
  medium: 'min-h-[55vh]',
  short: 'min-h-[35vh]',
} as const

export function HeroSection({
  heading,
  subheading,
  background,
  cta,
  height = 'medium',
  lang,
  isFirst,
}: any & { lang: Locale; isFirst?: boolean }) {
  return (
    <section
      className={`relative flex items-center ${HEIGHTS[height as keyof typeof HEIGHTS] ?? HEIGHTS.medium}`}
    >
      {background && (
        <div className="absolute inset-0 -z-10">
          <SanityImage
            image={background}
            lang={lang}
            sizes="100vw"
            priority={isFirst}
            decorative
            className="h-full w-full object-cover"
          />
          {/* Lớp phủ để chữ trắng đạt tương phản trên mọi ảnh nền. */}
          <div className="absolute inset-0 bg-black/45" />
        </div>
      )}
      <Container className="relative py-20 text-center text-white">
        <h1 className="font-display text-3xl tracking-wide md:text-5xl">{t<string>(heading, lang)}</h1>
        {subheading && (
          <p className="mx-auto mt-4 max-w-2xl text-sm tracking-widest uppercase md:text-base">
            {t<string>(subheading, lang)}
          </p>
        )}
        {cta && (
          <SmartLink
            link={cta}
            lang={lang}
            className="bg-gold text-ink hover:bg-gold-hi mt-8 inline-block px-8 py-3 text-sm font-semibold tracking-wide uppercase"
          />
        )}
      </Container>
    </section>
  )
}
