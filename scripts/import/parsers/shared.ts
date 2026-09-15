import type * as cheerio from 'cheerio'
import { resolve } from 'node:path'
import { stripSizeSuffix } from '../assets'
import type { ParsedImageRef } from '../types'

/**
 * Chuyển chuỗi tiếng Việt có dấu thành slug ASCII: bỏ dấu, đổi đ/Đ, hạ chữ
 * thường, thay ký tự không phải chữ/số bằng dấu gạch ngang.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Theme Salient/Nectar lazy-load ảnh: `src` của `<img>` chỉ là placeholder SVG
 * rỗng (`data:image/svg+xml...`), đường dẫn ảnh THẬT nằm ở `data-nectar-img-src`
 * — dùng chung cho cả `<img>` lẫn `<div>` nền (background-image gán bằng JS lúc
 * chạy, không có trong `src`/`style` tĩnh). Luôn ưu tiên attribute này trước.
 */
export function realSrc(el: { attr(name: string): string | undefined }): string | undefined {
  return el.attr('data-nectar-img-src') ?? el.attr('src')
}

/**
 * `src` trong HTML là đường dẫn tương đối kiểu `../wp-content/uploads/...`.
 * Đổi thành đường dẫn tuyệt đối tới ảnh GỐC trên đĩa (khử hậu tố kích thước).
 */
export function toImageRef(
  src: string | undefined,
  routeDir: string,
): ParsedImageRef | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('http')) return undefined
  return { filePath: stripSizeSuffix(resolve(routeDir, src)) }
}

/**
 * Card CTA quảng bá chéo dùng chung, lặp lại GIỐNG HỆT NHAU ở cuối MỌI trang
 * (site này dùng khối này cho "Lưu trú", "Tiệc cưới", "Chương trình ưu đãi",
 * "Cung Hội Nghị Quốc Tế Hoàng Gia Hạ Long"...) — không phải nội dung riêng
 * của trang/entity đang parse. Trước đây bốn parser (page.ts, hall.ts,
 * venue.ts, offer.ts) tự chặn khối này bằng cách so khớp chuỗi chữ Việt cứng
 * (NOT_A_HALL/NOT_A_VENUE/NOT_AN_OFFER) — đổi câu CTA (rewording) là né được
 * ngay, sinh ra document giả (đã được reviewer chứng minh trực tiếp).
 *
 * page.ts đã có lời giải CẤU TRÚC, đo trên toàn bộ 15 route "page": card này
 * luôn nằm trong `.wpb_row` cấp cao nhất CUỐI CÙNG của `.container.main-content`,
 * và bọc trong cùng `.wpb_wrapper` với một `.nectar-cta` — 100% precision/recall.
 * Không có chuỗi chữ nào trong định nghĩa này nên rewording không né được.
 *
 * `el` có thể là chính khối văn bản (page.ts dùng cho richTextSection, room.ts
 * dùng cho mô tả phòng) hoặc heading `h4`/`h5` đứng đầu khối entity (hall.ts,
 * venue.ts, offer.ts) — cả hai cách dùng đều đã đo trực tiếp trên HTML thật,
 * cùng cho kết quả đúng.
 */
export function isCrossSellBlock(
  $: cheerio.CheerioAPI,
  main: cheerio.Cheerio<any>,
  el: any,
): boolean {
  const topLevelRows = main.children('.row').children('.wpb_row').toArray()
  const lastTopLevelRow = topLevelRows[topLevelRows.length - 1]
  if (!lastTopLevelRow || !$.contains(lastTopLevelRow, el)) return false
  const wrapper = $(el).closest('.wpb_wrapper')
  const scope = wrapper.length > 0 ? wrapper : $(el)
  return scope.find('.nectar-cta').length > 0
}

/**
 * Phần tử KHÔNG PHẢI mô tả văn xuôi thật, dùng chung bởi hall.ts và venue.ts:
 * h5 chứa nhãn diện tích/sức chứa (`h5.vc_custom_heading` — đã bóc riêng
 * thành field areaSqm/capacity ở nơi gọi, giữ lại trong mô tả sẽ lặp lại y
 * hệt field cấu trúc); lưới nhãn/giá trị `.nectar-hor-list-item` (địa điểm /
 * sức chứa / mở cửa / món đặc trưng trên venue — đã bóc riêng thành field
 * hoặc highlights); và nút CTA `.nectar-cta` (chữ nút như "YÊU CẦU"/"Xem Menu
 * Ngay.", không phải mô tả).
 *
 * Đo trực tiếp trên royal-international-convention-palace (cả 3 hall) và
 * culinary (NHÀ HÀNG PHÚC VIÊN): sau khi loại, hall chỉ còn đúng đoạn văn thật,
 * venue giữ nguyên toàn bộ đoạn văn + số hotline, mất đúng phần lưới nhãn và
 * nút CTA.
 */
const NON_DESCRIPTION_SELECTOR = 'h5.vc_custom_heading, .nectar-hor-list-item, .nectar-cta'

export function descriptionChunkHtml(
  $: cheerio.CheerioAPI,
  chunk: cheerio.Cheerio<any>,
): string {
  const clone = chunk.clone()
  // Khớp lồng bên trong (lưới `.nectar-list-item` của venue) — `.remove()` cắt
  // khỏi cây DOM nên khi serialize tổ tiên sẽ không còn thấy con này nữa.
  clone.find(NON_DESCRIPTION_SELECTOR).remove()
  // Khớp chính phần tử cấp cao nhất trong `chunk` (h5/CTA là anh em trực tiếp
  // của heading, không phải hậu duệ) — `.remove()` không tự loại chúng khỏi
  // MẢNG `clone` đang giữ, phải lọc bằng `.not()` trước khi serialize.
  return clone
    .not(NON_DESCRIPTION_SELECTOR)
    .map((_, n) => $.html(n))
    .get()
    .join('')
}
