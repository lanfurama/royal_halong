import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { resolve } from 'node:path'
import { ROOT } from '../paths'
import { stripSizeSuffix } from '../assets'
import type {
  NavTarget,
  ParsedFooterColumn,
  ParsedNavItem,
  ParsedNavigation,
  ParsedSiteSettings,
  ParsedSocial,
} from '../types'

/**
 * Bản clone trỏ MỘT SỐ link về chính domain thật (`https://royalhalonghotel.com/casino/`)
 * thay vì link tương đối. Coi chúng là link ngoài thì site mới vẫn đẩy khách sang
 * site cũ — nên quy chúng về route nội bộ.
 */
const OWN_DOMAIN = /^https?:\/\/(?:www\.)?royalhalonghotel\.com/i
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/** Vùng chân trang của theme: chứa cả khối liên hệ, cột pháp lý, menu tắt, badge. */
const FOOTER_REGION = '.nectar-global-section.before-footer'

export function hrefToTarget(href: string | undefined): NavTarget {
  const raw = (href ?? '').trim()
  if (raw === '' || raw === '#') return { kind: 'none' }

  let rest = raw
  if (OWN_DOMAIN.test(rest)) {
    rest = rest.replace(OWN_DOMAIN, '')
  } else if (HAS_SCHEME.test(rest)) {
    return { kind: 'external', href: raw }
  }

  const route = rest
    .replace(/^\/+/, '')
    .replace(/(?:^|\/)index\.html$/, '')
    .replace(/\/+$/, '')
  return { kind: 'internal', route }
}

function text($: CheerioAPI, el: unknown): string {
  return $(el as never)
    .text()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tách một khối nhiều dòng ngăn bằng <br> thành từng dòng đã sạch thẻ. */
function lines($: CheerioAPI, el: unknown): string[] {
  const html = $(el as never).html() ?? ''
  return cheerio
    .load(`<div>${html.replace(/<br\s*\/?>/gi, '\n')}</div>`)('div')
    .text()
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l) => l !== '')
}

export function parseNavigation(html: string): ParsedNavigation {
  const $ = cheerio.load(html)

  // Menu đầu trang nằm trong HAI <ul> cấp ngoài của <nav>: `ul.sf-menu` (8 mục)
  // và `ul.buttons.sf-menu` (nút ĐẶT PHÒNG + 2 link logo không chữ). Chỉ lấy
  // <ul> đầu tiên là mất hẳn mục ĐẶT PHÒNG.
  const $nav = $('nav').first()
  const topUls = $nav.find('ul').filter((_, el) => $(el).parents('ul').length === 0)

  const header: ParsedNavItem[] = []
  topUls.children('li').each((_, li) => {
    const $li = $(li)
    const $a = $li.children('a').first()
    const label = text($, $a)
    // Hai link logo không có chữ — bỏ, đừng sinh mục menu rỗng.
    if (label === '') return

    const children: ParsedNavItem[] = []
    $li
      .children('ul')
      .children('li')
      .each((__, sub) => {
        const $sub = $(sub)
        const subLabel = text($, $sub.children('a').first())
        if (subLabel === '') return
        children.push({
          label: subLabel,
          target: hrefToTarget($sub.children('a').first().attr('href')),
          children: [],
        })
      })

    header.push({ label, target: hrefToTarget($a.attr('href')), children })
  })

  // Link điều hướng ở chân trang: chỉ lấy trong vùng chân trang, KHÔNG lấy mọi
  // `.nectar-cta` toàn trang — thân trang cũng dùng `.nectar-cta` cho các nút
  // "Xem thêm"/"Khám phá"/"Phóng to bản đồ".
  const headerRoutes = new Set(
    [...header, ...header.flatMap((i) => i.children)]
      .map((i) => i.target)
      .filter((t): t is Extract<NavTarget, { kind: 'internal' }> => t.kind === 'internal')
      .map((t) => t.route),
  )

  const legal: ParsedFooterColumn['links'] = []
  const quick: ParsedFooterColumn['links'] = []
  const seen = new Set<string>()

  $(FOOTER_REGION)
    .find('.nectar-cta a[href]')
    .each((_, a) => {
      const $a = $(a)
      const label = text($, $a)
      const target = hrefToTarget($a.attr('href'))
      // Link bản đồ / badge là dữ liệu siteSettings, không phải mục điều hướng.
      if (label === '' || target.kind !== 'internal') return
      if (seen.has(target.route)) return
      seen.add(target.route)
      // Phân nhóm bằng quan hệ với menu đầu trang thay vì danh sách slug chép tay.
      ;(headerRoutes.has(target.route) ? quick : legal).push({ label, target })
    })

  const footerColumns: ParsedFooterColumn[] = []
  if (legal.length > 0) footerColumns.push({ title: 'Thông tin', links: legal })
  if (quick.length > 0) footerColumns.push({ title: 'Khám phá', links: quick })

  return { header, footerColumns }
}

const PLATFORM_HOSTS: Array<[RegExp, ParsedSocial['platform']]> = [
  [/(?:^|\.)facebook\.com$/i, 'facebook'],
  [/(?:^|\.)instagram\.com$/i, 'instagram'],
  [/(?:^|\.)tripadvisor\.[a-z.]+$/i, 'tripadvisor'],
  [/(?:^|\.)(?:twitter|x)\.com$/i, 'x'],
  [/(?:^|\.)youtube\.com$/i, 'youtube'],
]

/**
 * WordPress gắn hậu tố kích thước cho biến thể srcset (`bo-cong-thuong-300x114.png`),
 * nhưng cache asset đánh khoá theo ẢNH GỐC. Không khử hậu tố thì `imageValue()`
 * tra cache trượt và ảnh biến mất im lặng — đúng lỗi đã gặp ở pha import trước.
 */
function uploadPath(relative: string): string {
  return stripSizeSuffix(resolve(ROOT, relative.replace(/^\/+/, '')))
}

/**
 * @param html trang chủ — nơi có khối liên hệ/pháp lý ở chân trang
 * @param reservationHtml trang đặt phòng — nơi DUY NHẤT nhúng widget SecureBookings;
 *   trang chủ không hề chứa id này.
 */
export function parseSiteSettings(html: string, reservationHtml = ''): ParsedSiteSettings {
  const $ = cheerio.load(html)
  const $footer = $(FOOTER_REGION)

  const headings = $footer
    .find('h1,h2,h3,h4,h5,h6')
    .map((_, el) => text($, el))
    .get()
  const find = (re: RegExp) => headings.find((h) => re.test(h))
  const after = (re: RegExp) => {
    const hit = find(re)
    return hit ? hit.replace(re, '').trim() : undefined
  }

  const tel = after(/^Tel:\s*/i)
  const mobile = after(/^Mobile:\s*/i)
  const hotline = after(/^Hotline:\s*/i)
  const addressShort = after(/^Địa chỉ:\s*/i)

  const emailLine = find(/^Email:/i) ?? ''
  const emails = emailLine.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? []

  // Khối pháp lý là một <h6> nhiều dòng ngăn bằng <br>.
  const legalEl = $footer.find('h1,h2,h3,h4,h5,h6').filter((_, el) => /GCN ĐKDN/i.test(text($, el)))
  const legalLines = legalEl.length > 0 ? lines($, legalEl.first()) : []
  const brandName = legalLines[0]
  const companyName = legalLines.find((l) => /^Công ty/i.test(l))
  const licenseLine = legalLines.find((l) => /GCN ĐKDN/i.test(l)) ?? ''
  const addressFull = legalLines
    .find((l) => /^Địa chỉ:/i.test(l))
    ?.replace(/^Địa chỉ:\s*/i, '')
    .trim()

  const licenseMatch = licenseLine.match(
    /GCN ĐKDN:\s*(\d+)\s*do\s*(.+?)\s*cấp lần đầu ngày\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  )
  const businessLicense = licenseMatch?.[1]
  const licenseIssuer = licenseMatch?.[2]
  const licenseDate = licenseMatch
    ? `${licenseMatch[5]}-${licenseMatch[4]}-${licenseMatch[3]}`
    : undefined

  const copyright = headings.find((h) => /All rights reserved/i.test(h))

  const socials: ParsedSocial[] = []
  const seenPlatform = new Set<string>()
  $footer.find('a[href^="http"]').each((_, a) => {
    const href = $(a).attr('href') ?? ''
    let host: string
    let path: string
    try {
      const u = new URL(href)
      host = u.hostname
      path = u.pathname
    } catch {
      return
    }
    const hit = PLATFORM_HOSTS.find(([re]) => re.test(host))
    if (!hit) return
    // Theme Salient để sẵn "https://twitter.com" khi chưa cấu hình — không phải
    // trang của khách sạn, giữ lại là dựng link chết.
    if (path === '' || path === '/') return
    if (seenPlatform.has(hit[1])) return
    seenPlatform.add(hit[1])
    socials.push({ platform: hit[1], url: href })
  })

  const motBadgeUrl = $footer.find('a[href*="online.gov.vn"]').first().attr('href')
  const badgeSrc = $('img[src*="bo-cong-thuong"], img[data-nectar-img-src*="bo-cong-thuong"]')
    .first()
    .attr('data-nectar-img-src')

  const widgetMatch = reservationHtml.match(/widgetCustomize\?[^"']*?\bid=([0-9a-f-]{16,})/i)

  const logoSrc = 'wp-content/uploads/2023/04/Logo-Royal-Ha-Long-Hotel.png'
  const logoLightSrc = 'wp-content/uploads/2023/04/Logo-Royal-Ha-Long-Hotel-White.png'

  return {
    brandName: brandName ?? 'Royal Halong Hotel',
    logo: { filePath: uploadPath(logoSrc) },
    logoLight: { filePath: uploadPath(logoLightSrc) },
    tel,
    mobile,
    hotline,
    emails,
    addressShort,
    addressFull,
    socials,
    companyName,
    businessLicense,
    licenseIssuer,
    licenseDate,
    motBadge: badgeSrc ? { filePath: uploadPath(badgeSrc) } : undefined,
    motBadgeUrl,
    copyright,
    secureBookingsWidgetId: widgetMatch?.[1],
  }
}
