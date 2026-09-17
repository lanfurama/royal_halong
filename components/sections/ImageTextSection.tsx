import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'
import { Reveal } from '@/components/ui/Reveal'
import { LINK_CTA_CLASSES } from '@/components/ui/Button'

// Xem ghi chú cùng nội dung ở `RichTextSection.tsx`.
const BG = {
  white: 'bg-cream text-body',
  cream: 'bg-cream-alt text-body',
  ink: 'bg-ink on-dark text-cream-hi',
} as const

export function ImageTextSection({
  heading,
  eyebrow,
  content,
  image,
  imageSide = 'left',
  imageFit = 'cover',
  tone = 'white',
  cta,
  lang,
}: any & { lang: Locale }) {
  // Ảnh minh hoạ nội dung, không phải ảnh nền trang trí -> cần fallbackAlt có
  // ý nghĩa. Dữ liệu liền kề duy nhất là tiêu đề của chính khối này.
  const headingText = t<string>(heading, lang)
  const dark = tone === 'ink'

  // `cover` + khung 4:3 cứng là mặc định đúng cho ẢNH CHỤP: mọi khối ảnh-chữ
  // trên site cao bằng nhau bất kể biên tập viên tải lên ảnh ngang hay dọc.
  // Nhưng nó PHÁ HỎNG ảnh mà nội dung nằm ở rìa: dải 3 mã QR (935×340) của
  // /casino bị 4:3 cắt mất hai mã ngoài cùng, mã còn lại bị xén mất góc định
  // vị — quét không ra. Với `contain`, ảnh giữ đúng tỉ lệ gốc (`aspect-auto`)
  // và `SanityImage` đã phát ra `width`/`height` thật nên không có layout
  // shift.
  const contain = imageFit === 'contain'
  const imageClasses = contain
    ? 'w-full object-contain'
    : 'shadow-card aspect-[4/3] w-full rounded-media object-cover'

  return (
    <section className={`py-16 lg:py-24 ${BG[tone as keyof typeof BG] ?? BG.white}`}>
      <Container size="wide">
        {/* Ngưỡng đổi bố cục là `lg` (1024px) — ĐÚNG ngưỡng header đổi giữa
            menu ngang và hamburger. Trước đây khối này đổi ở `md` (768px),
            nên trong dải 768–1023px trang chạy bố cục "desktop" hai cột
            trong khi điều hướng vẫn là "mobile": ảnh co còn 336px và đoạn
            văn tiếng Việt xuống 5–6 dòng rất hẹp. Một ngưỡng duy nhất. */}
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <Reveal className={imageSide === 'right' ? 'lg:order-2' : ''}>
            <SanityImage
              image={image}
              lang={lang}
              sizes="(max-width: 1024px) 100vw, 620px"
              fallbackAlt={headingText}
              className={imageClasses}
            />
          </Reveal>

          <Reveal delay={120}>
            {eyebrow && (
              <p
                className={`mb-3 text-xs tracking-[0.18em] uppercase ${
                  dark ? 'text-gold-hi' : 'text-gold-text'
                }`}
              >
                {t<string>(eyebrow, lang)}
              </p>
            )}
            {heading && (
              <h2
                className={`font-display mb-5 text-[clamp(1.5rem,4vw,2.25rem)] ${
                  dark ? 'text-cream-hi' : ''
                }`}
              >
                {headingText}
              </h2>
            )}
            {/* `max-w-prose` (~65 ký tự/dòng): ở 1440px cột này rộng 620px,
                đủ cho ~95 ký tự mỗi dòng — quá dài để mắt bắt được đầu dòng
                kế tiếp. */}
            <div className="max-w-prose">
              <RichText value={content} lang={lang} />
            </div>
            {cta && (
              <SmartLink
                link={cta}
                lang={lang}
                className={dark ? `${LINK_CTA_CLASSES} text-gold-hi` : LINK_CTA_CLASSES}
              />
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
