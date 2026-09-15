import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { toImageRef, realSrc, isCrossSellBlock } from './shared'
import type { ParsedRoom, ParsedRoomFeature } from '../types'

const ORDER: Record<string, number> = {
  deluxe: 1,
  premium: 2,
  'villas-suite': 3,
  'villas-deluxe': 4,
}

/** Lấy phần sau dấu hai chấm: "Diện tích: 39 m2" -> "39 m2" */
function afterColon(label: string): string {
  const i = label.indexOf(':')
  return i === -1 ? label.trim() : label.slice(i + 1).trim()
}

export function parseRoom(html: string, slug: string): ParsedRoom {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, slug, 'index.html'))

  const title = textOf($('h3').first().html() ?? '')

  // Tiện nghi: mỗi mục là .iwithtext gồm .iwt-icon img + .iwt-text
  const features: ParsedRoomFeature[] = []
  $('.iwithtext').each((_, el) => {
    const label = textOf($(el).find('.iwt-text').html() ?? '')
    if (!label) return
    features.push({
      label,
      icon: toImageRef(realSrc($(el).find('.iwt-icon img')), routeDir),
    })
  })

  const findFeature = (prefix: string) =>
    features.find((f) => f.label.toLowerCase().startsWith(prefix.toLowerCase()))?.label

  const areaLabel = findFeature('Diện tích')
  const areaMatch = areaLabel?.match(/(\d+(?:[.,]\d+)?)/)

  // Mô tả: đoạn văn thân trang thật, KHÔNG PHẢI `$('.wpb_text_column').slice(0,
  // 2).html()` như bản trước — selector đó có BA lỗi cùng lúc, đo trực tiếp
  // trên cả 4 route phòng:
  //  1. Thiếu `p.vc_custom_heading` — đây MỚI là nơi chứa văn xuôi thật của
  //     phòng (vd "Phòng Deluxe hướng biển tại khách sạn có diện tích 39
  //     m2…" + đoạn bàn làm việc/wifi/TV), giống hệt phát hiện đã áp dụng ở
  //     page.ts (`textSelector`) nhưng CHƯA lan sang parser này.
  //  2. `.slice(0, 2).html()` — cheerio `.html()` LUÔN chỉ trả về phần tử ĐẦU
  //     TIÊN của tập chọn dù `.slice()` giữ 2 phần tử; `.slice(0, 2)` là code
  //     chết.
  //  3. Không giới hạn phạm vi vào `.container.main-content` — trên toàn văn
  //     kiện `.wpb_text_column` xuất hiện 2 lần: câu khẩu hiệu chung của site
  //     ("Chúng tôi mang đến sự trải nghiệm…") và khối công ty ở chân trang.
  //     Không scope nghĩa là một lần đảo DOM có thể đổi document.html()
  //     thành văn bản pháp lý ở footer.
  //
  // Scope vào main-content, RỘNG selector như page.ts, rồi lọc bỏ card CTA
  // quảng bá chéo dùng chung (câu khẩu hiệu + "Tận hưởng tối đa kỳ nghỉ…")
  // bằng CÙNG vị từ cấu trúc `isCrossSellBlock()` — đo trực tiếp: nếu không
  // lọc, khẩu hiệu chung và card quảng bá vẫn lọt vào vì chúng cũng khớp
  // `p.vc_custom_heading`/`.wpb_text_column`, tái tạo đúng lỗi cũ.
  const main = $('.container.main-content')
  const bodyNodes = main
    .find('.wpb_text_column, .nectar-responsive-text, p.vc_custom_heading')
    .toArray()
    .filter((el) => !isCrossSellBlock($, main, el))
  const bodyHtml = bodyNodes.map((el) => $.html(el)).join('')

  const gallery: ParsedRoom['gallery'] = []
  $('.wpb_gallery img, .nectar-flickity img').each((_, el) => {
    const ref = toImageRef(realSrc($(el)), routeDir)
    if (ref) gallery.push(ref)
  })

  // Ảnh đại diện không phải <img> mà là nền của khối #intro (banner đầu trang),
  // gán qua data-nectar-img-src trên .row-bg — không có class .page-header-bg-image
  // như brief dự đoán ban đầu (selector đó không khớp gì trên HTML thật).
  const heroImage =
    toImageRef(realSrc($('#intro .row-bg').first()), routeDir) ??
    toImageRef(realSrc($('.page-header-bg-image img').first()), routeDir) ??
    toImageRef(realSrc($('img').first()), routeDir)

  const capacityLabel = findFeature('Sức chứa')
  const viewLabel = findFeature('Hướng phòng')
  const bedTypeLabel = findFeature('Loại giường')

  return {
    kind: 'room',
    slug,
    title,
    category: slug.startsWith('villas') ? 'villa' : 'hotel',
    areaSqm: areaMatch ? Number(areaMatch[1].replace(',', '.')) : undefined,
    capacity: capacityLabel ? afterColon(capacityLabel) : undefined,
    view: viewLabel ? afterColon(viewLabel) : undefined,
    bedType: bedTypeLabel ? afterColon(bedTypeLabel) : undefined,
    summary: textOf(bodyHtml).slice(0, 300) || undefined,
    description: toPortableText(bodyHtml),
    heroImage,
    gallery,
    features,
    order: ORDER[slug] ?? 99,
  }
}
