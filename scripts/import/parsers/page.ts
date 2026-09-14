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

  // Hàng "hero" luôn là `.wpb_row.top-level` ĐẦU TIÊN trong nội dung chính —
  // chứa cả ảnh nền (`.row-bg-wrap` đứng trước) lẫn tiêu đề overlay (nếu có)
  // trong `.nectar-split-heading`. KHÔNG dùng `<h1>` đầu trang làm tiêu đề: đã
  // xác minh `<h1>` DUY NHẤT trên MỌI trang luôn là "CT CP QUỐC TẾ HOÀNG GIA"
  // (site-wide, không phải tiêu đề trang) — brief gốc gợi ý `.page-header-content
  // h1` nhưng selector đó không khớp gì trên HTML thật (đã grep xác nhận 0 khớp).
  const introRow = $('.wpb_row.top-level').first()
  const introHeadings = introRow.find('h1, h2, h3, h4, h5, h6')
  let heading = textOf(introHeadings.eq(0).html() ?? '')
  let subheading = textOf(introHeadings.eq(1).html() ?? '') || undefined

  // Một số trang (offers, payment-methods) không có chữ overlay trên ảnh hero —
  // ô nội dung của hàng `.top-level` rỗng thật trên nguồn (đã xác minh bằng
  // cách đọc trực tiếp offers/index.html quanh `id="intro"`). Khi đó lấy tiêu đề
  // THẬT đầu tiên của trang, bỏ qua `<h1>` site-wide ở trên.
  if (!heading) {
    heading = textOf($('h2, h3, h4, h5, h6').first().html() ?? '')
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
  $('table').each((_, el) => {
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
  $('.inner-toggle-wrap').each((_, wrap) => {
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

  // Phần văn bản: mỗi .wpb_text_column thành một richTextSection.
  $('.wpb_text_column').each((index, el) => {
    const content = toPortableText($(el).html() ?? '')
    if (content.length === 0) return
    sections.push({
      _type: 'richTextSection',
      content,
      tone: index % 2 === 1 ? 'cream' : 'white',
    })
  })

  return {
    kind: 'page',
    slug,
    title: heading || slug,
    sections,
    metaDescription: ($('meta[name="description"]').attr('content') ?? '').trim() || undefined,
  }
}
