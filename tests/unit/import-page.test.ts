import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import { parsePage } from '@/scripts/import/parsers/page'
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

// 3 route mà nội dung chính THẬT SỰ không phải văn xuôi tĩnh — xác minh trực
// tiếp trên HTML gốc (không suy ra từ output của parser đang được kiểm):
//  - reservation: chữ hiển thị của main-content (đã loại <script>/<style>) chỉ
//    59 ký tự — trang gần như chỉ là widget đặt phòng SecureBookings nhúng qua
//    iframe, không có văn xuôi để bắt.
//  - news, our-announcement: phần lớn chữ hiển thị nằm trong `.posts-container`
//    — bản xem trước bài viết WordPress render tĩnh vào HTML lúc export, nhưng
//    ở site Next.js sẽ do postListSection truy vấn ĐỘNG lúc chạy; đông cứng nó
//    vào richTextSection là sai — không phải chỗ thiếu cần bắt thêm.
const DYNAMIC_OR_TRIVIAL_ROUTES = new Set(['reservation', 'news', 'our-announcement'])

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
