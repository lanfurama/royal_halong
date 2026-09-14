import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef, realSrc } from './shared'
import type { ParsedVenue } from '../types'

/**
 * h4/h5 không phải tên venue: khối CTA/điều hướng lặp ở cuối mọi trang, cộng
 * các nhãn phụ (ĐỊA ĐIỂM/SỨC CHỨA/MỞ CỬA/CÁC MÓN ĐẶC TRƯNG) nằm trong khối chi
 * tiết của nhà hàng chính trên trang culinary — cũng viết hoa toàn bộ như tên
 * venue thật nên lọt qua heuristic "tên viết hoa" nếu không loại trừ tường minh.
 */
const NOT_A_VENUE = [
  'Tiệc cưới',
  'Chương trình ưu đãi',
  'Lưu trú',
  'Cung Hội Nghị',
  'Địa điểm',
  'Sức chứa',
  'Mở cửa',
  'Các món đặc trưng',
]

/** Chuỗi không chứa chữ cái nào (vd "24/7") chắc chắn không phải tên venue. */
const HAS_LETTER = /[A-Za-zÀ-ỹ]/

export function parseVenues(
  html: string,
  route: string,
  venueKind: 'dining' | 'facility',
): ParsedVenue[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, route, 'index.html'))
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

  // Nhà hàng chính nằm ở h5, các outlet còn lại ở h4.
  $('h4, h5').each((index, el) => {
    const name = textOf($(el).html() ?? '')
    // Tên venue thật dài nhất trên trang thật là "OUTDOOR SWIMMING POOL" (21 ký
    // tự); ngưỡng 35 loại được câu tiêu đề banner đầu trang kiểu "TRẢI NGHIỆM ẨM
    // THỰC ĐA DẠNG TINH TÚY TẠI ROYAL HẠ LONG" (54 ký tự) mà vẫn viết hoa toàn bộ
    // nên lọt qua heuristic nếu chỉ giới hạn 60 như brief ban đầu.
    if (!name || name.length > 35) return
    if (!HAS_LETTER.test(name)) return
    if (NOT_A_VENUE.some((s) => name.toLowerCase().includes(s.toLowerCase()))) return
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
    const bodyHtml = chunk
      .map((_, n) => $.html(n))
      .get()
      .join('')

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

    venues.push({
      kind: 'venue',
      slug: slugify(name),
      name,
      venueKind,
      location: valueAfterLabel(chunk, 'ĐỊA ĐIỂM'),
      capacity: valueAfterLabel(chunk, 'SỨC CHỨA'),
      hours: valueAfterLabel(chunk, 'MỞ CỬA'),
      highlights: chunk
        .find('li')
        .map((_, li) => textOf($(li).html() ?? ''))
        .get()
        .filter(Boolean),
      description: toPortableText(bodyHtml),
      image: toImageRef(realSrc(imageEl), routeDir),
      menuUrl: chunk.find('a[href*="drive.google.com"]').first().attr('href'),
      phone: (textOf(bodyHtml).match(/0\d[\d\s.]{7,}/) ?? [])[0]?.trim(),
      order: index,
    })
  })

  return venues
}
