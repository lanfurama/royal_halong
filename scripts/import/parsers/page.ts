import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { randomKey } from '@portabletext/block-tools'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { toImageRef, realSrc } from './shared'
import { parseGalleryAlbums } from './gallery'
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

/**
 * Danh sách công bố thông tin trên /our-announcement (96 mục thật trên nguồn —
 * hồ sơ công bố của một công ty niêm yết). Dựng bằng CÙNG lưới div đã dùng cho
 * bảng Baccarat trên casino — `.nectar-hor-list-item` (hàng) >
 * `.nectar-list-item` (ô) — nhưng nằm NGOÀI `.inner-toggle-wrap` nên
 * pushTable() không thấy. Không dùng tableSection ở đây: bảng không có chỗ
 * chứa link, mà link (tới file PDF trên Google Drive/portal ngoài) mới chính
 * là thứ khiến một mục công bố có ích — dựng thủ công thành các khối
 * richTextSection dạng gạch đầu dòng, tiêu đề là link tới `a.full-link`.
 *
 * Đã xác minh trên TOÀN BỘ 97 hàng thật (không chỉ vài hàng đầu): ngày luôn là
 * `.nectar-list-item` #0, tiêu đề luôn là #1 — ổn định trên cả 97 hàng, kể cả
 * hàng tiêu đề cột ("NGÀY"/"THÔNG BÁO", bị loại vì không có `a.full-link`).
 * ĐIỂM LỆCH THẬT (không giả định): 94/96 hàng dữ liệu trỏ tới
 * drive.google.com, nhưng 2 hàng trỏ tới host khác (`ric.ezgsm.fpts.com.vn`,
 * `ric.dhcdonline.com` — cổng thông tin công ty niêm yết / họp cổ đông trực
 * tuyến) — vẫn là công bố thật, có link thật, nên KHÔNG lọc riêng
 * `drive.google.com`, giữ mọi hàng có link hợp lệ. Định dạng ngày cũng không
 * đồng nhất (3 hàng dùng "d/m/yyyy" không có số 0 đứng trước thay vì
 * "dd/mm/yyyy") — giữ nguyên văn, không cố chuẩn hoá.
 */
function parseAnnouncementList($: cheerio.CheerioAPI, main: ReturnType<typeof $>) {
  const blocks: any[] = []
  const seen = new Set<string>()

  main.find('.nectar-hor-list-item').each((_, row) => {
    const $row = $(row)
    const items = $row.children('.nectar-list-item')
    if (items.length !== 2) return

    const date = textOf($(items[0]).html() ?? '')
    const title = textOf($(items[1]).html() ?? '')
    const href = $row.find('a.full-link').attr('href')
    // Hàng tiêu đề cột không có link — bị loại tự nhiên bằng điều kiện này,
    // không cần so khớp cứng chuỗi "NGÀY"/"THÔNG BÁO" (đỡ phụ thuộc ngôn ngữ).
    if (!date || !title || !href) return

    // Phòng khi dữ liệu nguồn dán trùng một hàng (đã gặp kiểu lỗi này ở
    // wedding) — chưa thấy trên trang này (đã kiểm tường minh: 0 hàng trùng
    // cả ba trường ngày+tiêu đề+link) nhưng chặn sẵn, không đợi gặp mới sửa.
    const key = `${date}|${title}|${href}`
    if (seen.has(key)) return
    seen.add(key)

    const linkKey = randomKey(12)
    blocks.push({
      _type: 'block',
      _key: randomKey(12),
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [{ _type: 'link', _key: linkKey, href }],
      children: [
        { _type: 'span', _key: randomKey(12), text: `${date} — `, marks: [] },
        { _type: 'span', _key: randomKey(12), text: title, marks: [linkKey] },
      ],
    })
  })

  return blocks
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

  // /news khớp đúng 3 tài liệu `post` category 'news' — postListSection hợp
  // lý, giữ nguyên. /our-announcement KHÔNG có tài liệu `post` category
  // 'announcement' nào (cả 3 post hiện có đều 'news') — postListSection ở đây
  // khớp 0 tài liệu, trang sẽ hiện hero rồi tới thông báo "chưa có bài viết"
  // ngay phía trên 96 công bố thật. Dùng danh sách công bố dựng thủ công thay
  // vào đó (xem parseAnnouncementList).
  if (slug === 'news') {
    sections.push({ _type: 'postListSection', category: 'news', limit: 12 })
  } else if (slug === 'our-announcement') {
    const announcementBlocks = parseAnnouncementList($, main)
    if (announcementBlocks.length > 0) {
      sections.push({ _type: 'richTextSection', content: announcementBlocks, tone: 'white' })
    }
  } else if (slug === 'our-gallery') {
    // parseGalleryAlbums() (gallery.ts) đổ 5 album thành document `galleryAlbum`
    // riêng trong dataset.albums — nhưng KHÔNG section nào trên trang trỏ tới
    // chúng. `galleryCarouselSection` là section DUY NHẤT transform.ts biến
    // thành reference tới `galleryAlbum` (qua `albumSlug`); từng bị đánh dấu
    // "nhánh chết, vô hại" ở review tổng Plan A — SAI, đây là section duy nhất
    // gắn album vào trang, thiếu nó thì trang chỉ còn hero trên khoảng trống
    // dù 5 document ảnh vẫn tồn tại trong dataset.
    //
    // Gọi LẠI parseGalleryAlbums() trên CHÍNH html của route này thay vì tự
    // tính slug bằng slugify — hai nơi gọi CÙNG MỘT HÀM trên CÙNG MỘT input
    // (html của route 'our-gallery') luôn cho cùng slug, không thể lệch nhau
    // theo thời gian như khi chép lại logic slugify riêng.
    for (const album of parseGalleryAlbums(html)) {
      sections.push({ _type: 'galleryCarouselSection', heading: album.title, albumSlug: album.slug })
    }
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

  // Chặn RÒ RỈ — card "khám phá thêm" dùng chung, không phải nội dung riêng
  // của trang này. Khác loại với hai chặn "nhân đôi" dưới đây (#1, #2): đây
  // không phải một đoạn bị bắt HAI LẦN, mà là nội dung THỪA không thuộc trang
  // này bị bắt THÊM VÀO — phát hiện của reviewer sau vòng sửa trước (mở rộng
  // selector vô tình bắt luôn card quảng bá chéo). Card này có CÙNG hình dạng
  // DOM với mô tả phòng/hall/venue thật — h4 + đoạn text + `.nectar-cta` —
  // nên CHỈ xét "wrapper chứa .nectar-cta" là chưa đủ, đã tự đo và xoá nhầm:
  // mô tả phòng thật trên luu-tru-phong-khach-san-villas (7 khối), mô tả sảnh
  // thật trên royal-international-convention-palace (3 khối), mô tả nhà
  // hàng/quầy bar thật trên culinary (5 khối). Điểm khác biệt THẬT (đo trên
  // toàn bộ 15 route, không suy diễn): card quảng bá chéo LUÔN nằm ở hàng
  // top-level CUỐI CÙNG trong main-content — đúng như reviewer mô tả "cards ở
  // cuối template" — trong khi mô tả phòng/hall/venue nằm giữa trang. Kết hợp
  // CẢ hai điều kiện (wrapper có cta + nằm ở hàng cuối) tách sạch: kiểm trên
  // mọi khối bị loại lẫn mọi khối giữ lại trên cả 15 route, khớp 100% với
  // danh sách rò rỉ đã xác nhận (0 false positive, 0 false negative).
  const topLevelRows = main.children('.row').children('.wpb_row').toArray()
  const lastTopLevelRow = topLevelRows[topLevelRows.length - 1]
  const bodyNodes = topLevelNodes.filter((el) => {
    if (!lastTopLevelRow) return true
    const wrapper = $(el).closest('.wpb_wrapper')
    const hasCta = wrapper.length > 0 && wrapper.find('.nectar-cta').length > 0
    if (!hasCta) return true
    return !$.contains(lastTopLevelRow, el)
  })

  // Chặn nhân đôi #2 — NỘI DUNG giống hệt lặp lại ở hai node độc lập (không
  // phải quan hệ lồng nhau): gặp THẬT trên wedding — cùng một khối
  // `id="fws_6aa762adc19c3"` (đoạn "Trao lời yêu thương với một nửa của
  // bạn…") bị dán nguyên văn hai lần trong HTML gốc, hai node là ANH EM độc
  // lập nên chặn #1 (theo quan hệ tổ tiên) không bắt được — phải khử theo văn
  // bản thuần.
  const seenText = new Set<string>()
  let richIndex = 0
  for (const el of bodyNodes) {
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
