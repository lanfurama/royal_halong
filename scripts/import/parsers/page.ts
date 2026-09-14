import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { toImageRef, realSrc } from './shared'
import type { ParsedPage, ParsedSection } from '../types'

/**
 * Đẩy một bảng vào `sections` nếu có cả tiêu đề lẫn dữ liệu — bảng rỗng
 * (một `<table>` trang trí không có hàng nào) không sinh ra section thừa.
 */
function pushTable(
  sections: ParsedSection[],
  headers: string[],
  rows: string[][],
  heading?: string,
): void {
  if (headers.length === 0 || rows.length === 0) return
  sections.push({ _type: 'tableSection', heading, headers, rows })
}

export function parsePage(html: string, slug: string): ParsedPage {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, slug === '' ? '.' : slug, 'index.html'))
  const sections: ParsedSection[] = []

  // Nội dung THẬT của trang nằm trong `.container.main-content` — một trong
  // hai con TRỰC TIẾP của `.container-wrap`; con còn lại là
  // `.nectar-global-section.before-footer`, một khối liên hệ/công ty LẶP LẠI
  // giống hệt nhau trên CẢ 22 route (đã xác minh bằng script: đúng 1 phần tử
  // mỗi loại trên mọi route, `before-footer` KHÔNG BAO GIỜ nằm trong
  // main-content). Neo mọi tìm kiếm nội dung trang vào `main` — không dùng `$`
  // (toàn văn kiện) — để không bắt nhầm khối lặp lại này thành nội dung trang
  // trên cả 15 route.
  const main = $('.container.main-content')

  // Hàng "hero" luôn là `.wpb_row.top-level` ĐẦU TIÊN trong nội dung chính —
  // chứa cả ảnh nền (`.row-bg-wrap` đứng trước) lẫn tiêu đề overlay (nếu có)
  // trong `.nectar-split-heading`. KHÔNG dùng `<h1>` đầu trang làm tiêu đề: đã
  // xác minh `<h1>` DUY NHẤT trên MỌI trang luôn là "CT CP QUỐC TẾ HOÀNG GIA"
  // (site-wide, không phải tiêu đề trang) — brief gốc gợi ý `.page-header-content
  // h1` nhưng selector đó không khớp gì trên HTML thật (đã grep xác nhận 0 khớp).
  const introRow = main.find('.wpb_row.top-level').first()
  const introHeadings = introRow.find('h1, h2, h3, h4, h5, h6')
  let heading = textOf(introHeadings.eq(0).html() ?? '')
  let subheading = textOf(introHeadings.eq(1).html() ?? '') || undefined

  // Một số trang (offers, payment-methods) không có chữ overlay trên ảnh hero —
  // ô nội dung của hàng `.top-level` rỗng thật trên nguồn (đã xác minh bằng
  // cách đọc trực tiếp offers/index.html quanh `id="intro"`). Khi đó lấy tiêu đề
  // THẬT đầu tiên của trang, bỏ qua `<h1>` site-wide ở trên.
  if (!heading) {
    // Quét trong `main`, không phải `$` toàn văn kiện — `before-footer`/footer
    // có tới 18 thẻ heading giống nhau trên MỌI route (đã đo); nếu quét toàn
    // văn kiện và một trang tương lai không còn heading nào trong nội dung
    // chính, fallback này sẽ lấy nhầm heading của khối dùng chung.
    heading = textOf(main.find('h2, h3, h4, h5, h6').first().html() ?? '')
    subheading = undefined
  }

  sections.push({
    _type: 'heroSection',
    heading: heading || slug,
    subheading,
    background: toImageRef(realSrc(introRow.find('[data-nectar-img-src]').first()), routeDir),
  })

  // `<table>` thật, nếu có — không trang nào trong 22 route dùng thẻ này (đã
  // grep `<table` = 0 trên toàn bộ 15 route "page"), nhưng giữ nhánh này để
  // không âm thầm bỏ sót nếu một trang tương lai dùng bảng thật.
  main.find('table').each((_, el) => {
    const headers = $(el)
      .find('tr')
      .first()
      .find('th, td')
      .map((_, c) => textOf($(c).html() ?? ''))
      .get()
    if (headers.length === 0) return

    const rows: string[][] = []
    $(el)
      .find('tr')
      .slice(1)
      .each((_, tr) => {
        const cells = $(tr)
          .find('td, th')
          .map((_, c) => textOf($(c).html() ?? ''))
          .get()
        if (cells.length === 0) return
        while (cells.length < headers.length) cells.push('')
        rows.push(cells.slice(0, headers.length))
      })

    pushTable(sections, headers, rows)
  })

  // Bảng luật Baccarat trên casino KHÔNG dùng `<table>` — dựng bằng lưới div:
  // `.inner-toggle-wrap` (bảng) > `.nectar-hor-list-item` (hàng) >
  // `.nectar-list-item` (ô); hàng đầu tiên là tiêu đề. Đã xác minh trực tiếp
  // trên casino/index.html — brief đoán selector `.row .col`, thực tế khác.
  // Selector này không khớp gì trên 14 route "page" còn lại (đã grep xác nhận),
  // nên không tạo bảng giả trên các trang không có lưới div kiểu này.
  main.find('.inner-toggle-wrap').each((_, wrap) => {
    const $wrap = $(wrap)
    // `.toArray()` rồi dùng `Array.prototype.map` gốc — lồng `.map()` của cheerio
    // hai cấp làm TypeScript suy luận sai kiểu (`string[]` phẳng thay vì `string[][]`).
    const rowEls = $wrap.children('.nectar-hor-list-item').toArray()
    if (rowEls.length < 2) return // cần ít nhất 1 hàng tiêu đề + 1 hàng dữ liệu

    const allRows: string[][] = rowEls.map((row) =>
      $(row)
        .children('.nectar-list-item')
        .map((_, c) => textOf($(c).html() ?? ''))
        .get(),
    )
    const headers = allRows[0]
    const rows = allRows.slice(1).map((r) => {
      const padded = [...r]
      while (padded.length < headers.length) padded.push('')
      return padded.slice(0, headers.length)
    })

    const tableHeading =
      textOf($wrap.closest('.toggle').find('h3.toggle-title').first().html() ?? '') || undefined
    pushTable(sections, headers, rows, tableHeading)
  })

  // Widget đặt phòng của SecureBookings — chỉ trang reservation nhúng script
  // này (đã grep xác nhận trên cả 22 route, chỉ reservation có).
  if (html.includes('securebookings.net')) {
    sections.push({ _type: 'bookingWidgetSection' })
  }

  // Hai trang danh sách bài viết. Không có khối này thì /news và /our-announcement
  // chỉ còn hero — bài viết không hiện ở đâu cả.
  if (slug === 'news' || slug === 'our-announcement') {
    sections.push({
      _type: 'postListSection',
      category: slug === 'news' ? 'news' : 'announcement',
      limit: 12,
    })
  }

  // Phần văn bản: `.wpb_text_column` KHÔNG PHẢI wrapper duy nhất site này dùng
  // cho đoạn văn thân trang. Đo trực tiếp trên out/parsed.json và trên HTML
  // thật của cả 15 route "page" (không đoán từ 1 trang): `terms-and-conditions`
  // dùng `.nectar-responsive-text` (10 khối, 0 `.wpb_text_column` thật — trước
  // khi sửa trang này chỉ còn hero, toàn bộ điều khoản biến mất); `wedding` và
  // trang chủ dùng `p.vc_custom_heading` cho đoạn giới thiệu của chính trang đó
  // (vd câu "…156 phòng khách sạn tiêu chuẩn 5 sao…" trên trang chủ). Đã duyệt
  // DOM toàn bộ 15 route để tìm wrapper thứ 4 còn sót — phần văn bản còn lại
  // ngoài 3 selector này chỉ là: ô bảng Baccarat (đã bắt riêng ở tableSection),
  // trích dẫn khách hàng trên trang chủ (đã bắt riêng ở testimonial), và tóm
  // tắt/tiêu đề bài viết động trên /news, /our-announcement (nội dung động do
  // postListSection truy vấn lúc chạy, không nên đông cứng vào richText tĩnh).
  // Không có wrapper thứ 4 nào chứa văn xuôi thật bị bỏ sót.
  const textSelector = '.wpb_text_column, .nectar-responsive-text, p.vc_custom_heading'
  const textNodes = main.find(textSelector).toArray()
  const textNodeSet = new Set(textNodes)

  // Chặn nhân đôi #1 — wrapper LỒNG NHAU cùng khớp selector: bỏ node là hậu
  // duệ của một node khác cũng khớp, để không bắt cả khối cha lẫn khối con bên
  // trong nó thành hai richTextSection chồng nội dung. Chưa gặp trên 3
  // selector hiện tại (đã kiểm tra tường minh: 0 trường hợp lồng nhau trên cả
  // 15 route), nhưng càng nhiều selector cùng hoạt động thì rủi ro này càng
  // tăng khi có route mới — chặn ngay từ bây giờ, không đợi gặp mới sửa.
  const topLevelNodes = textNodes.filter((el) => {
    let ancestor = $(el).parent()
    while (ancestor.length) {
      if (textNodeSet.has(ancestor[0])) return false
      ancestor = ancestor.parent()
    }
    return true
  })

  // Chặn nhân đôi #2 — NỘI DUNG giống hệt lặp lại ở hai node độc lập (không
  // phải quan hệ lồng nhau): gặp THẬT trên wedding — cùng một khối
  // `id="fws_6aa762adc19c3"` (đoạn "Trao lời yêu thương với một nửa của
  // bạn…") bị dán nguyên văn hai lần trong HTML gốc, hai node là ANH EM độc
  // lập nên chặn #1 (theo quan hệ tổ tiên) không bắt được — phải khử theo văn
  // bản thuần.
  const seenText = new Set<string>()
  let richIndex = 0
  for (const el of topLevelNodes) {
    const rawHtml = $(el).html() ?? ''
    const plainText = textOf(rawHtml)
    if (!plainText || seenText.has(plainText)) continue
    seenText.add(plainText)

    const content = toPortableText(rawHtml)
    if (content.length === 0) continue
    sections.push({
      _type: 'richTextSection',
      content,
      tone: richIndex % 2 === 1 ? 'cream' : 'white',
    })
    richIndex += 1
  }

  return {
    kind: 'page',
    slug,
    title: heading || slug,
    sections,
    metaDescription: ($('meta[name="description"]').attr('content') ?? '').trim() || undefined,
  }
}
