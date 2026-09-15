import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { routeToHtmlPath } from '@/scripts/import/paths'
import { hrefToTarget, parseNavigation, parseSiteSettings } from '@/scripts/import/parsers/settings'
import { navigationDoc, siteSettingsDoc } from '@/scripts/import/transform'
import type { ParsedDataset } from '@/scripts/import/types'
import { parseOnlyFilter, parseIdsFilter } from '@/scripts/import/run'

const home = () => readFile(routeToHtmlPath(''), 'utf-8')
const reservation = () => readFile(routeToHtmlPath('reservation'), 'utf-8')

describe('hrefToTarget()', () => {
  it('link thư mục -> route nội bộ', () => {
    expect(hrefToTarget('casino/index.html')).toEqual({ kind: 'internal', route: 'casino' })
  })

  it('index.html gốc -> trang chủ (route rỗng)', () => {
    expect(hrefToTarget('index.html')).toEqual({ kind: 'internal', route: '' })
  })

  it('# hoặc rỗng -> không có đích', () => {
    expect(hrefToTarget('#')).toEqual({ kind: 'none' })
    expect(hrefToTarget('')).toEqual({ kind: 'none' })
  })

  // Chân trang bản gốc trỏ Casino sang domain THẬT chứ không phải link tương đối.
  // Nếu coi đây là link ngoài thì site mới vẫn còn link rời sang site cũ.
  it('URL tuyệt đối về chính domain cũ -> route nội bộ, không phải link ngoài', () => {
    expect(hrefToTarget('https://royalhalonghotel.com/casino/')).toEqual({
      kind: 'internal',
      route: 'casino',
    })
    expect(hrefToTarget('https://www.royalhalonghotel.com/')).toEqual({
      kind: 'internal',
      route: '',
    })
  })

  it('domain khác -> link ngoài', () => {
    expect(hrefToTarget('https://www.google.com/maps/place/abc')).toEqual({
      kind: 'external',
      href: 'https://www.google.com/maps/place/abc',
    })
  })
})

describe('parseNavigation()', () => {
  it('menu đầu trang gộp cả hai <ul> của <nav>: 9 mục cấp 1 đúng thứ tự, gồm nút ĐẶT PHÒNG', async () => {
    const nav = parseNavigation(await home())
    expect(nav.header.map((i) => i.label)).toEqual([
      'LƯU TRÚ',
      'CASINO',
      'ẨM THỰC',
      'HỘI NGHỊ & TIỆC CƯỚI',
      'TRẢI NGHIỆM',
      'THƯ VIỆN',
      'TIN TỨC',
      'ƯU ĐÃI',
      'ĐẶT PHÒNG',
    ])
  })

  it('hai mục có menu con giữ đúng con của mình', async () => {
    const nav = parseNavigation(await home())
    const hoiNghi = nav.header.find((i) => i.label === 'HỘI NGHỊ & TIỆC CƯỚI')!
    expect(hoiNghi.children.map((c) => c.label)).toEqual([
      'TIỆC CƯỚI',
      'CUNG HỘI NGHỊ QUỐC TẾ HOÀNG GIA HẠ LONG',
    ])
    expect(hoiNghi.target).toEqual({ kind: 'none' })

    const tinTuc = nav.header.find((i) => i.label === 'TIN TỨC')!
    expect(tinTuc.children.map((c) => c.label)).toEqual(['TIN TỨC & BÁO CHÍ', 'THÔNG BÁO'])
  })

  it('mục cấp 1 không có con thì không mang con của mục khác', async () => {
    const nav = parseNavigation(await home())
    for (const item of nav.header) {
      if (item.label !== 'HỘI NGHỊ & TIỆC CƯỚI' && item.label !== 'TIN TỨC') {
        expect(item.children).toEqual([])
      }
    }
  })

  it('bỏ hai link logo (không có chữ) thay vì tạo mục menu rỗng', async () => {
    const nav = parseNavigation(await home())
    expect(nav.header.every((i) => i.label.trim() !== '')).toBe(true)
  })

  it('mọi mục có đích đều trỏ vào route có thật, không mục nào trỏ ra domain cũ', async () => {
    const nav = parseNavigation(await home())
    const all = nav.header.flatMap((i) => [i, ...i.children])
    for (const item of all) {
      expect(item.target.kind).not.toBe('external')
    }
  })

  // DOM bản gốc KHÔNG có 3 cột link: khối "liên hệ" là địa chỉ/điện thoại/bản đồ
  // (thuộc siteSettings, không phải link điều hướng), còn mạng xã hội và badge
  // Bộ Công Thương cũng vậy. Chỉ có đúng hai NHÓM LINK điều hướng ở chân trang.
  it('chân trang có 2 cột link: pháp lý rồi menu tắt', async () => {
    const nav = parseNavigation(await home())
    expect(nav.footerColumns).toHaveLength(2)
    const legal = nav.footerColumns[0]
    expect(legal.links.map((l) => l.label)).toEqual([
      'Chính sách chung',
      'Chính sách bảo mật',
      'Phương thức thanh toán',
    ])
    expect(legal.links.map((l) => l.target)).toEqual([
      { kind: 'internal', route: 'terms-and-conditions' },
      { kind: 'internal', route: 'privacy-policy' },
      { kind: 'internal', route: 'payment-methods' },
    ])
  })

  // Phân nhóm bằng quan hệ với menu đầu trang, không bằng danh sách slug chép tay:
  // thêm một trang pháp lý mới ở bản gốc thì nó tự vào đúng cột.
  it('cột menu tắt giữ đủ 7 link, Casino thành link nội bộ, không lẫn link ngoài', async () => {
    const nav = parseNavigation(await home())
    const quick = nav.footerColumns[1]
    expect(quick.links).toHaveLength(7)
    const casino = quick.links.find((l) => l.label === 'Casino')!
    expect(casino.target).toEqual({ kind: 'internal', route: 'casino' })
    for (const l of quick.links) expect(l.target.kind).toBe('internal')
  })

  it('không link chân trang nào rơi vào cả hai cột', async () => {
    const nav = parseNavigation(await home())
    const routes = nav.footerColumns.flatMap((c) =>
      c.links.map((l) => (l.target.kind === 'internal' ? l.target.route : l.target.kind)),
    )
    expect(new Set(routes).size).toBe(routes.length)
  })
})

describe('parseSiteSettings()', () => {
  it('lấy đúng số liên hệ, tách bạch tel / mobile / hotline', async () => {
    const s = parseSiteSettings(await home())
    expect(s.tel).toBe('+84 203 3847 209')
    expect(s.mobile).toBe('+84 90 4030 222')
    expect(s.hotline).toBe('(+84)2033 848 777')
  })

  it('lấy cả hai email, không dính dấu gạch nối phân tách', async () => {
    const s = parseSiteSettings(await home())
    expect(s.emails).toEqual(['info@royalhalonghotel.com', 'asm@royalhalonghotel.com'])
  })

  it('lấy thông tin pháp lý tách thành từng trường', async () => {
    const s = parseSiteSettings(await home())
    expect(s.companyName).toBe('Công ty Cổ phần Quốc tế Hoàng Gia')
    expect(s.businessLicense).toBe('5700102119')
    expect(s.licenseIssuer).toContain('Quảng Ninh')
    expect(s.licenseDate).toBe('2008-07-01')
  })

  it('địa chỉ ngắn và đầy đủ là hai chuỗi khác nhau, đã bỏ nhãn "Địa chỉ:"', async () => {
    const s = parseSiteSettings(await home())
    expect(s.addressShort).toBe('Bãi cháy, TP. Hạ Long, Việt Nam.')
    expect(s.addressFull).toBe('Đường Hạ Long, Phường Bãi Cháy, Tỉnh Quảng Ninh, Việt Nam')
    expect(s.addressShort).not.toMatch(/Địa chỉ/)
    expect(s.addressFull).not.toMatch(/Địa chỉ/)
  })

  // Theme Salient để sẵn href rỗng "https://twitter.com" / "https://www.instagram.com"
  // — đó là placeholder chưa cấu hình, không phải trang của khách sạn.
  it('chỉ giữ mạng xã hội có trang thật, bỏ placeholder của theme', async () => {
    const s = parseSiteSettings(await home())
    const platforms = s.socials.map((x) => x.platform).sort()
    expect(platforms).toEqual(['facebook', 'tripadvisor'])
    expect(s.socials.find((x) => x.platform === 'facebook')!.url).toBe(
      'https://www.facebook.com/royalhalonghotelandvillas',
    )
  })

  // Trang chủ KHÔNG nhúng widget — id chỉ có ở trang reservation.
  it('lấy id widget đặt phòng từ trang reservation', async () => {
    const s = parseSiteSettings(await home(), await reservation())
    expect(s.secureBookingsWidgetId).toBe('b61761f7-73f7-1690280721-4685-acf1-02f8078b5da3')
  })

  it('có logo sáng, logo nền tối và badge Bộ Công Thương (đã khử hậu tố kích thước)', async () => {
    const s = parseSiteSettings(await home())
    expect(s.logo?.filePath).toMatch(/Logo-Royal-Ha-Long-Hotel\.png$/)
    expect(s.logoLight?.filePath).toMatch(/Logo-Royal-Ha-Long-Hotel-White\.png$/)
    expect(s.motBadge?.filePath).toMatch(/bo-cong-thuong\.png$/)
    expect(s.motBadgeUrl).toBe('http://online.gov.vn/Home/WebDetails/125953')
  })

  it('dòng bản quyền và tên thương hiệu', async () => {
    const s = parseSiteSettings(await home())
    expect(s.brandName).toBe('ROYAL HẠ LONG HOTEL')
    expect(s.copyright).toMatch(/Royal Halong Hotel/)
  })
})

describe('navigationDoc()', () => {
  const dataset: ParsedDataset = {
    rooms: [], posts: [], offers: [], venues: [], halls: [], albums: [], testimonials: [],
    pages: [
      { kind: 'page', slug: '', title: 'Trang chủ', sections: [] },
      { kind: 'page', slug: 'casino', title: 'Casino', sections: [] },
    ],
    navigation: { header: [], footerColumns: [] },
    settings: { brandName: 'X', emails: [], socials: [] },
  }

  it('mục nội bộ thành reference tới đúng _id document', () => {
    const doc: any = navigationDoc(
      {
        header: [
          { label: 'CASINO', target: { kind: 'internal', route: 'casino' }, children: [] },
        ],
        footerColumns: [],
      },
      dataset,
    )
    expect(doc._id).toBe('navigation')
    expect(doc.header[0].link.kind).toBe('internal')
    expect(doc.header[0].link.reference._ref).toBe('page.casino')
  })

  // Mục menu trỏ vào route không có document mà vẫn ghi được nghĩa là site mới
  // có một mục menu bấm vào thì 404 — phải gãy lúc dựng, không phải lúc khách bấm.
  it('route không khớp document nào thì ném lỗi thay vì âm thầm bỏ mục', () => {
    expect(() =>
      navigationDoc(
        {
          header: [
            { label: 'MA', target: { kind: 'internal', route: 'khong-ton-tai' }, children: [] },
          ],
          footerColumns: [],
        },
        dataset,
      ),
    ).toThrow(/khong-ton-tai/)
  })

  it('mục trỏ trang chủ là link nội bộ không reference (frontend tự ra /<lang>)', () => {
    const doc: any = navigationDoc(
      { header: [{ label: 'HOME', target: { kind: 'internal', route: '' }, children: [] }], footerColumns: [] },
      dataset,
    )
    expect(doc.header[0].link.kind).toBe('internal')
    expect(doc.header[0].link.reference).toBeUndefined()
  })

  it('mọi phần tử mảng đều có _key duy nhất', () => {
    const doc: any = navigationDoc(
      {
        header: [
          {
            label: 'TIN TỨC',
            target: { kind: 'none' },
            children: [{ label: 'CASINO', target: { kind: 'internal', route: 'casino' }, children: [] }],
          },
        ],
        footerColumns: [
          { title: 'Thông tin', links: [{ label: 'Casino', target: { kind: 'internal', route: 'casino' } }] },
        ],
      },
      dataset,
    )
    const keys = [
      ...doc.header.map((h: any) => h._key),
      ...doc.header.flatMap((h: any) => h.children.map((c: any) => c._key)),
      ...doc.footerColumns.map((c: any) => c._key),
      ...doc.footerColumns.flatMap((c: any) => c.links.map((l: any) => l._key)),
    ]
    expect(keys.every(Boolean)).toBe(true)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('siteSettingsDoc()', () => {
  it('logo dùng _type image (không phải figure) để khớp schema', async () => {
    const parsed = parseSiteSettings(await home())
    const cache = { [parsed.logo!.filePath]: 'image-abc' }
    const doc: any = siteSettingsDoc(parsed, cache)
    expect(doc.logo._type).toBe('image')
    expect(doc.logo.asset._ref).toBe('image-abc')
  })

  it('có toạ độ bản đồ vì initialValue của schema không áp cho document import', async () => {
    const doc: any = siteSettingsDoc(parseSiteSettings(await home()), {})
    expect(typeof doc.lat).toBe('number')
    expect(typeof doc.lng).toBe('number')
    expect(typeof doc.mapZoom).toBe('number')
  })
})

describe('parseOnlyFilter()', () => {
  it('không có cờ -> ghi tất cả', () => {
    expect(parseOnlyFilter(['node', 'run.ts'])).toBeUndefined()
  })

  it('tách danh sách _type', () => {
    expect(parseOnlyFilter(['--only=navigation,siteSettings'])).toEqual(
      new Set(['navigation', 'siteSettings']),
    )
  })

  // Cờ rỗng mà lặng lẽ hiểu thành "ghi tất cả" là đúng kiểu ghi đè ngoài ý muốn.
  it('cờ rỗng thì ném lỗi chứ không hiểu thành ghi tất cả', () => {
    expect(() => parseOnlyFilter(['--only='])).toThrow()
    expect(() => parseOnlyFilter(['--only=,,'])).toThrow()
  })
})

describe('parseIdsFilter()', () => {
  it('không có cờ -> không lọc theo _id', () => {
    expect(parseIdsFilter(['node', 'run.ts'])).toBeUndefined()
  })

  it('tách danh sách _id', () => {
    expect(parseIdsFilter(['--ids=page.wedding,page.casino'])).toEqual(
      new Set(['page.wedding', 'page.casino']),
    )
  })

  it('cờ rỗng thì ném lỗi', () => {
    expect(() => parseIdsFilter(['--ids='])).toThrow()
  })
})
