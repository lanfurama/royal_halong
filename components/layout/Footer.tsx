import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'
import { SanityImage } from '@/components/ui/SanityImage'
import { NewsletterForm } from '@/components/forms/NewsletterForm'

// Cùng fallback với Header — `siteSettings` chưa có document nào hôm nay.
const BRAND_FALLBACK = 'Royal Halong Hotel'

// Hàng liên kết/liên hệ cao tối thiểu 44px. Trước bản này chúng chỉ cao
// **17px** (đo được trên production, 12 link chân trang) và cách nhau 8px —
// bấm bằng ngón cái gần như chắc chắn trúng hàng bên cạnh. Giãn hàng THẬT
// thay vì bọc vùng chạm vô hình 44px: với nhịp 25px, các vùng chạm vô hình
// sẽ chồng lên nhau và hàng nào vẽ sau sẽ nuốt tap của hàng trước.
const ROW = 'flex min-h-11 items-center'

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
  // Không render <address> rỗng khi settings null/thiếu hết liên hệ.
  const hasAddressDetails = Boolean(addressShort || settings?.tel || settings?.mobile || emails.length > 0)

  const columnTitle = 'mb-3 text-xs font-semibold tracking-widest uppercase'

  return (
    <footer className="bg-gold text-ink mt-20">
      <Container size="wide" className="py-14 lg:py-20">
        {/* `sm:grid-cols-2` trước `lg:grid-cols-4`: ở 390px bốn khối xếp dọc
            rất dài, nhưng ngay từ 640px đã đủ chỗ cho hai cột. Trước đây
            khối đầu tiên nhảy thẳng từ 1 cột sang 4 cột ở lg, bỏ phí cả dải
            640–1023px. */}
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="font-display mb-3 text-xl text-balance">{companyName}</h2>
            {hasAddressDetails && (
              <address className="text-sm not-italic">
                {addressShort && <p className="py-1">{addressShort}</p>}
                {settings?.tel && (
                  <p>
                    <a href={`tel:${settings.tel.replace(/\s/g, '')}`} className={`${ROW} gap-1.5`}>
                      <span className="text-ink-muted">Tel:</span> {settings.tel}
                    </a>
                  </p>
                )}
                {settings?.mobile && (
                  <p>
                    <a
                      href={`tel:${settings.mobile.replace(/\s/g, '')}`}
                      className={`${ROW} gap-1.5`}
                    >
                      <span className="text-ink-muted">Mobile:</span> {settings.mobile}
                    </a>
                  </p>
                )}
                {emails.map((email: string) => (
                  <p key={email}>
                    <a
                      href={`mailto:${email}`}
                      className={`${ROW} break-all underline underline-offset-2`}
                    >
                      {email}
                    </a>
                  </p>
                ))}
              </address>
            )}
          </div>

          <div>
            <h2 className={columnTitle}>{lang === 'vi' ? 'Nhận ưu đãi' : 'Get offers'}</h2>
            <NewsletterForm lang={lang} />
          </div>

          {columns.map((column: any, index: number) => {
            const title = t<string>(column.title, lang)
            const links: any[] = column.links ?? []
            // Không có link nào thì không có gì để điều hướng — bỏ luôn cả
            // cột, không render <nav> bọc <ul> rỗng (cùng nguyên tắc với
            // Header khi navigation.header rỗng).
            if (links.length === 0) return null
            return (
              <nav key={index} aria-label={title ?? `Cột liên kết ${index + 1}`}>
                {title && <h2 className={columnTitle}>{title}</h2>}
                <ul className="text-sm">
                  {links.map((link: any, linkIndex: number) => (
                    <li key={linkIndex}>
                      <SmartLink
                        link={link}
                        lang={lang}
                        className={`${ROW} hover:underline`}
                      />
                    </li>
                  ))}
                </ul>
              </nav>
            )
          })}
        </div>

        <div className="border-ink/20 mt-12 border-t pt-8 text-xs leading-relaxed">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-semibold">{brand}</p>
              {addressFull && <p className="text-ink-muted">{addressFull}</p>}
              {settings?.businessLicense && (
                <p className="text-ink-muted">
                  GCN ĐKDN: {settings.businessLicense}
                  {licenseIssuer ? ` — ${licenseIssuer}` : ''}
                </p>
              )}
              {settings?.hotline && <p className="text-ink-muted">Hotline: {settings.hotline}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {settings?.motBadge?.asset && settings?.motBadgeUrl && (
                // Ảnh badge tự thân là trang trí (decorative, alt="") — cái
                // <a> mới cần tên truy cập, đặt aria-label trên chính <a> chứ
                // không dựa vào alt ảnh bên trong.
                <a
                  href={settings.motBadgeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Xác thực đăng ký với Bộ Công Thương"
                  className="flex min-h-11 items-center"
                >
                  <SanityImage
                    image={settings.motBadge}
                    lang={lang}
                    sizes="120px"
                    decorative
                    className="h-10 w-auto"
                  />
                </a>
              )}
              {settings?.socials?.map((social: any) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ROW} text-xs uppercase underline underline-offset-2`}
                >
                  {social.platform}
                </a>
              ))}
            </div>
          </div>

          {copyright && <p className="text-ink-muted mt-6">{copyright}</p>}
        </div>
      </Container>
    </footer>
  )
}
