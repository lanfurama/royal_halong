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
  secondaryImage,
  highlights,
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

  // Xem chú thích cùng lớp lỗi ở CardGridSection — GROQ trả `null` tường minh
  // cho field vắng mặt, default parameter chỉ bắt `undefined`.
  const highlightList: any[] = highlights ?? []

  // Cặp ảnh chồng nhau: ảnh chính dọc 4:5, ảnh phụ 3:4 nhỏ hơn đè lên góc
  // dưới-phải với viền kem dày. Đổi khung ảnh CHÍNH sang dọc chứ không giữ
  // 4/3 rồi dán ảnh phụ lên: 4/3 cộng phần tràn của ảnh phụ làm khối ảnh
  // thấp hơn cột chữ bên cạnh ~120px ở 1440px, và hai cột `items-center` khi
  // đó lệch hẳn nhau.
  const paired = Boolean(secondaryImage?.asset)
  const imageClasses = contain
    ? 'w-full object-contain'
    : `shadow-card w-full rounded-media object-cover ${paired ? 'aspect-[4/5]' : 'aspect-[4/3]'}`

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
            {/* `mb-10 lg:mb-0` khi có ảnh phụ: ảnh phụ tràn xuống dưới khung
                ảnh chính ~40px, và ở khổ điện thoại (một cột) nó sẽ đè lên
                đoạn chữ ngay bên dưới nếu không chừa chỗ. Ở `lg` hai cột nằm
                cạnh nhau nên phần tràn rơi vào khoảng trống sẵn có. */}
            <div className={`relative ${paired ? 'mb-10 lg:mb-0' : ''}`}>
              <SanityImage
                image={image}
                lang={lang}
                sizes="(max-width: 1024px) 100vw, 620px"
                fallbackAlt={headingText}
                className={imageClasses}
              />
              {paired && (
                /* `-right-3 lg:-right-6`: phần tràn NGANG phải nhỏ lại ở khổ
                   điện thoại, nếu không ảnh phụ thò ra ngoài lề an toàn của
                   `Container` (20px ở 390px) và trang cuộn ngang. */
                <SanityImage
                  image={secondaryImage}
                  lang={lang}
                  sizes="(max-width: 1024px) 46vw, 290px"
                  fallbackAlt={headingText}
                  className="border-cream shadow-card absolute -right-3 -bottom-10 aspect-[3/4] w-[46%] border-8 object-cover lg:-right-6"
                />
              )}
            </div>
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

            {highlightList.length > 0 && (
              /* Danh sách điểm nhấn: ba câu ngắn, mỗi câu một hạt kim cương
                 vàng. Đây là chỗ trả lời "vì sao cưới ở ĐÂY" sau khi đoạn
                 văn đã kể xong câu chuyện — tách khỏi `content` chứ không
                 viết thành `<ul>` trong rich text vì nó cần kiểu trình bày
                 riêng (hạt kim cương, nét kẻ phân cách) mà PortableText
                 không có cách nào diễn đạt.

                 `<ul>` thật chứ không phải ba `<div>`: người dùng screen
                 reader nghe "danh sách 3 mục" và biết trước độ dài. */
              <ul
                className={`mt-9 grid list-none gap-4 border-t pt-7 ${
                  dark ? 'border-gold-hi/20' : 'border-line'
                }`}
              >
                {highlightList.map((item: any, index: number) => (
                  <li key={item._key ?? index} className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className={`mt-2 size-1.5 flex-none rotate-45 ${
                        dark ? 'bg-gold-hi' : 'bg-gold'
                      }`}
                    />
                    <span>
                      <strong className="font-semibold">{t<string>(item.title, lang)}</strong>
                      {t<string>(item.text, lang) && <> — {t<string>(item.text, lang)}</>}
                    </span>
                  </li>
                ))}
              </ul>
            )}

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
