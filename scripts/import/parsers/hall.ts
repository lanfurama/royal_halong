import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef, realSrc, isCrossSellBlock, descriptionChunkHtml } from './shared'
import type { ParsedHall } from '../types'

const ROUTE = 'royal-international-convention-palace'

export function parseHalls(html: string): ParsedHall[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, ROUTE, 'index.html'))
  const main = $('.container.main-content')
  const halls: ParsedHall[] = []

  $('h4').each((index, el) => {
    const name = textOf($(el).html() ?? '')
    if (!name) return
    // Card CTA quảng bá chéo dùng chung ("Lưu trú", "Tiệc cưới", "Chương
    // trình ưu đãi"…) trước đây bị chặn bằng danh sách chuỗi chữ Việt cứng
    // (NOT_A_HALL) — đổi câu CTA (rewording) né được ngay, sinh document hall
    // giả (đã được reviewer chứng minh trực tiếp). Thay bằng vị từ CẤU TRÚC
    // dùng chung với page.ts: card này luôn nằm trong hàng `.wpb_row` cấp cao
    // nhất CUỐI CÙNG của main-content — không phụ thuộc chữ.
    if (isCrossSellBlock($, main, el)) return

    // h5 ngay sau h4 chứa "DIỆN TÍCH: 762 M2 | SỨC CHỨA: 1.000"
    const meta = textOf($(el).next('h5').html() ?? '')
    const areaMatch = meta.match(/DIỆN TÍCH:\s*([\d.,]+)/i)
    const capMatch = meta.match(/SỨC CHỨA:\s*([\d.,]+)/i)

    const chunk = $(el).nextUntil('h4')

    // Ảnh hall là <div class="column-image-bg" data-nectar-img-src="..."> ở cột
    // anh em trong cùng .wpb_row — không phải <img> trong chunk.
    let imageEl = chunk.find('[data-nectar-img-src]').first()
    if (!imageEl.length) imageEl = $(el).closest('.wpb_row').find('[data-nectar-img-src]').first()

    halls.push({
      kind: 'hall',
      slug: slugify(name),
      name,
      areaSqm: areaMatch ? Number(areaMatch[1].replace(/[.,]/g, '')) : undefined,
      capacity: capMatch ? capMatch[1] : undefined,
      // `chunk` thô gồm CẢ ba: h5 metadata (đã bóc riêng thành areaSqm/capacity
      // ở trên — giữ lại sẽ lặp lại y hệt field cấu trúc) + đoạn văn thật + nút
      // CTA `.nectar-cta` ("YÊU CẦU", chữ nút chứ không phải mô tả). Loại cả
      // hai, chỉ giữ đoạn văn thật — đo trực tiếp trên cả 3 hall: sau khi lọc
      // chỉ còn đúng 1 khối, đúng đoạn văn thân trang.
      description: toPortableText(descriptionChunkHtml($, chunk)),
      image: toImageRef(realSrc(imageEl), routeDir),
      order: index,
    })
  })

  return halls
}
