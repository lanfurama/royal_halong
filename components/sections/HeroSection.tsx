import { t, type Locale } from '@/lib/i18n'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'
import { CTA_BAND_BUTTON_CLASSES } from '@/components/ui/Button'

// Ba mức chiều cao nằm ở `app/globals.css` (`--hero-unit` và các class
// `.rhl-hero--*`), không phải ở `min-h-[85dvh]` như bản trước: công thức phải
// bám CẢ bề ngang thì khung mới không bị bóp thành 2:1 trên cửa sổ bẹt — lúc
// đó `object-cover` cắt mất một phần tư chiều cao ảnh nền. Cả `dvh` lẫn dự
// phòng `vh` cũng đã xử lý ở đó, một chỗ cho mọi hero.
const HEIGHTS = {
  full: 'rhl-hero--full',
  medium: 'rhl-hero--medium',
  short: 'rhl-hero--short',
} as const

// Nút phụ của hero: viền vàng sáng trên ảnh tối, không phải nền đặc. Cùng
// chiều cao và cùng nhịp chữ với `CTA_BAND_BUTTON_CLASSES` để hai nút đứng
// cạnh nhau không lệch — chỉ khác ở nền và màu chữ.
const HERO_SECONDARY_CTA_CLASSES =
  'text-sm font-semibold tracking-wide uppercase transition-colors inline-flex min-h-11 items-center justify-center rounded-pill border border-gold-hi text-gold-hi hover:bg-gold-hi/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-hi mt-8 px-8 py-3'

export function HeroSection({
  heading,
  eyebrow,
  subheading,
  background,
  facts,
  cta,
  secondaryCta,
  variant = 'standard',
  height = 'medium',
  lang,
  isFirst,
}: any & { lang: Locale; isFirst?: boolean }) {
  // Xem chú thích cùng lớp lỗi ở CardGridSection/VenueListSection — projection
  // GROQ trả `null` TƯỜNG MINH cho field vắng mặt, mà default parameter chỉ
  // bắt `undefined`.
  const factList: any[] = facts ?? []

  return (
    <section
      // `rhl-hero`: dấu cho biết section này là hero tối. Header đọc nó qua
      // `body:has(main > .rhl-hero:first-child)` để chuyển sang trạng thái
      // trôi trên ảnh, và `<main>` nhờ đó biết không phải chừa chỗ cho header
      // (xem `app/globals.css`). Đặt ở MỌI hero chứ không chỉ khi `isFirst`:
      // điều kiện "có phải section đầu không" đã do `:first-child` trả lời,
      // giữ một nguồn sự thật thay vì hai.
      // `flex-col justify-end` thay cho `items-end`: cùng kết quả khi hero chỉ
      // có khối chữ (cả hai dồn nội dung xuống đáy), nhưng khi có thêm dải số
      // liệu thì dải đó xếp DƯỚI khối chữ và tràn hết bề ngang, thay vì đứng
      // cạnh nó trên một hàng ngang.
      className={`rhl-hero on-dark relative flex flex-col justify-end overflow-hidden ${
        HEIGHTS[height as keyof typeof HEIGHTS] ?? HEIGHTS.medium
      }`}
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
          {/* Trước đây là `bg-black/45` phẳng: làm xám đều cả bức ảnh khách
              sạn — thứ đắt giá nhất trên trang — chỉ để cứu tương phản chữ.
              Gradient đậm ở đáy (nơi có chữ) và nhạt dần lên đỉnh giữ được
              chi tiết ảnh mà chữ trắng vẫn trên nền ~72% đen, > 12:1. */}
          <div className="scrim-hero absolute inset-0" />
        </div>
      )}

      {variant === 'invitation' ? (
        /* --- Biến thể "thiệp mời" ---
           Khối chữ nằm GIỮA trong một khung kẻ đôi có hạt kim cương ở góc,
           thay cho khối căn trái của hero mặc định. Dùng cho trang tiệc cưới:
           bố cục cân đối hai bên là quy ước của chính tấm thiệp cưới, và nó
           phân biệt trang này với năm trang hero khác trên site mà không
           phải đổi màu hay đổi chữ.

           `max-w-[45rem]` (720px) chứ không `max-w-3xl`: khung có viền nên
           bề ngang của nó là một hình khối nhìn thấy được, không phải một
           giới hạn dòng chữ vô hình — 720px là con số của bản thiết kế. */
        <Container size="wide" className="relative flex justify-center pt-28 pb-14 lg:pb-20">
          <div className="rhl-frame w-full max-w-[45rem] px-6 py-12 text-center text-white sm:px-10 sm:py-14">
            <span aria-hidden="true" className="rhl-frame__pin rhl-frame__pin--tl" />
            <span aria-hidden="true" className="rhl-frame__pin rhl-frame__pin--tr" />
            <span aria-hidden="true" className="rhl-frame__pin rhl-frame__pin--bl" />
            <span aria-hidden="true" className="rhl-frame__pin rhl-frame__pin--br" />

            <span aria-hidden="true" className="rhl-ornament rhl-ornament--on-dark mx-auto mb-5" />

            {eyebrow && (
              /* `indent-[0.42em]` bù đúng khoảng cách chữ của KÝ TỰ CUỐI:
                 `letter-spacing` thêm khoảng trống sau mỗi chữ cái kể cả chữ
                 cuối, nên một dòng giãn .42em căn giữa sẽ lệch trái đúng nửa
                 khoảng đó. Thụt đầu dòng một lượng bằng thế là kéo lại cân. */
              <p className="text-gold-soft mb-4 text-[0.6875rem] tracking-[0.42em] indent-[0.42em] uppercase">
                {t<string>(eyebrow, lang)}
              </p>
            )}
            <h1 className="font-display text-[clamp(2.25rem,7vw,4.5rem)] tracking-[0.06em]">
              {t<string>(heading, lang)}
            </h1>

            {/* Nét ngăn có hạt kim cương ở giữa — cùng mô-típ với bốn hạt
                góc, giữ khung thiệp là MỘT hệ hình chứ không phải hai. */}
            <div aria-hidden="true" className="my-6 flex items-center gap-3.5">
              <span className="bg-gold-hi/35 h-px flex-auto" />
              <span className="bg-gold-hi size-1.5 rotate-45" />
              <span className="bg-gold-hi/35 h-px flex-auto" />
            </div>

            {subheading && (
              <p className="text-cream-hi mx-auto max-w-[34ch] text-[0.9375rem] leading-relaxed tracking-[0.14em] uppercase">
                {t<string>(subheading, lang)}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3.5">
              {cta && <SmartLink link={cta} lang={lang} className={CTA_BAND_BUTTON_CLASSES} />}
              {secondaryCta && (
                <SmartLink
                  link={secondaryCta}
                  lang={lang}
                  className={HERO_SECONDARY_CTA_CLASSES}
                />
              )}
            </div>
          </div>
        </Container>
      ) : (
        <Container size="wide" className="relative pt-28 pb-14 text-white lg:pb-20">
          <div className="max-w-3xl">
            {/* Đường kẻ vàng ngắn thay cho việc tô cả tiêu đề bằng màu vàng:
                vàng trên ảnh không đảm bảo tương phản ở mọi khung hình, còn
                trắng thì luôn đạt nhờ scrim. Vàng vẫn có mặt, làm điểm nhấn. */}
            <span aria-hidden="true" className="bg-gold-hi mb-6 block h-0.5 w-16" />
            {eyebrow && (
              <p className="text-gold-soft mb-3 text-[0.6875rem] tracking-[0.32em] uppercase">
                {t<string>(eyebrow, lang)}
              </p>
            )}
            <h1 className="font-display text-[clamp(1.75rem,6vw,3.5rem)] tracking-wide">
              {t<string>(heading, lang)}
            </h1>
            {subheading && (
              <p className="mt-5 max-w-xl text-sm tracking-[0.18em] text-white/85 uppercase md:text-base">
                {t<string>(subheading, lang)}
              </p>
            )}
            <div className="flex flex-wrap gap-3.5">
              {cta && <SmartLink link={cta} lang={lang} className={CTA_BAND_BUTTON_CLASSES} />}
              {secondaryCta && (
                <SmartLink
                  link={secondaryCta}
                  lang={lang}
                  className={HERO_SECONDARY_CTA_CLASSES}
                />
              )}
            </div>
          </div>
        </Container>
      )}

      {factList.length > 0 && (
        /* Dải số liệu neo ĐÁY hero. Đây là chỗ trả lời "đây là gì, tôi có
           được vào không" trước khi khách đọc bất cứ dòng nào — trên /casino
           nó mang giờ mở cửa và điều kiện vào cửa (hộ chiếu nước ngoài, từ đủ
           18 tuổi), hai thứ trước đây nằm lẫn giữa trang và khách chỉ gặp sau
           khi cuộn qua 8.000px luật chơi.

           `bg-ink/60` + blur chứ không phải nền đặc: dải này nằm TRÊN ảnh, và
           phần dưới cùng của `.scrim-hero` đã tối sẵn (0.78) nên chữ kem đạt
           tương phản mà vẫn thấy ảnh chạy qua phía sau. */
        <div className="border-gold-hi/30 bg-ink/60 relative border-t backdrop-blur-md">
          <Container size="wide">
            <ul className="grid grid-cols-2 gap-x-6 lg:grid-cols-4 lg:gap-x-0">
              {factList.map((fact: any, index: number) => (
                <li
                  key={fact._key ?? index}
                  className={`flex items-baseline gap-3 py-3.5 ${
                    // Ở 2 cột (điện thoại) hàng thứ hai cần kẻ NGANG; ở 4 cột
                    // mọi ô trừ ô đầu cần kẻ DỌC. Hai điều kiện khác nhau nên
                    // viết rời, không gộp thành `divide-*` (grid `divide-x`
                    // kẻ nhầm vào ô mở đầu mỗi hàng).
                    index >= 2 ? 'border-gold-hi/20 border-t lg:border-t-0' : ''
                  } ${index > 0 ? 'lg:border-gold-hi/20 lg:border-l lg:pl-6' : ''}`}
                >
                  <span className="font-display text-gold-hi text-2xl leading-none lg:text-3xl">
                    {t<string>(fact.value, lang)}
                  </span>
                  <span className="text-cream-dim text-[0.625rem] tracking-[0.18em] uppercase">
                    {t<string>(fact.label, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      )}
    </section>
  )
}
