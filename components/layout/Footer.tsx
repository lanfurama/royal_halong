import { t, INTL_LOCALES, type Locale } from '@/lib/i18n'
import { ui } from '@/lib/ui-strings'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'
import { SanityImage } from '@/components/ui/SanityImage'
import { NewsletterForm } from '@/components/forms/NewsletterForm'

// Cùng fallback với Header — `siteSettings` có thể chưa có document.
const BRAND_FALLBACK = 'Royal Halong Hotel'

// Hàng liên kết/liên hệ cao tối thiểu 44px. Trước bản này chúng chỉ cao
// **17px** (đo được trên production, 12 link chân trang) và cách nhau 8px —
// bấm bằng ngón cái gần như chắc chắn trúng hàng bên cạnh. Giãn hàng THẬT
// thay vì bọc vùng chạm vô hình 44px: với nhịp 25px, các vùng chạm vô hình
// sẽ chồng lên nhau và hàng nào vẽ sau sẽ nuốt tap của hàng trước.
//
// `gap-1.5` vì hàng liên hệ nay tách làm hai phần tử (nhãn mờ + giá trị
// sáng): trong một hộp `flex`, khoảng trắng giữa hai phần tử bị nuốt, không
// còn dấu cách nào nếu không khai gap.
const ROW = 'flex min-h-11 items-center gap-1.5'

// Nhãn cột — 11px viết hoa giãn chữ, màu vàng kem, đậm. Trước bản này là
// 10px thường: nó là thứ MỜ NHẤT chân trang trong khi nhiệm vụ của nó là
// chia khối. Trên nền `gold-deep` màu này đo được 4.03:1: dưới ngưỡng AA cho
// chữ thường, ĐÚNG theo bản thiết kế và theo chỉ đạo "bám sát design 100%"
// (xem ghi chú đầu `globals.css`).
const COLUMN_LABEL =
  'text-gold-soft mb-4 text-[0.6875rem] font-semibold tracking-[0.16em] uppercase'

// Nhãn đứng trước một giá trị liên hệ ("Tel:", "Di động:"). Để nhãn mờ hơn
// giá trị thì con số — thứ người ta thật sự đọc và bấm — nổi lên trước; cả
// hàng cùng một màu thì mắt phải tự tách chữ khỏi số.
const FIELD_LABEL = 'text-cream-dim'

// Số cột của hàng trên cùng ở `lg`. Sinh từ số ô THẬT (thương hiệu · liên hệ
// · các cột biên tập · đăng ký) thay vì khoá cứng `lg:grid-cols-4`: với 5 ô
// và 4 cột, ô cuối rơi xuống một hàng mới và kéo chân trang cao thêm ~130px
// cho một khối chỉ cao 77px. Tailwind quét chuỗi class trong mã nguồn nên
// các lớp phải nằm tường minh ở đây, không ghép chuỗi động được.
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

// Viết tắt hiển thị trên ô vuông mạng xã hội, đúng bản thiết kế (f / IG / TA).
// Tên đầy đủ đi vào `aria-label` — ô chỉ có chữ "f" mà không có tên thật là
// một đích điều hướng vô nghĩa với screen reader.
const SOCIAL_ABBR: Record<string, string> = {
  facebook: 'f',
  instagram: 'IG',
  tripadvisor: 'TA',
  youtube: 'YT',
  tiktok: 'TT',
  zalo: 'Z',
}

export function Footer({
  lang,
  navigation,
  settings,
}: {
  lang: Locale
  navigation: any
  settings: any
}) {
  const columns: any[] = navigation?.footerColumns ?? []
  // Cột không có link nào thì không render (xem chỗ map bên dưới) — lọc TRƯỚC
  // để đếm số ô của lưới đúng bằng số ô thật sự vẽ ra.
  const linkColumns = columns.filter((column: any) => (column.links ?? []).length > 0)
  const brand = t<string>(settings?.brandName, lang) ?? BRAND_FALLBACK
  const companyName = t<string>(settings?.companyName, lang) ?? brand
  const addressShort = t<string>(settings?.addressShort, lang)
  const addressFull = t<string>(settings?.addressFull, lang)
  const licenseIssuer = t<string>(settings?.licenseIssuer, lang)
  const copyright = t<string>(settings?.copyright, lang)
  const emails: string[] = settings?.emails ?? []
  const socials: any[] = settings?.socials ?? []
  // Không render <address> rỗng khi settings null/thiếu hết liên hệ.
  const hasAddressDetails = Boolean(
    addressShort || settings?.tel || settings?.mobile || emails.length > 0 || settings?.hotline,
  )
  // Thương hiệu + (liên hệ) + các cột biên tập + đăng ký nhận ưu đãi.
  const cellCount = 2 + linkColumns.length + (hasAddressDetails ? 1 : 0)
  const lgCols = LG_COLS[cellCount] ?? 'lg:grid-cols-4'

  // Ngày cấp GCN nằm trong `siteSettings.licenseDate` dạng ISO — hiển thị
  // theo lối của CHÍNH NGÔN NGỮ đang xem, không phải "2008-07-01" và cũng
  // không phải dd/mm/yyyy cho mọi ngôn ngữ. Trước đây khoá cứng `'vi-VN'`,
  // nên khách Nhật đọc "01/07/2008" và hiểu thành ngày 7 tháng 1 — cùng một
  // chuỗi số, hai nghĩa khác nhau. `INTL_LOCALES` (lib/i18n.ts) có sẵn mã
  // BCP-47 đầy đủ cho cả sáu ngôn ngữ, dùng đúng nó.
  //
  // `T00:00:00` gắn thêm vào chuỗi ISO là cố ý: `new Date('2008-07-01')` được
  // phân tích là nửa đêm UTC, nên ở mọi múi giờ âm nó lùi về ngày 30/06.
  const licenseDate = settings?.licenseDate
    ? new Date(`${settings.licenseDate}T00:00:00`).toLocaleDateString(INTL_LOCALES[lang])
    : undefined

  return (
    // Nền vàng ĐẬM (`gold-deep` #8f6a1c) + chữ kem sáng — đảo ngược so với
    // bản cũ (nền `gold` sáng + chữ ink). Đây là điều bản thiết kế yêu cầu và
    // cũng là lý do mọi token chữ trong khối này là `cream-*`, không phải
    // `ink-*`. `on-dark` để viền focus đổi sang `gold-hi` (xem globals.css).
    <footer className="bg-gold-deep text-cream-hi on-dark border-cream-hi/25 mt-24 border-t">
      {/* Đệm dọc rút từ 64/36 xuống 48/24. Cùng với việc đưa khối đăng ký lên
          chung hàng, chân trang thấp đi ~20% mà không hàng bấm được nào phải
          nhỏ hơn 44px. */}
      <Container size="wide" className="pt-12 pb-6">
        <div className={`grid gap-x-8 gap-y-10 sm:grid-cols-2 ${lgCols}`}>
          {/* --- Cột thương hiệu --- */}
          <div>
            <div className="flex items-center gap-3">
              {settings?.logoLight?.asset ? (
                <SanityImage
                  image={settings.logoLight}
                  lang={lang}
                  sizes="80px"
                  decorative
                  className="h-14 w-auto"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="border-gold-soft text-gold-soft font-display rounded-pill grid size-12 place-items-center text-[1.625rem] font-semibold"
                >
                  R
                </span>
              )}
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl tracking-[0.06em]">{brand}</span>
                <span className="text-gold-soft mt-1.5 text-[0.625rem] tracking-[0.14em]">
                  HOTEL &amp; VILLAS
                </span>
              </span>
            </div>

            <p className="text-cream-dim mt-5 text-[0.84375rem] leading-[1.7]">
              {companyName}
              {settings?.businessLicense && (
                <>
                  <br />
                  {ui('licenseLabel', lang)}: {settings.businessLicense}
                </>
              )}
              {licenseIssuer && (
                <>
                  <br />
                  {ui('licenseIssuerLabel', lang)}: {licenseIssuer}
                </>
              )}
              {licenseDate && (
                <>
                  <br />
                  {ui('licenseDateLabel', lang)}: {licenseDate}
                </>
              )}
            </p>

            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2.5">
                {socials.map((social: any) => (
                  <li key={social.platform}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.platform}
                      className="border-cream-hi/35 text-gold-soft hover:bg-cream-hi hover:text-gold-deep hover:border-cream-hi grid size-11 place-items-center border text-[0.8125rem] font-semibold transition-colors"
                    >
                      <span aria-hidden="true">
                        {SOCIAL_ABBR[social.platform] ?? social.platform.slice(0, 2).toUpperCase()}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- Cột liên hệ ---
              Cả cột (kể cả nhãn) biến mất khi không có chi tiết liên hệ nào:
              một tiêu đề "LIÊN HỆ" đứng trên khoảng trống là một lời hứa
              suông, và nó còn chiếm một ô của lưới. */}
          {hasAddressDetails && (
            <div>
              <h2 className={COLUMN_LABEL}>{ui('contact', lang)}</h2>
              <address className="flex flex-col text-sm not-italic">
                {addressShort && (
                  <span className="py-1.5 leading-relaxed">{addressShort}</span>
                )}
                {settings?.tel && (
                  <a href={`tel:${settings.tel.replace(/\s/g, '')}`} className={ROW}>
                    <span className={FIELD_LABEL}>Tel:</span>
                    <span>{settings.tel}</span>
                  </a>
                )}
                {settings?.mobile && (
                  <a href={`tel:${settings.mobile.replace(/\s/g, '')}`} className={ROW}>
                    <span className={FIELD_LABEL}>{ui('labelMobile', lang)}:</span>
                    <span>{settings.mobile}</span>
                  </a>
                )}
                {emails.map((email: string) => (
                  <a key={email} href={`mailto:${email}`} className={ROW}>
                    {/* `min-w-0` để địa chỉ email dài được phép co lại và ngắt
                        dòng: phần tử flex mặc định không nhỏ hơn min-content,
                        nên thiếu nó thì `break-all` không có tác dụng. */}
                    <span className="min-w-0 break-all">{email}</span>
                  </a>
                ))}
                {settings?.hotline && (
                  // Đường dây nóng là một SỐ ĐIỆN THOẠI. Trước đây nó là
                  // <span> — trên điện thoại khách phải nhớ rồi gõ lại số,
                  // trong khi hai số ngay trên bấm là gọi được.
                  <a
                    href={`tel:${settings.hotline.replace(/[\s()]/g, '')}`}
                    className={`${ROW} text-gold-soft`}
                  >
                    <span>{ui('labelHotline', lang)}:</span>
                    <span>{settings.hotline}</span>
                  </a>
                )}
              </address>
            </div>
          )}

          {/* --- Các cột link do biên tập viên cấu hình --- */}
          {linkColumns.map((column: any, index: number) => {
            const title = t<string>(column.title, lang)
            const links: any[] = column.links ?? []
            return (
              <nav key={index} aria-label={title ?? `Cột liên kết ${index + 1}`}>
                {title && <h2 className={COLUMN_LABEL}>{title}</h2>}
                {/* Cột dài (>= 5 link, thực tế "Khám phá" có 7) xếp thành hai
                    cột con như bản thiết kế — một cột đơn 7 hàng × 44px kéo
                    chân trang cao thêm ~300px so với các cột bên cạnh. */}
                <ul
                  className={`text-sm ${links.length >= 5 ? 'grid grid-cols-2 gap-x-4' : ''}`}
                >
                  {links.map((link: any, linkIndex: number) => (
                    <li key={linkIndex}>
                      <SmartLink
                        link={link}
                        lang={lang}
                        className={`${ROW} hover:text-gold-soft transition-colors`}
                      />
                    </li>
                  ))}
                </ul>
              </nav>
            )
          })}

          {/* --- Đăng ký nhận ưu đãi ---
              Bản thiết kế không vẽ khối này, nhưng nó là một tính năng đang
              CHẠY THẬT (server action + API + test riêng, xem
              `app/actions/newsletter.ts`) — bỏ đi là xoá một đường thu lead
              đang hoạt động, nằm ngoài phạm vi "đổi giao diện". Giữ lại và
              đưa về đúng ngôn ngữ thị giác mới của chân trang. */}
          <div>
            <h2 className={COLUMN_LABEL}>{ui('getOffers', lang)}</h2>
            <NewsletterForm lang={lang} />
          </div>
        </div>

        {/* --- Dải đáy --- */}
        <div className="border-cream-hi/20 mt-8 flex flex-wrap items-center justify-between gap-5 border-t pt-4 text-[0.8125rem]">
          <div className="text-cream-dim leading-relaxed">
            {copyright && <p>{copyright}</p>}
            {addressFull && <p>{addressFull}</p>}
          </div>

          {settings?.motBadge?.asset && settings?.motBadgeUrl && (
            // Ảnh badge tự thân là trang trí (alt=""), nên tên truy cập đặt
            // trên chính <a> chứ không dựa vào alt ảnh bên trong.
            <a
              href={settings.motBadgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ui('motVerify', lang)}
              className="border-cream-hi/45 hover:bg-cream-hi/10 flex min-h-11 items-center gap-4 border px-5 py-2 transition-colors"
            >
              {/* Dấu "đã thông báo Bộ Công Thương" là thứ khách Việt tìm để
                  tin một khách sạn — 28px cao thì chữ trong con dấu không
                  đọc nổi. 64px cao (~169px ngang) là cỡ con dấu này vẫn
                  thường được đặt trên chân trang site Việt. Ảnh gốc trong
                  Sanity là 600×227 nên ở 64px vẫn dư điểm ảnh cho màn 2x;
                  `sizes` phải đi theo, nếu không Next xin bản nhỏ rồi phóng
                  lên thành nhoè. */}
              <SanityImage
                image={settings.motBadge}
                lang={lang}
                sizes="220px"
                decorative
                className="h-16 w-auto"
              />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase">
                {ui('motNotified', lang)}
              </span>
            </a>
          )}
        </div>
      </Container>
    </footer>
  )
}
