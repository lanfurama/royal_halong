import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import { parsePage } from '@/scripts/import/parsers/page'
import { parseGalleryAlbums } from '@/scripts/import/parsers/gallery'
import { routeToHtmlPath, ROUTES } from '@/scripts/import/paths'
import { ROOM_SLUGS, POST_SLUGS } from '@/scripts/import/parse'

const read = (r: string) => readFile(routeToHtmlPath(r), 'utf-8')

describe('parsePage()', () => {
  it('trang casino có hero và ít nhất một bảng luật Baccarat', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    expect(page.sections[0]._type).toBe('heroSection')
    const tables = page.sections.filter((s) => s._type === 'tableSection')
    expect(tables.length).toBeGreaterThanOrEqual(1)
  })

  it('bảng Baccarat có hàng tiêu đề và các hàng dữ liệu', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    const table = page.sections.find((s) => s._type === 'tableSection') as any
    expect(table.headers.length).toBeGreaterThan(0)
    expect(table.rows.length).toBeGreaterThan(0)
    // mọi hàng có cùng số ô với hàng tiêu đề
    for (const row of table.rows) {
      expect(row.length).toBe(table.headers.length)
    }
  })

  it('trang reservation có khối widget đặt phòng', async () => {
    const page = await read('reservation').then((h) => parsePage(h, 'reservation'))
    expect(page.sections.some((s) => s._type === 'bookingWidgetSection')).toBe(true)
  })

  it('trang news có khối danh sách bài viết (khớp đúng 3 post category news)', async () => {
    const page = await read('news').then((h) => parsePage(h, 'news'))
    const list = page.sections.find((sec) => sec._type === 'postListSection') as any
    expect(list, 'news phải có postListSection').toBeTruthy()
    expect(list.category).toBe('news')
  })

  it('trang our-announcement KHÔNG có postListSection — không có post nào category announcement để khớp', async () => {
    const page = await read('our-announcement').then((h) => parsePage(h, 'our-announcement'))
    expect(page.sections.some((sec) => sec._type === 'postListSection')).toBe(false)
  })

  it('trang our-announcement đổ 96 công bố thật thành một richTextSection dạng gạch đầu dòng có link', async () => {
    const page = await read('our-announcement').then((h) => parsePage(h, 'our-announcement'))
    const rich = page.sections.filter((s) => s._type === 'richTextSection') as any[]
    expect(rich.length, 'phải có ít nhất 1 richTextSection chứa danh sách công bố').toBeGreaterThan(0)

    const items = rich.flatMap((s) => s.content)
    // Dữ liệu thật có 96 công bố (đã đếm trực tiếp trên our-announcement/index.html) —
    // đòi > 50 để chống bắt-vài-mục-rồi-dừng, không đòi đúng 96 để không giòn theo
    // dữ liệu nguồn cập nhật.
    expect(items.length, 'phải có nhiều mục — dữ liệu thật có 96 công bố').toBeGreaterThan(50)

    const hasDriveLink = items.some((block: any) =>
      (block.markDefs ?? []).some(
        (def: any) => def._type === 'link' && def.href?.includes('drive.google.com'),
      ),
    )
    expect(hasDriveLink, 'phải có ít nhất một mục mang link Google Drive').toBe(true)
  })

  it('trang thường KHÔNG có khối danh sách bài viết', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    expect(page.sections.some((sec) => sec._type === 'postListSection')).toBe(false)
  })

  it('trang chính sách bảo mật có nội dung văn bản dài', async () => {
    const page = await read('privacy-policy').then((h) => parsePage(h, 'privacy-policy'))
    const rich = page.sections.filter((s) => s._type === 'richTextSection') as any[]
    const total = rich.reduce((n, s) => n + s.content.length, 0)
    expect(total).toBeGreaterThan(10)
  })

  it('lấy được tiêu đề trang', async () => {
    const page = await read('wedding').then((h) => parsePage(h, 'wedding'))
    expect(page.title.length).toBeGreaterThan(0)
  })
})

describe('slug giữ nguyên để không mất SEO', () => {
  it('không đổi tên slug gốc', async () => {
    const page = await read('luu-tru-phong-khach-san-villas').then((h) =>
      parsePage(h, 'luu-tru-phong-khach-san-villas'),
    )
    expect(page.slug).toBe('luu-tru-phong-khach-san-villas')
  })
})

// 15 route "page": ROUTES trừ 4 route phòng và 3 route bài viết — LẤY TRỰC TIẾP
// từ parse.ts (một nguồn sự thật duy nhất), không liệt kê lại 15 slug bằng tay.
// Đây chính là công thức parse.ts dùng để đổ vào dataset.pages.
const nonPageRoutes = new Set<string>([...ROOM_SLUGS, ...POST_SLUGS])
const PAGE_ROUTES = ROUTES.filter((r) => !nonPageRoutes.has(r))

// 4 route mà nội dung chính THẬT SỰ không phải văn xuôi tĩnh — xác minh trực
// tiếp trên HTML gốc (không suy ra từ output của parser đang được kiểm):
//  - reservation: chữ hiển thị của main-content (đã loại <script>/<style>) chỉ
//    59 ký tự — trang gần như chỉ là widget đặt phòng SecureBookings nhúng qua
//    iframe, không có văn xuôi để bắt.
//  - news, our-announcement: phần lớn chữ hiển thị nằm trong `.posts-container`
//    — bản xem trước bài viết WordPress render tĩnh vào HTML lúc export, nhưng
//    ở site Next.js sẽ do postListSection truy vấn ĐỘNG lúc chạy; đông cứng nó
//    vào richTextSection là sai — không phải chỗ thiếu cần bắt thêm.
//  - our-gallery: toàn bộ 2 khối `.wpb_text_column`/`p.vc_custom_heading` từng
//    khớp trên trang này ĐỀU là card "khám phá thêm" dùng chung (rò rỉ đã sửa
//    ở vòng này, xem chặn RÒ RỈ trong page.ts) — trang thật KHÔNG có văn xuôi
//    riêng nào ngoài card đó (đã xác minh: 0 khối còn lại sau khi loại card).
//    Ngưỡng 20% giờ đúng ra phải là 0% cho route này, không phải một khoảng
//    thiếu cần bắt thêm.
const DYNAMIC_OR_TRIVIAL_ROUTES = new Set(['reservation', 'news', 'our-announcement', 'our-gallery'])

// Ngưỡng tối thiểu — chọn AN TOÀN dưới tỉ lệ thật thấp nhất trong số các route
// có văn xuôi tĩnh thật sau khi sửa (trang chủ, ~30%), và cao hơn nhiều so với
// tỉ lệ đo được trên các route từng hỏng TRƯỚC khi sửa bằng đúng công thức bên
// dưới (trang chủ ~9.6%, terms-and-conditions ~2.6%, khi parsePage() chỉ khớp
// `.wpb_text_column` không giới hạn phạm vi — bản trước khi sửa lần này).
const MIN_CAPTURE_RATIO = 0.2

/**
 * Chữ hiển thị của một phần tử — bỏ nội dung `<script>/<style>/<noscript>` vì
 * đó không phải "văn bản nhìn thấy được" theo nghĩa trình duyệt render (một
 * `<style>` nội tuyến của WPBakery có thể dài hàng nghìn ký tự CSS và làm
 * lệch phép so sánh nếu không loại). Đo ĐỘC LẬP với cách parser tự chọn
 * wrapper — không gọi lại logic của page.ts.
 */
function visibleText($el: ReturnType<ReturnType<typeof cheerio.load>>): string {
  const clone = $el.clone()
  clone.find('script, style, noscript').remove()
  return clone.text().replace(/\s+/g, ' ').trim()
}

/** Gộp phẳng mọi đoạn chữ trong PortableTextBlock[] thành một chuỗi thuần. */
function flattenText(blocks: any[]): string {
  return blocks
    .filter((b) => b._type === 'block' && Array.isArray(b.children))
    .flatMap((b) => b.children.map((c: any) => c.text ?? ''))
    .join('')
}

describe('parsePage() trên cả 15 route "page" thật — chống bắt thiếu và bắt trùng văn xuôi', () => {
  it.each(PAGE_ROUTES)(
    'route "%s": richTextSection không rò rỉ khối liên hệ dùng chung, không bắt thiếu văn xuôi thân trang',
    async (route) => {
      const html = await read(route)
      const $ = cheerio.load(html)
      const main = $('.container.main-content')

      // Khối liên hệ/công ty lặp lại GIỐNG HỆT NHAU trên cả 22 route, nằm
      // NGOÀI main-content (`.nectar-global-section.before-footer` — con trực
      // tiếp còn lại của `.container-wrap`, main-content là con kia) — đo độc
      // lập từ HTML gốc bằng chính selector đã xác minh cấu trúc, không phụ
      // thuộc cách page.ts chọn wrapper văn xuôi. `footerText` gồm CẢ khối này
      // (menu, liên hệ, đoạn công ty, bản quyền…) nên phép kiểm là "khối đã bắt
      // có nằm trong đó" — không phải so khớp tuyệt đối cả khối.
      const footerText = visibleText($('.nectar-global-section.before-footer'))
      expect(
        footerText.length,
        `${route || '(home)'}: không đo được khối before-footer để so sánh — cấu trúc trang đã đổi?`,
      ).toBeGreaterThan(0)

      const page = parsePage(html, route)
      const richSections = page.sections.filter((s) => s._type === 'richTextSection') as any[]

      // Chặn RÒ RỈ: không có KHỐI richTextSection nào (từng khối riêng, không
      // phải toàn bộ ghép lại) là một đoạn nằm trong khối before-footer dùng
      // chung — đây chính là lỗi Minor của review, xảy ra thật trên cả 15
      // route trước khi sửa. So sau khi bỏ SẠCH khoảng trắng (không chỉ gộp
      // `\s+` thành một dấu cách) ở CẢ HAI phía: đo trực tiếp thấy
      // `toPortableText()` đôi khi không giữ dấu cách giữa hai dòng nguồn liền
      // nhau (vd "Việt Nam" + "Hotline:" nối liền thành "Việt NamHotline:"
      // trong block, trong khi `.text()` giữ dấu cách) — so khớp còn dấu cách
      // sẽ báo "không rò rỉ" MỘT CÁCH SAI dù rò rỉ thật sự xảy ra; bỏ hẳn
      // khoảng trắng loại bỏ đúng sự khác biệt định dạng vô hại này mà không
      // làm mất khả năng phát hiện rò rỉ (236+ ký tự riêng biệt, không có rủi
      // ro trùng ngẫu nhiên).
      const stripSpace = (s: string) => s.replace(/\s+/g, '')
      const footerNoSpace = stripSpace(footerText)
      const leakedBlock = richSections.find((s) => {
        const blockText = flattenText(s.content)
        const blockNoSpace = stripSpace(blockText)
        return blockNoSpace.length > 20 && footerNoSpace.includes(blockNoSpace)
      })
      expect(
        leakedBlock,
        `${route || '(home)'}: một khối richTextSection nằm trong khối before-footer dùng chung — bị rò rỉ`,
      ).toBeUndefined()

      const richTextCombined = richSections.map((s) => flattenText(s.content)).join('\n')

      if (DYNAMIC_OR_TRIVIAL_ROUTES.has(route)) return // lý do miễn: xem comment ở khai báo tập hợp

      // Chặn BẮT THIẾU: so văn xuôi đã bắt được với chữ hiển thị thật của
      // main-content — đo độc lập bằng `.text()` sau khi loại script/style,
      // không phụ thuộc việc page.ts có biết wrapper class nào hay không. Đây
      // là lý do test này sẽ đỏ trước khi sửa: bản cũ chỉ khớp
      // `.wpb_text_column` nên bỏ sót toàn bộ nội dung dùng
      // `.nectar-responsive-text` (terms-and-conditions) và `p.vc_custom_heading`
      // (trang chủ, wedding).
      const mainVisibleLen = visibleText(main).length
      const richTextLen = richTextCombined.replace(/\n/g, '').length
      expect(
        richTextLen,
        `${route || '(home)'}: chỉ bắt được ${richTextLen}/${mainVisibleLen} ký tự chữ hiển thị của ` +
          `main-content (< ${MIN_CAPTURE_RATIO * 100}%) — có khả năng còn wrapper văn xuôi chưa được khớp`,
      ).toBeGreaterThanOrEqual(mainVisibleLen * MIN_CAPTURE_RATIO)
    },
  )
})

// Card "khám phá thêm" dùng chung — cùng hình dạng DOM với văn xuôi thật
// (h4 + đoạn text + `.nectar-cta`) nên việc mở rộng selector ở trên vô tình
// bắt luôn 3 câu quảng bá chéo này trên các trang KHÔNG PHẢI chủ của chúng
// (reviewer đo trực tiếp trên out/parsed.json). Với mỗi câu, `ownRoute` là
// route DUY NHẤT nơi câu đó là nội dung thật của chính trang — xác minh bằng
// cách grep câu trên cả 15 route rồi map với đích của `.nectar-cta` tương
// ứng: "Trao lời yêu thương…" trỏ `wedding`, "Tận hưởng không gian sang
// trọng…" trỏ `luu-tru-phong-khach-san-villas` — cả hai câu THẬT SỰ tồn tại
// trên đúng route đó dưới dạng nội dung riêng (không đi kèm `.nectar-cta`
// trong wrapper gần nhất, nên không bị chặn RÒ RỈ loại bỏ). "Tận hưởng tối đa
// kỳ nghỉ…" trỏ `offers`, nhưng bản thân trang offers KHÔNG chứa câu này —
// đã grep xác nhận — nên câu này không có "trang chủ" thật nào trong 15 route
// và phải biến mất ở MỌI route sau khi sửa, kể cả offers.
const CROSS_SELL_SENTENCES: Array<{ text: string; ownRoute: string | null }> = [
  {
    text: 'Trao lời yêu thương với một nửa của bạn tại Cung Hội nghị Quốc tế Hoàng Gia.',
    ownRoute: 'wedding',
  },
  {
    text: 'Tận hưởng không gian sang trọng và ấm cúng tại khách sạn Royal Hạ Long',
    ownRoute: 'luu-tru-phong-khach-san-villas',
  },
  { text: 'Tận hưởng tối đa kỳ nghỉ', ownRoute: null },
]

describe('richTextSection không rò rỉ card quảng bá chéo sang trang khác', () => {
  it.each(PAGE_ROUTES)('route "%s" không chứa câu quảng bá chéo của trang khác', async (route) => {
    const html = await read(route)
    const page = parsePage(html, route)
    const richSections = page.sections.filter((s) => s._type === 'richTextSection') as any[]
    const combined = richSections.map((s) => flattenText(s.content)).join(' ')

    for (const { text, ownRoute } of CROSS_SELL_SENTENCES) {
      if (route === ownRoute) continue // trang chủ thật của câu này — được giữ
      expect(
        combined.includes(text),
        `${route || '(home)'}: chứa câu quảng bá chéo "${text.slice(0, 40)}…" — không phải nội dung của trang này`,
      ).toBe(false)
    }
  })
})

describe('trang our-gallery gắn đúng 5 album vào trang bằng galleryCarouselSection', () => {
  it('mỗi galleryCarouselSection.albumSlug khớp CHÍNH XÁC slug mà parseGalleryAlbums() sinh ra cho cùng trang', async () => {
    const html = await read('our-gallery')
    const page = parsePage(html, 'our-gallery')
    const carousels = page.sections.filter((s) => s._type === 'galleryCarouselSection') as any[]

    // Nguồn sự thật độc lập: gọi thẳng parseGalleryAlbums() — hàm dataset.albums
    // trong parse.ts cũng gọi — không tự đoán/hard-code 5 slug bằng tay, để
    // test không lệch nếu dữ liệu nguồn hoặc slugify() đổi.
    const albums = parseGalleryAlbums(html)
    expect(albums.length, 'dữ liệu thật phải có 5 album').toBe(5)

    expect(carousels.length, 'phải có đúng 1 galleryCarouselSection cho mỗi album').toBe(albums.length)
    expect(carousels.map((c) => c.albumSlug).sort()).toEqual(albums.map((a) => a.slug).sort())
  })

  it('KHÔNG route "page" nào khác có galleryCarouselSection', async () => {
    for (const route of PAGE_ROUTES) {
      if (route === 'our-gallery') continue
      const html = await read(route)
      const page = parsePage(html, route)
      expect(
        page.sections.some((s) => s._type === 'galleryCarouselSection'),
        `${route || '(home)'}: có galleryCarouselSection — chỉ our-gallery được phép có`,
      ).toBe(false)
    }
  })
})

// Fix 5 — trước bản sửa này, page.ts gộp section theo LOẠI (hero -> mọi bảng
// -> bookingWidget -> danh sách -> mọi richText) thay vì theo thứ tự thật của
// tài liệu nguồn. Trên /casino, thứ tự thật là: đoạn văn giới thiệu Baccarat
// rồi mới tới 2 bảng luật rút bài — bản cũ đẩy CẢ 2 bảng lên NGAY dưới hero,
// phía TRÊN đoạn văn giới thiệu.
describe('Fix 5 — section xếp theo thứ tự tài liệu nguồn, không gộp theo loại', () => {
  it('/casino: richTextSection đầu tiên đứng TRƯỚC tableSection đầu tiên', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    const firstRichIndex = page.sections.findIndex((s) => s._type === 'richTextSection')
    const firstTableIndex = page.sections.findIndex((s) => s._type === 'tableSection')
    expect(firstRichIndex, 'phải có ít nhất 1 richTextSection').toBeGreaterThanOrEqual(0)
    expect(firstTableIndex, 'phải có ít nhất 1 tableSection').toBeGreaterThanOrEqual(0)
    expect(firstRichIndex).toBeLessThan(firstTableIndex)
  })
})

// Fix 6 — trước bản sửa này, KHÔNG richTextSection nào từng có `heading` dù
// field đã tồn tại trong type/schema. Trên /culinary, nguồn có 4 heading thật
// (NHÀ HÀNG PHÚC VIÊN, PIANO BAR, POOL BAR, LA TERRASSE) đứng trước 6 đoạn
// văn — bản cũ bỏ hết, ra 6 đoạn không nhãn.
describe('Fix 6 — richTextSection.heading lấy từ heading THẬT đứng trước nó', () => {
  it('/culinary: mỗi đoạn mô tả nhà hàng/quầy bar mang đúng heading của nó', async () => {
    const page = await read('culinary').then((h) => parsePage(h, 'culinary'))
    const rich = page.sections.filter((s) => s._type === 'richTextSection') as any[]
    const headings = rich.map((s) => s.heading)
    expect(headings).toContain('NHÀ HÀNG PHÚC VIÊN')
    expect(headings).toContain('PIANO BAR')
    expect(headings).toContain('POOL BAR')
    expect(headings).toContain('LA TERRASSE')
    // Cả 3 đoạn của Phúc Viên đều mang CÙNG heading — heading áp dụng cho MỌI
    // đoạn văn cho tới khi gặp heading tiếp theo trong nguồn, không chỉ đoạn
    // đầu tiên.
    const phucVienCount = headings.filter((h) => h === 'NHÀ HÀNG PHÚC VIÊN').length
    expect(phucVienCount).toBe(3)
  })

  it('heroSection.heading KHÔNG bị gán lại làm heading của đoạn văn đầu tiên', async () => {
    const page = await read('wedding').then((h) => parsePage(h, 'wedding'))
    const hero = page.sections.find((s) => s._type === 'heroSection') as any
    const rich = page.sections.filter((s) => s._type === 'richTextSection') as any[]
    for (const s of rich) {
      expect(s.heading).not.toBe(hero.heading)
    }
  })
})

// Fix 2 — 8 document venue + 3 document hall (và 4 document room) trước bản
// sửa này không được section nào trên trang trỏ tới — không route nào trong
// Plan C tới được, dù document tồn tại trong dataset.
describe('Fix 2 — venueListSection/hallListSection/roomListSection chỉ ở đúng 4 route', () => {
  const LIST_TYPES = ['venueListSection', 'hallListSection', 'roomListSection']

  it('culinary có venueListSection filterKind=dining, experiences có filterKind=facility', async () => {
    const culinary = await read('culinary').then((h) => parsePage(h, 'culinary'))
    const experiences = await read('experiences').then((h) => parsePage(h, 'experiences'))
    const culinaryList = culinary.sections.find((s) => s._type === 'venueListSection') as any
    const experiencesList = experiences.sections.find((s) => s._type === 'venueListSection') as any
    expect(culinaryList?.filterKind).toBe('dining')
    expect(experiencesList?.filterKind).toBe('facility')
  })

  it('royal-international-convention-palace có hallListSection', async () => {
    const page = await read('royal-international-convention-palace').then((h) =>
      parsePage(h, 'royal-international-convention-palace'),
    )
    expect(page.sections.some((s) => s._type === 'hallListSection')).toBe(true)
  })

  it('luu-tru-phong-khach-san-villas có roomListSection', async () => {
    const page = await read('luu-tru-phong-khach-san-villas').then((h) =>
      parsePage(h, 'luu-tru-phong-khach-san-villas'),
    )
    expect(page.sections.some((s) => s._type === 'roomListSection')).toBe(true)
  })

  it('KHÔNG route "page" nào khác có 3 loại danh sách này', async () => {
    const exempt = new Set([
      'culinary',
      'experiences',
      'royal-international-convention-palace',
      'luu-tru-phong-khach-san-villas',
    ])
    for (const route of PAGE_ROUTES) {
      if (exempt.has(route)) continue
      const page = await read(route).then((h) => parsePage(h, route))
      const found = page.sections.filter((s) => LIST_TYPES.includes(s._type as any))
      expect(found, `${route || '(home)'}: không được có ${LIST_TYPES.join('/')}`).toHaveLength(0)
    }
  })
})

// Fix 3 — `htmlToBlocks()` mặc định sinh `_key` ngẫu nhiên; `parseAnnouncementList()`
// cũng từng gọi `randomKey(12)` trực tiếp. `out/documents.ndjson` khác nhau ở
// MỌI lần chạy dù HTML nguồn không đổi, phá cơ chế "xuất NDJSON ra soát trước
// khi ghi" của spec (không thể diff hai lần chạy).
describe('Fix 3 — parsePage() tất định: cùng input, hai lần gọi cho kết quả HỆT NHAU', () => {
  it.each(['casino', 'our-announcement', 'wedding', 'terms-and-conditions'])(
    'route "%s": parsePage() hai lần liên tiếp ra JSON giống hệt (kể cả mọi _key)',
    async (route) => {
      const html = await read(route)
      const a = parsePage(html, route)
      const b = parsePage(html, route)
      expect(a).toEqual(b)
      expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    },
  )
})
