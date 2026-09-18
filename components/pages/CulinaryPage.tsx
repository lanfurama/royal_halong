import { t, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText, RichTextBlocks } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'
import { Reveal } from '@/components/ui/Reveal'
import { BUTTON_BASE_CLASSES, BUTTON_VARIANTS } from '@/components/ui/Button'
import { HeroSection } from '@/components/sections/HeroSection'
import { CtaBandSection } from '@/components/sections/CtaBandSection'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

/**
 * Trang /culinary là một BỐ CỤC RIÊNG, không phải một chuỗi section xếp dọc —
 * cùng khuôn mẫu và cùng lý do với trang chủ và `CasinoPage` (xem chú thích
 * đầu hai file đó).
 *
 * ── VÌ SAO TRANG NÀY CẦN BỐ CỤC RIÊNG ─────────────────────────────────────
 *
 * Đi qua `SectionRenderer`, trang Ẩm thực là tám dải xếp dọc giống hệt mọi
 * trang khác trong site, và phần nặng ký nhất của nó — bốn điểm ẩm thực —
 * rơi vào `VenueListSection`, khối dùng chung cho cả trang Trải nghiệm: ảnh
 * bên này, chữ bên kia, bốn dòng `dt/dd` cỡ 14px và mấy chip nền xám. Nội
 * dung thì đúng là một tờ thực đơn (tên điểm ăn, tầng, sức chứa, giờ mở, món
 * đặc trưng, link menu PDF) nhưng hình thức không nói lên điều đó ở bất cứ
 * chỗ nào: che ảnh đi thì trang này với trang Phòng nghỉ không phân biệt nổi.
 *
 * Bố cục dưới đây dựng theo mô-típ "tấm thực đơn in" — cùng ngôn ngữ hình mà
 * màn hình chờ đã chọn cho thương hiệu (giấy tờ khách sạn: khung kẻ đôi, hoa
 * văn chìm, hạt kim cương; phần CSS ở `app/globals.css`). Ba quy ước in ấn
 * được dùng, mỗi cái vì một lý do nội dung chứ không phải để trang trí:
 *
 *  1. TẤM THIỆP ĐẶT LÊN ẢNH (`.rhl-menucard`) — mỗi điểm ẩm thực là một tấm
 *     kem có khung kẻ đôi đè lên mép trong của ảnh, đánh số như một món trong
 *     thực đơn. Nó gom tên + mô tả + thông số + món đặc trưng + link menu
 *     thành MỘT đơn vị đọc, thay vì bốn cụm rời trôi cạnh một bức ảnh.
 *  2. HÀNG CHẤM NỐI (`.rhl-leader`) — "MỞ CỬA · · · · · 24/7". Đây là cách
 *     thực đơn in nối nhãn với giá trị, và nó xử lý đúng cái mà dữ liệu thật
 *     đòi hỏi: chỉ Phúc Viên có đủ bốn thông số, ba quầy bar thiếu giờ mở và
 *     sức chứa (bản clone không có, không bịa). Hàng nào trống thì biến mất,
 *     các hàng còn lại vẫn thẳng cột.
 *  3. MỤC LỤC (dải bốn mục cuối khối mở đầu) — trang có bốn điểm ăn nằm cách
 *     nhau hơn ba màn hình cuộn; đoạn mở đầu vừa kể tên cả bốn, nên ngay sau
 *     nó là chỗ duy nhất mục lục có ích.
 *
 * ── CHỌN KHỐI THEO CẤU TRÚC, KHÔNG THEO CHỈ SỐ ────────────────────────────
 *
 * `splitSections()` không đếm "khối thứ ba là nhịp một ngày" — nó đọc quan hệ
 * có thật trong dữ liệu (xem chú thích tại hàm). Biên tập viên chèn thêm một
 * khối ảnh-chữ hay đổi thứ tự thì trang vẫn xếp đúng chỗ.
 *
 * Hai hệ quả phải giữ, y như trang chủ và /casino:
 *
 *  1. Mỗi khối rút ra đều phải chịu được `undefined` — xoá một section trong
 *     Sanity thì trang mất đúng khối đó, không sập.
 *  2. Section nào KHÔNG thuộc bố cục này vẫn phải hiển thị: chúng gom vào
 *     `leftovers` và render bằng `SectionRenderer` ở cuối, thay vì biến mất
 *     không dấu vết.
 */

/* ------------------------------------------------------------------ *
 * Chia section thành các vai trò của bố cục
 * ------------------------------------------------------------------ */

export type CulinaryLayout = {
  hero?: any
  /** Khối mở đầu — khối ảnh-chữ đứng TRƯỚC danh sách điểm ẩm thực. */
  overture?: any
  venues?: any
  /** "Nhịp một ngày" — khối ảnh-chữ nhiều đoạn, không có nút. */
  rhythm?: any
  /** Các khối ảnh-chữ CÓ nút (đặt bàn, tiệc cưới) — xếp thành dải hai cột. */
  practical: any[]
  signature?: any
  ctaBand?: any
  leftovers: any[]
}

/**
 * Số đoạn văn nhiều nhất trong một khối, tính trên MỌI ngôn ngữ.
 *
 * Không đọc riêng `vi`: một ngày nào đó khối mới có thể dựng từ `en` trước.
 * Không tách theo dấu câu hay theo cụm chữ mở đầu ("Giữa trưa,", "Khuya,") —
 * mọi cách bóc chuỗi đều vỡ ở ngôn ngữ thứ hai.
 */
export function paragraphCount(section: any): number {
  const content = section?.content
  if (!content || typeof content !== 'object') return 0
  let max = 0
  for (const value of Object.values(content)) {
    if (Array.isArray(value)) max = Math.max(max, value.length)
  }
  return max
}

/**
 * Gán vai trò cho từng section theo QUAN HỆ CẤU TRÚC, không theo chỉ số:
 *
 *  - Khối ảnh-chữ đứng TRƯỚC danh sách điểm ẩm thực là lời mở đầu; đứng sau
 *    thì không còn là mở đầu nữa.
 *  - Trong các khối đứng sau, khối KHÔNG có nút và có từ ba đoạn trở lên là
 *    một mạch kể (trang này: bốn mốc trong ngày) — nó lên trục thời gian.
 *    Khối CÓ nút là một việc khách cần làm (đặt bàn, xem tiệc cưới) — nó vào
 *    dải hai cột, nơi hai nút nằm thẳng hàng nhau ở đáy.
 *
 * Mỗi vai trò chỉ nhận MỘT section (trừ `practical`); section thứ hai cùng
 * loại rơi xuống `leftovers` thay vì lặng lẽ ghi đè cái trước.
 */
export function splitSections(sections: any[]): CulinaryLayout {
  const layout: CulinaryLayout = { practical: [], leftovers: [] }
  let afterVenues = false

  for (const section of sections) {
    switch (section?._type) {
      case 'heroSection':
        if (!layout.hero) {
          layout.hero = section
          continue
        }
        break
      case 'venueListSection':
        if (!layout.venues) {
          layout.venues = section
          afterVenues = true
          continue
        }
        break
      case 'imageTextSection':
        if (!afterVenues) {
          if (!layout.overture) {
            layout.overture = section
            continue
          }
        } else if (!layout.rhythm && !section.cta && paragraphCount(section) >= 3) {
          layout.rhythm = section
          continue
        } else {
          layout.practical.push(section)
          continue
        }
        break
      case 'cardGridSection':
        if (!layout.signature) {
          layout.signature = section
          continue
        }
        break
      case 'ctaBandSection':
        if (!layout.ctaBand) {
          layout.ctaBand = section
          continue
        }
        break
    }
    layout.leftovers.push(section)
  }

  return layout
}

/** Neo cuộn của mục lục. `_id` thật có dấu chấm (`venue.piano-bar`) — hợp lệ
 * trong HTML nhưng phải thoát khi đưa vào selector CSS/`querySelector`, nên
 * quy về [A-Za-z0-9-] ngay tại đây thay vì để bẫy lại cho người sửa sau. */
function anchorId(venue: any, index: number): string {
  const raw = typeof venue?._id === 'string' ? venue._id : ''
  const safe = raw.replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return safe ? `dining-${safe}` : `dining-${index + 1}`
}

/** "01", "02"… Số thứ tự của món trong thực đơn — thuần trang trí, luôn
 * `aria-hidden`: thứ tự đã nằm sẵn trong thứ tự DOM. */
function numeral(index: number): string {
  return String(index + 1).padStart(2, '0')
}

const OUTLINE_BUTTON = `${BUTTON_BASE_CLASSES} ${BUTTON_VARIANTS.outline}`
const EYEBROW = 'text-[0.6875rem] tracking-[0.18em] uppercase'

/* ------------------------------------------------------------------ *
 * Mảnh dùng lại
 * ------------------------------------------------------------------ */

/** Hạt kim cương — dấu ngăn nhỏ giữa các món đặc trưng và mốc trên trục. */
function Diamond({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block rotate-45 ${className}`} />
}

/** Tiêu đề khối của trang này: huy hiệu hoa văn giữa hai nét kẻ, thay cho
 * vạch vàng ngắn của `SectionHeading`. Khác biệt có chủ ý và chỉ ở trang
 * này — nó là dấu hiệu "đây là một tờ thực đơn", không phải một biến thể
 * tuỳ hứng của tiêu đề chung. */
function BandHeading({
  heading,
  subheading,
  lang,
}: {
  heading?: any
  subheading?: any
  lang: Locale
}) {
  const headingText = t<string>(heading, lang)
  const subText = t<string>(subheading, lang)
  if (!headingText && !subText) return null

  return (
    <div className="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
      <div className="rhl-rule mx-auto max-w-[17rem]">
        <span aria-hidden="true" className="rhl-ornament" />
      </div>
      {headingText && (
        <h2 className="font-display mt-5 text-[clamp(1.5rem,4vw,2.25rem)]">{headingText}</h2>
      )}
      {subText && <p className="text-body mt-3 text-sm leading-relaxed">{subText}</p>}
    </div>
  )
}

/** Một hàng "nhãn · · · · · giá trị" của tấm thực đơn. Thiếu giá trị thì cả
 * hàng biến mất — ba quầy bar không có giờ mở cửa trong bản clone. */
function Leader({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="rhl-leader">
      <dt className={`text-muted whitespace-nowrap ${EYEBROW}`}>{label}</dt>
      <dd className="text-[0.875rem]">{value}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Khối mở đầu
 * ------------------------------------------------------------------ */

/** Lời mở đầu + mục lục bốn điểm ẩm thực.
 *
 * Chữ cái đầu dựng lớn bằng font tiêu đề là cùng thủ pháp (và cùng cặp
 * class) mà `HomeIntro` dùng cho đoạn mở đầu trang chủ — khối này giữ đúng
 * vai trò đó ở trang Ẩm thực, nên dùng lại thay vì phát minh một cách nhấn
 * thứ hai. Chỉ bật từ `lg`: dưới đó cột chữ hẹp, chữ dựng 3.5rem ăn mất hai
 * dòng đầu.
 */
function Overture({ section, venues, lang }: { section: any; venues: any[]; lang: Locale }) {
  const eyebrow = t<string>(section?.eyebrow, lang)
  const heading = t<string>(section?.heading, lang)

  return (
    <section className="bg-cream pt-14 pb-16 lg:pt-20 lg:pb-24">
      <Container size="wide">
        <div className="grid items-center gap-10 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <Reveal>
            <span aria-hidden="true" className="bg-gold mb-5 block h-px w-12" />
            {eyebrow && <p className={`text-gold-text ${EYEBROW}`}>{eyebrow}</p>}
            {heading && (
              <h2 className="font-display mt-3 text-[clamp(1.75rem,4.2vw,2.875rem)]">{heading}</h2>
            )}
            <div className="mt-6 max-w-prose text-[0.9375rem] leading-[1.85] text-pretty [&>p:first-of-type]:text-[clamp(1.0625rem,1.7vw,1.25rem)] [&>p:first-of-type]:leading-[1.65] lg:[&>p:first-of-type::first-letter]:font-display lg:[&>p:first-of-type::first-letter]:text-gold-deep lg:[&>p:first-of-type::first-letter]:float-left lg:[&>p:first-of-type::first-letter]:mt-1 lg:[&>p:first-of-type::first-letter]:mr-2.5 lg:[&>p:first-of-type::first-letter]:text-[3.5rem] lg:[&>p:first-of-type::first-letter]:leading-[0.8]">
              <RichText value={section?.content} lang={lang} />
            </div>
          </Reveal>

          {section?.image && (
            <Reveal delay={140} className="relative">
              {/* Khung viền lệch phía sau ảnh — chi tiết của bản thiết kế,
                  cùng chi tiết mà khối giới thiệu trang chủ dùng. */}
              <span
                aria-hidden="true"
                className="border-gold/40 pointer-events-none absolute inset-0 translate-x-4 translate-y-4 border"
              />
              <SanityImage
                image={section.image}
                lang={lang}
                sizes="(max-width: 1024px) 100vw, 46vw"
                fallbackAlt={heading}
                className="relative aspect-[4/5] w-full object-cover"
              />
            </Reveal>
          )}
        </div>

        {venues.length > 0 && (
          <nav
            aria-label={ui('diningIndex', lang)}
            className="border-line mt-14 border-t pt-8 lg:mt-20"
          >
            <ol className="grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {venues.map((venue: any, index: number) => {
                const name = t<string>(venue.name, lang)
                const where = t<string>(venue.location, lang)
                if (!name) return null
                return (
                  <li key={venue._id ?? index}>
                    <a
                      href={`#${anchorId(venue, index)}`}
                      className="group flex min-h-11 items-baseline gap-3 py-1"
                    >
                      <span aria-hidden="true" className="font-display text-gold-deep text-sm">
                        {numeral(index)}
                      </span>
                      <span className="flex-1">
                        <span className="font-display block text-[1.0625rem] underline-offset-4 group-hover:underline">
                          {name}
                        </span>
                        {where && (
                          <span className="text-muted mt-0.5 block text-xs leading-snug">
                            {where}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Bốn điểm ẩm thực — mỗi nơi một "món" trong thực đơn
 * ------------------------------------------------------------------ */

function VenueCourse({ venue, index, lang }: { venue: any; index: number; lang: Locale }) {
  const name = t<string>(venue.name, lang)
  // Lọc TRƯỚC khi dựng: hạt kim cương ngăn giữa các mục đặt theo vị trí trong
  // danh sách ĐÃ lọc, nên một mục trống không để lại dấu ngăn mồ côi.
  const highlights = (((venue.highlights as any[]) ?? [])
    .map((item) => t<string>(item, lang))
    .filter(Boolean) as string[])

  // Ảnh đổi bên theo thứ tự — nhịp của một chuỗi, không phải thuộc tính của
  // từng điểm ăn. Thêm điểm thứ năm thì nó tự nhận bên còn lại.
  const flip = index % 2 === 1

  return (
    <article id={anchorId(venue, index)} className="scroll-mt-[calc(var(--header-h)+1.5rem)]">
      {/* Ngưỡng đổi bố cục là `nav` (1180px), KHÔNG phải `lg` (1024px) — hai
          lý do, cả hai đo được:

          1. Đó đúng là ngưỡng header đổi giữa menu ngang và hamburger (xem
             `--breakpoint-nav` trong `app/globals.css`), nên trang không rơi
             vào cảnh chạy bố cục "desktop" trong khi điều hướng vẫn "mobile".
          2. Ở bố cục đè, chiều cao ẢNH bám chiều cao TẤM THIỆP (xem ghi chú
             bên dưới). Đo ở 1024px: thiệp cao 865px trong khi cột ảnh chỉ
             rộng 542px — `object-cover` cắt ảnh nhà hàng (gốc 3:2) xuống một
             dải dọc 0.57, mất hai phần ba bề ngang khung hình. Từ 1180px trở
             lên tỉ lệ về 0.73–0.91, tức vẫn là ảnh chứ không phải một vệt. */}
      <div className="grid nav:grid-cols-12">
        <Reveal
          className={`nav:row-start-1 ${
            flip ? 'nav:col-start-6 nav:col-end-13' : 'nav:col-start-1 nav:col-end-8'
          }`}
        >
          <SanityImage
            image={venue.image}
            lang={lang}
            sizes="(max-width: 1180px) 100vw, 60vw"
            fallbackAlt={name}
            className="h-64 w-full object-cover sm:h-80 lg:h-[26rem] nav:h-full"
          />
        </Reveal>

        {/* Tấm thiệp đè lên mép trong của ảnh: từ `nav` nó đè đúng MỘT cột
            lưới (~110px ở 1440px) và thụt 40px trên–dưới, nên ảnh vẫn lộ ra ở
            cả bốn phía và cả khối đọc ra là "thiệp đặt trên ảnh" — đồng thời
            chiều cao ảnh bám theo chiều cao thiệp, không phải một con số chép
            tay. Dưới `nav` không còn bề ngang để đè ngang, nên nó kéo lên đè
            mép DƯỚI của ảnh — cùng cách xoay xở mà `CasinoPage` dùng.

            `nav:mt-10` (không phải `nav:my-10`): `-mt-14` và `my-*` là hai
            thuộc tính khác nhau, thứ tự thắng thua giữa chúng do thứ tự trong
            stylesheet quyết định chứ không do thứ tự trong chuỗi className —
            cùng lớp bẫy đã ghi ở `components/ui/Button.tsx`. Ghi đè cùng một
            thuộc tính (`mt`) thì biến thể `nav:` chắc chắn đứng sau. */}
        <Reveal
          delay={120}
          className={`relative z-10 -mt-14 px-4 sm:px-8 nav:row-start-1 nav:mt-10 nav:mb-10 nav:px-0 ${
            flip ? 'nav:col-start-1 nav:col-end-7' : 'nav:col-start-7 nav:col-end-13'
          }`}
        >
          <div className="rhl-menucard border-gold/40 border p-7 sm:p-9 lg:p-10">
            <div aria-hidden="true" className="flex items-center gap-4">
              <span className="font-display text-gold-deep text-[1.75rem] leading-none">
                {numeral(index)}
              </span>
              <span className="bg-line h-px flex-1" />
            </div>

            {name && (
              <h3 className="font-display mt-4 text-[clamp(1.375rem,2.6vw,1.875rem)]">{name}</h3>
            )}

            <div className="mt-4 text-[0.9375rem] leading-[1.8] [&_p:last-child]:mb-0">
              <RichText value={venue.description} lang={lang} />
            </div>

            <dl className="border-line mt-7 space-y-3 border-t pt-5">
              <Leader label={ui('labelLocation', lang)} value={t<string>(venue.location, lang)} />
              <Leader label={ui('labelCapacity', lang)} value={t<string>(venue.capacity, lang)} />
              <Leader label={ui('labelHours', lang)} value={t<string>(venue.hours, lang)} />
              <Leader label={ui('labelPhone', lang)} value={venue.phone} />
            </dl>

            {highlights.length > 0 && (
              <div className="mt-7">
                <p className={`text-gold-text ${EYEBROW}`}>{ui('labelHighlights', lang)}</p>
                {/* Một hàng chữ có hạt kim cương ngăn giữa, không phải mấy
                    chip nền xám: đây là tên món và tên đồ uống — thứ đáng đọc
                    như chữ trong thực đơn, không phải nhãn phân loại. */}
                <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.9375rem]">
                  {highlights.map((item, i) => (
                    <li key={item} className="flex items-center gap-3">
                      {i > 0 && <Diamond className="bg-gold/70 size-[5px]" />}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {venue.menuUrl && (
              <a
                href={venue.menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${OUTLINE_BUTTON} mt-8`}
              >
                {ui('viewMenu', lang)}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </article>
  )
}

function VenueCourses({ section, venues, lang }: { section: any; venues: any[]; lang: Locale }) {
  if (venues.length === 0) return null
  return (
    <section className="bg-cream-alt py-16 lg:py-24">
      <Container size="wide">
        <BandHeading heading={section?.heading} lang={lang} />
        <div className="space-y-16 lg:space-y-24">
          {venues.map((venue: any, index: number) => (
            <VenueCourse key={venue._id ?? index} venue={venue} index={index} lang={lang} />
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Nhịp một ngày — trục dọc trên nền tối
 * ------------------------------------------------------------------ */

/** Khối này là thứ DUY NHẤT trên trang nằm trên nền nâu mực, và đó là chủ ý:
 * nội dung của nó đi từ giữa trưa tới khuya, nên nó vừa là chỗ đổi nhịp thị
 * giác giữa hai dải kem dài, vừa là chỗ duy nhất "buổi tối" có nghĩa.
 *
 * Mỗi ĐOẠN trong Sanity thành một mốc trên trục. Chỉ xếp trục khi mọi đoạn
 * đều là đoạn văn thường — biên tập viên chèn danh sách hay tiêu đề con thì
 * khối rơi về cách đọc bình thường, không cắt vụn cấu trúc của họ.
 */
function DayRhythm({ section, lang }: { section: any; lang: Locale }) {
  const eyebrow = t<string>(section?.eyebrow, lang)
  const heading = t<string>(section?.heading, lang)
  const blocks = t<any[]>(section?.content, lang) ?? []
  const onTrack =
    blocks.length >= 2 &&
    blocks.every(
      (block: any) => block?._type === 'block' && !block.listItem && block.style === 'normal',
    )

  return (
    <section className="bg-ink on-dark py-16 lg:py-24">
      <Container size="wide">
        <div className="grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          {section?.image && (
            <Reveal className="relative">
              <span
                aria-hidden="true"
                className="border-gold-hi/30 pointer-events-none absolute inset-0 translate-x-4 translate-y-4 border"
              />
              <SanityImage
                image={section.image}
                lang={lang}
                sizes="(max-width: 1024px) 100vw, 40vw"
                fallbackAlt={heading}
                className="relative aspect-[4/5] w-full object-cover"
              />
            </Reveal>
          )}

          <Reveal delay={140}>
            {eyebrow && <p className={`text-gold-hi ${EYEBROW}`}>{eyebrow}</p>}
            {heading && (
              <h2 className="font-display text-cream-hi mt-3 text-[clamp(1.5rem,4vw,2.25rem)]">
                {heading}
              </h2>
            )}

            {onTrack ? (
              /* `max-w-[42rem]`: cột phải rộng 770px ở 1440px, để chạy hết
                 thì mỗi dòng ~100 ký tự — quá dài để mắt bắt được đầu dòng
                 kế tiếp. Cùng lý do với `max-w-prose` của `ImageTextSection`,
                 chỉ nới hơn một chút vì dòng ở đây ngắn sẵn do có trục và
                 hạt kim cương đẩy vào. */
              <ol className="border-gold-hi/25 mt-8 max-w-[42rem] space-y-8 border-l pl-8">
                {blocks.map((block: any, index: number) => (
                  <li key={block._key ?? index} className="relative">
                    {/* Hạt kim cương đậu ĐÚNG trên nét trục: lùi trái bằng
                        `pl-8` của danh sách cộng nửa cạnh hạt. */}
                    <Diamond className="bg-gold-hi absolute top-[0.55rem] -left-[calc(2rem+5px)] size-2.5" />
                    <div className="text-cream-hi/85 text-[0.9375rem] leading-[1.85] [&_p]:mb-0">
                      <RichTextBlocks blocks={[block]} lang={lang} />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-cream-hi/85 mt-6 max-w-prose text-[0.9375rem] leading-[1.85]">
                <RichTextBlocks blocks={blocks} lang={lang} />
              </div>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Việc cần làm — đặt bàn & tiệc cưới
 * ------------------------------------------------------------------ */

/** Hai (hoặc hơn) khối ảnh-chữ CÓ nút, xếp cạnh nhau thành dải hai cột.
 *
 * Xếp dọc rời nhau như `SectionRenderer` làm thì đây là hai dải ảnh-chữ giống
 * hệt nhau nối tiếp, cao gần 1.400px, trong khi chúng cùng trả lời một câu:
 * "muốn ăn ở đây thì làm gì tiếp". Đặt cạnh nhau, hai nút nằm thẳng hàng ở
 * đáy (`mt-auto`) và khách so được hai lối đi trong một tầm mắt.
 */
function ThingsToDo({ sections, lang }: { sections: any[]; lang: Locale }) {
  if (sections.length === 0) return null
  return (
    <section className="bg-cream py-16 lg:py-24">
      <Container size="wide">
        <div
          className={`grid gap-12 md:gap-8 lg:gap-14 ${
            // Một khối lẻ thì không dựng lưới hai cột với một ô trống toang:
            // cho nó một cột hẹp căn giữa. Ba khối trở lên vẫn chạy hai cột,
            // khối cuối tự xuống hàng.
            sections.length === 1 ? 'mx-auto max-w-2xl' : 'md:grid-cols-2'
          }`}
        >
          {sections.map((section: any, index: number) => {
            const eyebrow = t<string>(section?.eyebrow, lang)
            const heading = t<string>(section?.heading, lang)
            return (
              <Reveal key={section?._key ?? index} delay={index * 120} className="h-full">
                <article className="flex h-full flex-col">
                  {section?.image && (
                    <SanityImage
                      image={section.image}
                      lang={lang}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      fallbackAlt={heading}
                      className="aspect-[3/2] w-full object-cover"
                    />
                  )}
                  <div className="rhl-menucard border-gold/35 relative z-10 -mt-12 mx-4 flex flex-1 flex-col border p-7 sm:mx-8 lg:p-9">
                    {eyebrow && <p className={`text-gold-text ${EYEBROW}`}>{eyebrow}</p>}
                    {heading && (
                      <h2 className="font-display mt-3 text-[clamp(1.375rem,2.6vw,1.75rem)]">
                        {heading}
                      </h2>
                    )}
                    <div className="mt-4 text-[0.9375rem] leading-[1.8] [&_p:last-child]:mb-0">
                      <RichText value={section?.content} lang={lang} />
                    </div>
                    {section?.cta && (
                      <div className="mt-auto pt-7">
                        <SmartLink link={section.cta} lang={lang} className={OUTLINE_BUTTON} />
                      </div>
                    )}
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

/* ------------------------------------------------------------------ *
 * Sáu khoảnh khắc đặc trưng
 * ------------------------------------------------------------------ */

/** Khác `CardGridSection` dùng chung ở chỗ chữ nằm DƯỚI ảnh trên mặt kem,
 * không đè lên ảnh.
 *
 * Lý do là nội dung: sáu tấm này đều là ảnh MÓN ĂN và bàn tiệc chụp cận, tối
 * và nhiều chi tiết. Lớp phủ nâu vàng của lưới dùng chung ăn mất ~70% chiều
 * cao mỗi thẻ ở lưới 3 cột (xem tính toán ở `.scrim-card` trong
 * `app/globals.css`) — tức phần đáng nhìn nhất của đúng những bức ảnh đó.
 * Đặt chữ xuống dưới thì ảnh còn nguyên, chữ đọc trên nền kem ĐẶC
 * (`--color-muted` trên `--color-cream-soft` = 4.83:1, đạt AA) thay vì trên
 * một dải chuyển màu.
 */
function SignatureGrid({ section, lang }: { section: any; lang: Locale }) {
  const cards: any[] = section?.cards ?? []
  if (cards.length === 0) return null

  return (
    <section className="bg-cream-alt py-16 lg:py-24">
      <Container size="wide">
        <BandHeading heading={section?.heading} subheading={section?.subheading} lang={lang} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {cards.map((card: any, index: number) => {
            const title = t<string>(card.title, lang)
            const description = t<string>(card.description, lang)
            return (
              <Reveal key={card._key ?? index} delay={index * 90} className="h-full">
                <article className="border-line bg-cream-soft flex h-full flex-col border">
                  {card.image && (
                    <SanityImage
                      image={card.image}
                      lang={lang}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 440px"
                      fallbackAlt={title}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    {/* Vạch vàng ngắn — cùng dấu hiệu thương hiệu mà
                        `SectionHeading` dùng, ở đây giữ sáu thẻ này khỏi rơi
                        về hình dạng thẻ ảnh-chữ mặc định của bất kỳ site nào. */}
                    <span aria-hidden="true" className="bg-gold mb-4 block h-px w-8" />
                    {title && <h3 className="font-display text-[1.25rem] leading-snug">{title}</h3>}
                    {description && (
                      <p className="text-muted mt-2.5 text-sm leading-relaxed">{description}</p>
                    )}
                    {card.cta && (
                      <div className="mt-auto pt-5">
                        <SmartLink
                          link={card.cta}
                          lang={lang}
                          className="text-gold-text inline-flex min-h-11 items-center gap-2 text-xs font-semibold tracking-widest uppercase hover:underline"
                        />
                      </div>
                    )}
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

/* ------------------------------------------------------------------ *
 * Trang
 * ------------------------------------------------------------------ */

export function CulinaryPage({
  doc,
  lang,
  settings,
  currentSlug,
}: {
  doc: any
  lang: Locale
  settings?: any
  currentSlug?: string
}) {
  const sections = ((doc?.sections as any[]) ?? []).filter(Boolean)
  const layout = splitSections(sections)
  const venues: any[] = layout.venues?.resolved ?? []

  return (
    <>
      {/* `heroSection` phải là con ĐẦU TIÊN của <main> thì header mới trôi
          trong suốt lên ảnh — xem CLAUDE.md § Header. */}
      {layout.hero && <HeroSection {...layout.hero} lang={lang} isFirst />}

      {layout.overture && <Overture section={layout.overture} venues={venues} lang={lang} />}

      {layout.venues && <VenueCourses section={layout.venues} venues={venues} lang={lang} />}

      {layout.rhythm && <DayRhythm section={layout.rhythm} lang={lang} />}

      <ThingsToDo sections={layout.practical} lang={lang} />

      {layout.signature && <SignatureGrid section={layout.signature} lang={lang} />}

      {layout.ctaBand && <CtaBandSection {...layout.ctaBand} lang={lang} />}

      {/* Section biên tập viên thêm mà bố cục trên không có chỗ — xem ghi chú
          (2) ở đầu file. */}
      {layout.leftovers.length > 0 && (
        <SectionRenderer
          sections={layout.leftovers}
          lang={lang}
          widgetId={settings?.secureBookingsWidgetId}
          siteSettings={settings}
          currentSlug={currentSlug}
        />
      )}
    </>
  )
}
