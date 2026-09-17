import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'
import { CTA_BAND_BUTTON_CLASSES } from '@/components/ui/Button'
import { HeroSection } from '@/components/sections/HeroSection'
import { GalleryCarouselSection } from '@/components/sections/GalleryCarouselSection'
import { CardGridSection } from '@/components/sections/CardGridSection'
import { CtaBandSection } from '@/components/sections/CtaBandSection'
import { GameBand } from '@/components/sections/GameBand'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

/**
 * Trang /casino là một BỐ CỤC RIÊNG, không phải một chuỗi section xếp dọc.
 *
 * Cùng lý do và cùng khuôn mẫu với trang chủ (xem chú thích đầu
 * `app/(site)/[lang]/page.tsx`): bản thiết kế gộp và sắp lại các khối theo
 * cách `SectionRenderer` không diễn đạt được.
 *
 *  - Ba trò chơi: mỗi trò là MỘT đơn vị đọc gồm tên trò + đoạn giới thiệu +
 *    ảnh tràn viền + danh sách luật gập. Trong dữ liệu chúng là 1
 *    `imageTextSection` cộng 2–4 section `collapsible` đứng liền sau; xếp dọc
 *    rời nhau thì phần luật trôi cách phần giới thiệu gần 200px.
 *  - Nhịp nền đan xen sáng–tối chạy theo THỨ TỰ trò chơi, nên nó là thuộc
 *    tính của bố cục chứ không phải của từng section: `tone` lưu trong Sanity
 *    chỉ còn dùng cho đường đi mặc định của `SectionRenderer`.
 *  - Hai khối đóng trang (quầy bar, thông tin liên hệ) mỗi cái một hình dạng
 *    riêng, phân biệt bằng `imageFit` — xem `closingLayout()` bên dưới.
 *
 * Hai hệ quả phải giữ, y như trang chủ:
 *
 *  1. Mỗi khối rút ra đều phải chịu được `undefined` — biên tập viên xoá một
 *     section trong Sanity thì trang mất đúng khối đó, không sập.
 *  2. Section nào KHÔNG thuộc bố cục này vẫn phải hiển thị. Chúng được gom
 *     vào `leftovers` và render bằng `SectionRenderer` ở cuối, thay vì biến
 *     mất không dấu vết.
 */

const COLLAPSIBLE_TYPES = new Set(['richTextSection', 'tableSection'])
const isCollapsible = (section: any): boolean =>
  section?.collapsible === true && COLLAPSIBLE_TYPES.has(section?._type)

type Unit =
  /** Một `imageTextSection` và các khối gập đứng liền sau nó. */
  | { kind: 'imageText'; section: any; rules: any[] }
  | { kind: 'plain'; section: any }

/**
 * Gom section thành đơn vị đọc. Một `imageTextSection` "nuốt" mọi section
 * `collapsible` đứng NGAY SAU nó — đó chính là quan hệ "trò chơi ↔ luật của
 * trò chơi đó" mà dữ liệu diễn đạt bằng thứ tự.
 */
export function toUnits(sections: any[]): Unit[] {
  const units: Unit[] = []
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i]
    if (section?._type !== 'imageTextSection') {
      units.push({ kind: 'plain', section })
      continue
    }
    const rules: any[] = []
    while (i + 1 < sections.length && isCollapsible(sections[i + 1])) {
      rules.push(sections[i + 1])
      i += 1
    }
    units.push({ kind: 'imageText', section, rules })
  }
  return units
}

/**
 * Hình dạng của một khối ảnh-chữ KHÔNG phải trò chơi (không có luật gập).
 *
 * `contain` nghĩa là "ảnh này không được phép cắt" — trên trang này đó là dải
 * ba mã QR. Một bức ảnh như vậy cần được nhìn TRỌN trong khung riêng của nó,
 * nên nó đi với bố cục hai cột có khung viền. Ảnh `cover` là ảnh chụp không
 * gian (quầy bar): nó chịu được cắt và đủ lớn để làm nền cho một thẻ chữ đè
 * lên — cùng thủ pháp đan xen của khối giới thiệu trang chủ.
 */
function closingLayout(section: any): 'panel' | 'overlap' {
  return section?.imageFit === 'contain' ? 'panel' : 'overlap'
}

/** Quầy bar: ảnh rộng tràn mép, thẻ chữ kính mờ đè lên mép trong của ảnh. */
function OverlapBlock({ section, lang }: { section: any; lang: Locale }) {
  const heading = t<string>(section?.heading, lang)
  const eyebrow = t<string>(section?.eyebrow, lang)

  return (
    <section className="bg-cream-alt py-14 lg:py-24">
      <div className="relative lg:min-h-[26rem]">
        {section?.image && (
          /* 72% chứ không phải 66%: thẻ chữ là "kính mờ" (`bg-cream-soft/72`
             + blur), nên phần thẻ nằm NGOÀI ảnh đọc ra màu kem đặc còn phần
             nằm TRÊN ảnh thì trong mờ — một cái thẻ hai màu, trông như lỗi
             dựng. Đo ở 1440px: với 66% thẻ chỉ đè 24% bề ngang của chính nó;
             với 72% + thẻ 46% thì đè 43%, đủ để cả khối đọc ra là một tấm
             kính đặt lên ảnh (cùng tỉ lệ đè mà khối giới thiệu trang chủ
             dùng). */
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-[72%]">
            <SanityImage
              image={section.image}
              lang={lang}
              sizes="(max-width: 1024px) 100vw, 72vw"
              fallbackAlt={heading}
              className="h-56 w-full object-cover sm:h-72 lg:h-full"
            />
          </div>
        )}

        <Container size="wide" className="relative lg:flex lg:min-h-[26rem] lg:items-center">
          {/* `-mt-10` ở khổ điện thoại: thẻ chồng lên mép dưới của ảnh thay vì
              xếp rời bên dưới — giữ được ý "đan xen" của bản thiết kế ở chỗ
              không còn đủ bề ngang để đè ngang. */}
          <div className="border-gold/35 bg-cream-soft/72 relative -mt-10 border p-7 backdrop-blur-[3px] sm:p-9 lg:mt-0 lg:w-[46%] lg:p-10">
            <span aria-hidden="true" className="bg-gold mb-5 block h-px w-10" />
            {eyebrow && (
              <p className="text-gold-text text-[0.6875rem] tracking-[0.18em] uppercase">
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className="font-display mt-3 text-[clamp(1.5rem,4vw,2.25rem)]">{heading}</h2>
            )}
            <div className="mt-4 text-[0.9375rem] leading-[1.8]">
              <RichText value={section?.content} lang={lang} />
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

/** Thông tin liên hệ: chữ một bên, ảnh hiện TRỌN trong khung viền bên kia. */
function PanelBlock({ section, lang }: { section: any; lang: Locale }) {
  const heading = t<string>(section?.heading, lang)

  return (
    <section className="bg-cream py-14 lg:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <div>
            <span aria-hidden="true" className="bg-gold mb-5 block h-px w-12" />
            {heading && (
              <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)]">{heading}</h2>
            )}
            {/* Hai số điện thoại là HÀNH ĐỘNG chính của khối này, nhưng trong
                dữ liệu chúng chỉ là gạch đầu dòng. Phóng cỡ chữ của chính các
                mục đó thay vì tách số ra khỏi câu bằng regex — bóc chuỗi kiểu
                đó vỡ ngay ở ngôn ngữ thứ hai, nơi nhãn và số đổi chỗ. */}
            <div className="mt-6 text-[0.9375rem] leading-[1.8] [&_li]:font-display [&_li]:text-[1.375rem] [&_li]:leading-snug [&_ul]:list-none [&_ul]:space-y-4 [&_ul]:pl-0">
              <RichText value={section?.content} lang={lang} />
            </div>
            {section?.cta && (
              <SmartLink
                link={section.cta}
                lang={lang}
                className={`${CTA_BAND_BUTTON_CLASSES} mt-6`}
              />
            )}
          </div>

          {section?.image && (
            <div className="border-gold/30 bg-cream-soft border p-6 lg:p-7">
              <SanityImage
                image={section.image}
                lang={lang}
                sizes="(max-width: 1024px) 100vw, 640px"
                fallbackAlt={heading}
                className="w-full object-contain"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

/** Khối giới thiệu: một cột hẹp căn giữa, câu mở đầu mang sức nặng thị giác. */
function IntroBlock({ section, lang }: { section: any; lang: Locale }) {
  return (
    <section className="bg-cream py-14 lg:py-24">
      <Container size="narrow" className="text-center">
        <span aria-hidden="true" className="bg-gold mx-auto mb-5 block h-px w-12" />
        {/* Khối này KHÔNG có `h2`: dữ liệu không có `heading`, và tiêu đề duy
            nhất của trang (`h1` CASINO) đã nằm ở hero. Không bịa thêm một
            tiêu đề không có trong nội dung — cùng quy ước với `HomeIntro`.
            Sức nặng mở đầu đến từ cỡ chữ của chính đoạn văn đầu tiên. */}
        <div className="text-pretty [&>p:first-of-type]:font-display [&>p:first-of-type]:text-[clamp(1.125rem,2.4vw,1.6875rem)] [&>p:first-of-type]:leading-[1.45] [&>p:not(:first-of-type)]:text-muted [&>p:not(:first-of-type)]:text-[0.9375rem] [&>p:not(:first-of-type)]:leading-[1.8]">
          <RichText value={section?.content} lang={lang} />
        </div>
      </Container>
    </section>
  )
}

export function CasinoPage({
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
  const units = toUnits(sections)

  // Nhịp nền và bên đặt ảnh chạy theo THỨ TỰ trò chơi, không theo `tone` lưu
  // trong Sanity: ba khối trò chơi là một chuỗi, và một chuỗi chỉ đọc ra là
  // chuỗi khi nhịp của nó đều. Biên tập viên thêm trò thứ tư thì nó tự nhận
  // nền kem và ảnh bên trái, không phải sửa dữ liệu.
  let gameIndex = 0
  const leftovers: any[] = []

  const rendered = units.map((unit, index) => {
    const key = unit.section?._key ?? `u-${index}`

    if (unit.kind === 'imageText') {
      if (unit.rules.length > 0) {
        gameIndex += 1
        const odd = gameIndex % 2 === 1
        return (
          <GameBand
            key={key}
            index={gameIndex}
            section={unit.section}
            rules={unit.rules}
            tone={odd ? 'ink' : 'cream'}
            imageSide={odd ? 'right' : 'left'}
            lang={lang}
          />
        )
      }
      return closingLayout(unit.section) === 'panel' ? (
        <PanelBlock key={key} section={unit.section} lang={lang} />
      ) : (
        <OverlapBlock key={key} section={unit.section} lang={lang} />
      )
    }

    const section = unit.section
    switch (section?._type) {
      case 'heroSection':
        return <HeroSection key={key} {...section} lang={lang} isFirst={index === 0} />
      case 'richTextSection':
        // Khối gập lọt tới đây nghĩa là nó KHÔNG đứng sau một khối ảnh-chữ nào
        // (biên tập viên xoá khối trò chơi mà quên phần luật). Đẩy xuống
        // `leftovers` để `SectionRenderer` render nó bằng cụm accordion bình
        // thường, thay vì lặng lẽ nuốt mất.
        if (isCollapsible(section)) {
          leftovers.push(section)
          return null
        }
        return <IntroBlock key={key} section={section} lang={lang} />
      case 'galleryCarouselSection':
        return <GalleryCarouselSection key={key} {...section} lang={lang} />
      case 'cardGridSection':
        return <CardGridSection key={key} {...section} lang={lang} />
      case 'ctaBandSection':
        return <CtaBandSection key={key} {...section} lang={lang} />
      default:
        leftovers.push(section)
        return null
    }
  })

  return (
    <>
      {rendered}
      {/* Section biên tập viên thêm mà bố cục trên không có chỗ — xem ghi chú
          (2) ở đầu file. */}
      {leftovers.length > 0 && (
        <SectionRenderer
          sections={leftovers}
          lang={lang}
          widgetId={settings?.secureBookingsWidgetId}
          siteSettings={settings}
          currentSlug={currentSlug}
        />
      )}
    </>
  )
}
