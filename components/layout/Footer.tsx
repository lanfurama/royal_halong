import { t, type Locale } from '@/lib/i18n'
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
const ROW = 'flex min-h-11 items-center'

// Nhãn cột — 10px viết hoa giãn chữ, màu vàng kem. Trên nền `gold-deep` màu
// này đo được 4.03:1: dưới ngưỡng AA cho chữ thường, ĐÚNG theo bản thiết kế
// và theo chỉ đạo "bám sát design 100%" (xem ghi chú đầu `globals.css`).
const COLUMN_LABEL = 'text-gold-soft mb-5 text-[0.625rem] tracking-[0.1em] uppercase'

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

  // Ngày cấp GCN nằm trong `siteSettings.licenseDate` dạng ISO — hiển thị
  // theo lối Việt Nam (dd/mm/yyyy) như bản thiết kế, không phải "2008-07-01".
  const licenseDate = settings?.licenseDate
    ? new Date(settings.licenseDate).toLocaleDateString('vi-VN')
    : undefined

  return (
    // Nền vàng ĐẬM (`gold-deep` #8f6a1c) + chữ kem sáng — đảo ngược so với
    // bản cũ (nền `gold` sáng + chữ ink). Đây là điều bản thiết kế yêu cầu và
    // cũng là lý do mọi token chữ trong khối này là `cream-*`, không phải
    // `ink-*`. `on-dark` để viền focus đổi sang `gold-hi` (xem globals.css).
    <footer className="bg-gold-deep text-cream-hi on-dark border-cream-hi/25 mt-24 border-t">
      <Container size="wide" className="pt-16 pb-9">
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
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
                  className="border-gold-soft text-gold-soft font-display grid size-12 place-items-center rounded-pill text-[1.625rem] font-semibold"
                >
                  R
                </span>
              )}
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl tracking-[0.06em]">{brand}</span>
                <span className="text-gold-soft mt-1 text-[0.5625rem] tracking-[0.1em]">
                  HOTEL &amp; VILLAS
                </span>
              </span>
            </div>

            <p className="text-cream-dim mt-6 text-[0.8125rem] leading-relaxed">
              {companyName}
              {settings?.businessLicense && (
                <>
                  <br />
                  GCN ĐKDN: {settings.businessLicense}
                  {licenseIssuer ? ` do ${licenseIssuer} cấp` : ''}
                  {licenseDate ? ` lần đầu ngày ${licenseDate}` : ''}
                </>
              )}
            </p>

            {socials.length > 0 && (
              <ul className="mt-7 flex gap-2.5">
                {socials.map((social: any) => (
                  <li key={social.platform}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.platform}
                      className="border-cream-hi/50 text-gold-soft hover:bg-cream-hi hover:text-gold-deep grid size-11 place-items-center border text-xs transition-colors"
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

          {/* --- Cột liên hệ --- */}
          <div>
            <h2 className={COLUMN_LABEL}>{ui('contact', lang)}</h2>
            {hasAddressDetails && (
              <address className="flex flex-col text-[0.84375rem] not-italic">
                {addressShort && <span className="py-1 leading-relaxed">{addressShort}</span>}
                {settings?.tel && (
                  <a href={`tel:${settings.tel.replace(/\s/g, '')}`} className={ROW}>
                    Tel: {settings.tel}
                  </a>
                )}
                {settings?.mobile && (
                  <a href={`tel:${settings.mobile.replace(/\s/g, '')}`} className={ROW}>
                    Mobile: {settings.mobile}
                  </a>
                )}
                {emails.map((email: string) => (
                  <a key={email} href={`mailto:${email}`} className={`${ROW} break-all`}>
                    {email}
                  </a>
                ))}
                {settings?.hotline && (
                  <span className={`${ROW} text-gold-soft`}>Hotline: {settings.hotline}</span>
                )}
              </address>
            )}
          </div>

          {/* --- Các cột link do biên tập viên cấu hình --- */}
          {columns.map((column: any, index: number) => {
            const title = t<string>(column.title, lang)
            const links: any[] = column.links ?? []
            // Không có link nào thì không có gì để điều hướng — bỏ luôn cả
            // cột, không render <nav> bọc <ul> rỗng.
            if (links.length === 0) return null
            return (
              <nav key={index} aria-label={title ?? `Cột liên kết ${index + 1}`}>
                {title && <h2 className={COLUMN_LABEL}>{title}</h2>}
                {/* Cột dài (>= 5 link, thực tế "Khám phá" có 7) xếp thành hai
                    cột con như bản thiết kế — một cột đơn 7 hàng × 44px kéo
                    chân trang cao thêm ~300px so với các cột bên cạnh. */}
                <ul
                  className={`text-[0.84375rem] ${
                    links.length >= 5 ? 'grid grid-cols-2 gap-x-5' : ''
                  }`}
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
        <div className="border-cream-hi/20 mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs">
          <div className="text-cream-dim">
            {copyright && <p>{copyright}</p>}
            {addressFull && <p className="mt-1">{addressFull}</p>}
          </div>

          {settings?.motBadge?.asset && settings?.motBadgeUrl && (
            // Ảnh badge tự thân là trang trí (alt=""), nên tên truy cập đặt
            // trên chính <a> chứ không dựa vào alt ảnh bên trong.
            <a
              href={settings.motBadgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Xác thực đăng ký với Bộ Công Thương"
              className="border-cream-hi/40 flex min-h-11 items-center gap-2.5 border px-3"
            >
              <SanityImage
                image={settings.motBadge}
                lang={lang}
                sizes="120px"
                decorative
                className="h-7 w-auto"
              />
              <span className="text-[0.625rem] tracking-[0.1em] uppercase">
                Đã thông báo Bộ Công Thương
              </span>
            </a>
          )}
        </div>
      </Container>
    </footer>
  )
}
