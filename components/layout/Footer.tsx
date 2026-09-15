import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'
import { SanityImage } from '@/components/ui/SanityImage'

// Cùng fallback với Header — `siteSettings` chưa có document nào hôm nay.
const BRAND_FALLBACK = 'Royal Halong Hotel'

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

  return (
    <footer className="bg-gold text-ink mt-20">
      <Container size="wide" className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="font-display mb-4 text-xl">{companyName}</h2>
            <address className="space-y-1 text-sm not-italic">
              {addressShort && <p>{addressShort}</p>}
              {settings?.tel && (
                <p>
                  Tel: <a href={`tel:${settings.tel.replace(/\s/g, '')}`}>{settings.tel}</a>
                </p>
              )}
              {settings?.mobile && (
                <p>
                  Mobile:{' '}
                  <a href={`tel:${settings.mobile.replace(/\s/g, '')}`}>{settings.mobile}</a>
                </p>
              )}
              {settings?.emails?.map((email: string) => (
                <p key={email}>
                  <a href={`mailto:${email}`} className="underline underline-offset-2">
                    {email}
                  </a>
                </p>
              ))}
            </address>
          </div>

          {columns.map((column: any, index: number) => {
            const title = t<string>(column.title, lang)
            return (
              <nav key={index} aria-label={title ?? `Cột liên kết ${index + 1}`}>
                {title && (
                  <h2 className="mb-4 text-xs font-semibold tracking-widest uppercase">{title}</h2>
                )}
                <ul className="space-y-2 text-sm">
                  {column.links?.map((link: any, linkIndex: number) => (
                    <li key={linkIndex}>
                      <SmartLink link={link} lang={lang} className="hover:underline" />
                    </li>
                  ))}
                </ul>
              </nav>
            )
          })}
        </div>

        <div className="border-ink/20 mt-12 border-t pt-8 text-xs leading-relaxed">
          <p className="font-semibold">{brand}</p>
          {addressFull && <p>{addressFull}</p>}
          {settings?.businessLicense && (
            <p>
              GCN ĐKDN: {settings.businessLicense}
              {licenseIssuer ? ` — ${licenseIssuer}` : ''}
            </p>
          )}
          {settings?.hotline && <p>Hotline: {settings.hotline}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {settings?.motBadge?.asset && settings?.motBadgeUrl && (
              // Ảnh badge tự thân là trang trí (decorative, alt="") — cái
              // <a> mới cần tên truy cập, đặt aria-label trên chính <a> chứ
              // không dựa vào alt ảnh bên trong.
              <a
                href={settings.motBadgeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xác thực đăng ký với Bộ Công Thương"
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
                className="text-xs uppercase underline underline-offset-2"
              >
                {social.platform}
              </a>
            ))}
          </div>

          {copyright && <p className="mt-6">{copyright}</p>}
        </div>
      </Container>
    </footer>
  )
}
