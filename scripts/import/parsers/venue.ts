import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef, realSrc, isCrossSellBlock, descriptionChunkHtml } from './shared'
import type { ParsedVenue } from '../types'

/**
 * Các NHÃN PHỤ (ĐỊA ĐIỂM/SỨC CHỨA/MỞ CỬA/CÁC MÓN ĐẶC TRƯNG) nằm trong khối chi
 * tiết của nhà hàng chính trên trang culinary — cũng viết hoa toàn bộ như tên
 * venue thật nên lọt qua heuristic "tên viết hoa" nếu không loại trừ tường
 * minh. KHÁC LOẠI với card CTA quảng bá chéo dùng chung (Lưu trú/Tiệc cưới…):
 * đây không phải nội dung LẶP LẠI ở cuối trang mà là nhãn THẬT của chính venue
 * này, nên không thể thay bằng vị từ cấu trúc `isCrossSellBlock()` — vẫn cần
 * danh sách chuỗi riêng cho đúng nhóm này.
 */
const NOT_A_VENUE_LABEL = ['Địa điểm', 'Sức chứa', 'Mở cửa', 'Các món đặc trưng']

/** Chuỗi không chứa chữ cái nào (vd "24/7") chắc chắn không phải tên venue. */
const HAS_LETTER = /[A-Za-zÀ-ỹ]/

export function parseVenues(
  html: string,
  route: string,
  venueKind: 'dining' | 'facility',
): ParsedVenue[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, route, 'index.html'))
  const main = $('.container.main-content')
  const venues: ParsedVenue[] = []

  // Nhãn (ĐỊA ĐIỂM/SỨC CHỨA/MỞ CỬA) và giá trị đi kèm không phải hai h5 anh em như
  // brief giả định. Cấu trúc thật là cặp <div class="nectar-list-item"> anh em
  // trong một .nectar-hor-list-item: mục nhãn có thể là text thường (trang
  // experiences) hoặc bọc trong h5 (trang culinary) — giá trị luôn là mục
  // .nectar-list-item kế tiếp. Dò trên .nectar-list-item, không dò trên h5.
  const valueAfterLabel = (scope: ReturnType<typeof $>, label: string): string | undefined => {
    let found: string | undefined
    scope.find('.nectar-list-item').each((_, el) => {
      if (textOf($(el).html() ?? '').toUpperCase().includes(label.toUpperCase())) {
        const next = $(el).next('.nectar-list-item')
        if (next.length) found = textOf(next.html() ?? '')
      }
    })
    return found
  }

  // Như `valueAfterLabel()` nhưng giữ NGUYÊN khoảng trắng/dòng — dùng riêng
  // cho "CÁC MÓN ĐẶC TRƯNG": giá trị nguồn là một `<h5>` với các dòng ngăn
  // bằng `<br>`, và `.text()` của cheerio giữ lại ký tự xuống dòng thật giữa
  // các dòng đó (đo trực tiếp trên culinary/index.html). `valueAfterLabel()`
  // dùng `textOf()` — gộp MỌI khoảng trắng thành một dấu cách, xoá mất ranh
  // giới giữa các món ăn, không thể split lại được nữa.
  const rawValueAfterLabel = (scope: ReturnType<typeof $>, label: string): string | undefined => {
    let found: string | undefined
    scope.find('.nectar-list-item').each((_, el) => {
      if (textOf($(el).html() ?? '').toUpperCase().includes(label.toUpperCase())) {
        const next = $(el).next('.nectar-list-item')
        if (next.length) found = next.text()
      }
    })
    return found
  }

  // Nhà hàng chính nằm ở h5, các outlet còn lại ở h4.
  $('h4, h5').each((index, el) => {
    const name = textOf($(el).html() ?? '')
    // Tên venue thật dài nhất trên trang thật là "OUTDOOR SWIMMING POOL" (21 ký
    // tự); ngưỡng 35 loại được câu tiêu đề banner đầu trang kiểu "TRẢI NGHIỆM ẨM
    // THỰC ĐA DẠNG TINH TÚY TẠI ROYAL HẠ LONG" (54 ký tự) mà vẫn viết hoa toàn bộ
    // nên lọt qua heuristic nếu chỉ giới hạn 60 như brief ban đầu.
    if (!name || name.length > 35) return
    if (!HAS_LETTER.test(name)) return
    if (NOT_A_VENUE_LABEL.some((s) => name.toLowerCase().includes(s.toLowerCase()))) return
    // Card CTA quảng bá chéo dùng chung ("Tiệc cưới", "Chương trình ưu đãi",
    // "Lưu trú", "Cung Hội Nghị…") — trước đây chặn bằng danh sách chuỗi chữ
    // Việt cứng, đổi câu CTA là né được ngay. Thay bằng vị từ CẤU TRÚC dùng
    // chung với page.ts/hall.ts/offer.ts.
    if (isCrossSellBlock($, main, el)) return
    // Chỉ nhận tên viết hoa — quy ước của bản gốc cho tên outlet.
    if (name !== name.toUpperCase()) return
    if (venues.some((v) => v.name === name)) return

    // h5 của nhà hàng chính (và đôi khi h4 outlet) bị bọc trong div
    // .nectar-split-heading — bản thân heading không còn anh em nào (nội dung
    // thật là anh em của WRAPPER). Nếu heading nằm trong wrapper đó thì duyệt anh
    // em từ wrapper; nếu không (outlet dạng h4 trần như PIANO BAR) thì duyệt từ
    // chính heading như cũ.
    const container = $(el).parent().hasClass('nectar-split-heading') ? $(el).parent() : $(el)
    const chunk = container.nextUntil('h4, h5, .nectar-split-heading:has(h4, h5)')
    // `chunk` thô còn lẫn lưới nhãn/giá trị `.nectar-hor-list-item` (ĐỊA
    // ĐIỂM/SỨC CHỨA/MỞ CỬA/CÁC MÓN ĐẶC TRƯNG — đã bóc riêng thành field cấu
    // trúc hoặc `highlights` bên dưới) — loại khỏi mô tả để không lặp lại.
    // Đo trực tiếp trên NHÀ HÀNG PHÚC VIÊN: description từ 14 khối (8 khối
    // cuối là lưới nhãn/giá trị lặp lại location/capacity/hours + món ăn)
    // xuống còn đúng phần văn xuôi + số hotline.
    const bodyHtml = descriptionChunkHtml($, chunk)

    // Ảnh venue là <div class="column-image-bg" data-nectar-img-src="..."> ở cột
    // anh em trong cùng .wpb_row — không phải <img> trong chunk. Tìm trong chunk
    // trước (phòng trường hợp có <img> thật), lùi ra cả hàng nếu không thấy.
    //
    // CỐ Ý KHÔNG mở rộng tìm kiếm ra ngoài .wpb_row của chính heading (ví dụ dò
    // sang .wpb_row kế tiếp). NHÀ HÀNG PHÚC VIÊN trên culinary hợp lệ không có
    // [data-nectar-img-src] nào trong hàng của nó — đã xác minh trực tiếp bằng
    // cách in con của .wpb_row đó, chỉ có 2 phần tử, không phần tử nào mang ảnh.
    // Có một .wpb_gallery ảnh nhà hàng nằm ở .wpb_row liền sau, nhưng không có gì
    // trong markup xác nhận nó thuộc về Phúc Viên chứ không phải một dải ảnh độc
    // lập theo ranh giới section — "gần" trong file không phải "thuộc về" trong
    // DOM. Nếu đoán nhầm, ảnh sai sẽ gắn vào nhà hàng chính một cách âm thầm, tệ
    // hơn nhiều so với để trống cho biên tập viên điền tay trong Studio. Vì vậy
    // `image: undefined` cho venue này là kết quả đúng, không phải lỗi cần "sửa"
    // bằng cách nới rộng phạm vi tìm kiếm.
    let imageEl = chunk.find('[data-nectar-img-src]').first()
    if (!imageEl.length) imageEl = $(el).closest('.wpb_row').find('[data-nectar-img-src]').first()

    // "CÁC MÓN ĐẶC TRƯNG" (chỉ có trên NHÀ HÀNG PHÚC VIÊN) là một `<h5>` với
    // các món ngăn bằng `<br>` — KHÔNG PHẢI `<li>` như code cũ giả định (nên
    // `highlights` trước đây LUÔN rỗng cho cả 8 venue, không chỉ thiếu — món
    // ăn vẫn còn nguyên trong nguồn, chỉ là parser đọc sai chỗ). Giá trị thô
    // (`rawValueAfterLabel`, giữ nguyên `\n`) split theo dòng ra từng món.
    // Vẫn giữ nhánh `<li>` làm dự phòng cho venue khác nếu tương lai đổi sang
    // danh sách `<ul>` thật — hiện tại 0 venue nào dùng `<li>` (đã grep xác
    // nhận cả culinary lẫn experiences).
    const highlightsRaw = rawValueAfterLabel(chunk, 'CÁC MÓN ĐẶC TRƯNG')
    const highlights = highlightsRaw
      ? highlightsRaw
          .split('\n')
          .map((s) => s.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
      : chunk
          .find('li')
          .map((_, li) => textOf($(li).html() ?? ''))
          .get()
          .filter(Boolean)

    venues.push({
      kind: 'venue',
      slug: slugify(name),
      name,
      venueKind,
      location: valueAfterLabel(chunk, 'ĐỊA ĐIỂM'),
      capacity: valueAfterLabel(chunk, 'SỨC CHỨA'),
      hours: valueAfterLabel(chunk, 'MỞ CỬA'),
      highlights,
      description: toPortableText(bodyHtml),
      image: toImageRef(realSrc(imageEl), routeDir),
      menuUrl: chunk.find('a[href*="drive.google.com"]').first().attr('href'),
      phone: (textOf(bodyHtml).match(/0\d[\d\s.]{7,}/) ?? [])[0]?.trim(),
      order: index,
    })
  })

  return venues
}
