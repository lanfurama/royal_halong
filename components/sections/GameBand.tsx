import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { CollapsibleList } from './CollapsibleGroup'

/**
 * Một khối TRÒ CHƠI của trang /casino: số thứ tự + tên trò + đoạn giới thiệu
 * + danh sách luật gập, đặt cạnh một bức ảnh tràn hết mép khung.
 *
 * Vì sao là component riêng chứ không phải `imageTextSection` + một cụm
 * `CollapsibleGroup` xếp dưới (đường đi mặc định của `SectionRenderer`):
 * ba thứ đó là MỘT đơn vị đọc. Khi chúng là ba section rời, mỗi cái mang
 * `py-16 lg:py-24` riêng, phần luật của Baccarat trôi cách phần giới thiệu
 * Baccarat gần 200px và đọc ra như một khối không liên quan — trong khi bản
 * gốc gói cả cụm vào một hàng hai cột.
 *
 * ẢNH TRÀN VIỀN mà chữ vẫn nằm đúng lưới `Container`: ảnh là một lớp
 * `absolute` bám mép section, cột chữ vẫn đi qua `Container` như mọi khối
 * khác. Cách này giữ lề trái của tên trò chơi thẳng hàng với tiêu đề của
 * những dải phía trên — thứ mà một lưới `grid-cols-[1fr_640px]` không làm
 * được, vì cột chữ khi đó đo từ mép màn hình chứ không từ khung nội dung.
 */

const BG = {
  white: 'bg-cream text-body',
  cream: 'bg-cream-alt text-body',
  ink: 'bg-ink on-dark text-cream-hi',
} as const

export function GameBand({
  index,
  section,
  rules,
  tone,
  imageSide,
  lang,
}: {
  /** Số thứ tự hiển thị (1 -> "01"). Cột sống thị giác của phần giữa trang. */
  index: number
  /** `imageTextSection` mang tên trò chơi, đoạn giới thiệu và ảnh. */
  section: any
  /** Các section `collapsible` đứng liền sau nó trong dữ liệu. */
  rules: any[]
  tone: keyof typeof BG
  imageSide: 'left' | 'right'
  lang: Locale
}) {
  const heading = t<string>(section?.heading, lang)
  const eyebrow = t<string>(section?.eyebrow, lang)
  const dark = tone === 'ink'
  const image = section?.image

  return (
    <section className={`relative overflow-hidden ${BG[tone]}`}>
      {/* Ảnh tràn viền — chỉ từ `lg` trở lên. Dưới ngưỡng đó nó nằm trong
          luồng, phía trên chữ (khối dưới cùng của file này). `44%` để cột
          chữ 52% của Container không bao giờ chạm vào ảnh: ở 1024px còn hở
          43px, ở 1440px còn hở 60px. */}
      {image && (
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 hidden w-[44%] lg:block ${
            imageSide === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <SanityImage
            image={image}
            lang={lang}
            sizes="44vw"
            decorative
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Ảnh ở khổ điện thoại: trong luồng, tỉ lệ 4:3 — cùng tỉ lệ mà
          `ImageTextSection` dùng, để hai kiểu khối không đá nhau về nhịp. */}
      {image && (
        <SanityImage
          image={image}
          lang={lang}
          sizes="100vw"
          fallbackAlt={heading}
          className="aspect-[4/3] w-full object-cover lg:hidden"
        />
      )}

      <Container size="wide" className="relative py-14 lg:py-24">
        <div className={`lg:w-[52%] ${imageSide === 'left' ? 'lg:ml-auto' : ''}`}>
          <div className="flex gap-6 lg:gap-7">
            {/* Cột số thứ tự + vạch dọc: cột sống của ba khối trò chơi. Không
                phải trang trí — nó là thứ duy nhất nói cho người đọc biết họ
                đang ở trò thứ mấy trong một chuỗi ba trò giống hệt nhau về
                hình dạng. `aria-hidden` vì số đó không thêm nghĩa gì cho
                người dùng screen reader: thứ tự đã nằm ở thứ tự đọc. */}
            <div aria-hidden="true" className="flex shrink-0 flex-col items-center gap-4">
              <span
                className={`font-display text-3xl leading-none lg:text-[2.5rem] ${
                  dark ? 'text-gold-hi' : 'text-gold-text'
                }`}
              >
                {String(index).padStart(2, '0')}
              </span>
              <span
                className={`w-px flex-1 ${dark ? 'bg-gold-hi/30' : 'bg-line'}`}
              />
            </div>

            <div className="min-w-0 flex-1">
              {eyebrow && (
                <p
                  className={`text-[0.6875rem] tracking-[0.18em] uppercase ${
                    dark ? 'text-gold-hi' : 'text-gold-text'
                  }`}
                >
                  {eyebrow}
                </p>
              )}
              {heading && (
                <h2
                  className={`font-display mt-3 text-[clamp(1.75rem,4vw,2.5rem)] tracking-[0.02em] ${
                    dark ? 'text-cream-hi' : ''
                  }`}
                >
                  {heading}
                </h2>
              )}

              <div
                className={`mt-5 max-w-prose text-[0.9375rem] leading-[1.8] ${
                  dark ? 'text-cream-dim' : ''
                }`}
              >
                <RichText value={section?.content} lang={lang} />
              </div>

              {rules.length > 0 && (
                <div className="mt-9">
                  <CollapsibleList sections={rules} lang={lang} dark={dark} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
