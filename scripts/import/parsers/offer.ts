import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef, realSrc, isCrossSellBlock } from './shared'
import type { ParsedOffer } from '../types'

/**
 * "Thông tin liên lạc" là một h4 THẬT trên trang offers — một tiểu mục thông
 * tin liên hệ đặt chỗ nằm NGAY TRONG chunk của offer "BUFFET MỪNG ĐẠI LỄ…",
 * không phải card CTA quảng bá chéo lặp lại ở cuối trang (đo trực tiếp: nằm ở
 * hàng top-level ĐẦU, không phải hàng cuối, và wrapper của nó không có
 * `.nectar-cta`) — `isCrossSellBlock()` không bắt được ca này (đúng, vì nó
 * không PHẢI card quảng bá chéo), nên vẫn cần loại trừ bằng tên tường minh ở
 * đây để nó không trở thành offer giả thứ 4.
 */
const NOT_AN_OFFER = ['Thông tin liên lạc']

export function parseOffers(html: string, route = 'offers'): ParsedOffer[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, route, 'index.html'))
  const main = $('.container.main-content')
  const offers: ParsedOffer[] = []

  $('h4').each((index, el) => {
    const title = textOf($(el).html() ?? '')
    if (!title) return
    if (NOT_AN_OFFER.some((skip) => title.toLowerCase().includes(skip.toLowerCase()))) return
    // Card CTA quảng bá chéo dùng chung ("Tiệc cưới", "Chương trình ưu đãi",
    // "Lưu trú", "Cung Hội Nghị…") — trước đây chặn bằng danh sách chuỗi chữ
    // Việt cứng, đổi câu CTA là né được ngay (đã được reviewer chứng minh
    // trực tiếp: đổi chữ sinh ra document offer giả tên "Ưu đãi đặc biệt").
    // Thay bằng vị từ CẤU TRÚC dùng chung với page.ts/hall.ts/venue.ts.
    if (isCrossSellBlock($, main, el)) return

    // h4 thật bị bọc trong div .nectar-split-heading — bản thân h4 không còn anh em
    // nào (nội dung thật là anh em của WRAPPER, không phải của h4). Nếu heading nằm
    // trong wrapper đó thì duyệt anh em từ wrapper; nếu không thì duyệt từ chính h4
    // (để không vỡ trường hợp markup không bọc, nếu có).
    const container = $(el).parent().hasClass('nectar-split-heading') ? $(el).parent() : $(el)
    const chunk = container.nextUntil('h4, .nectar-split-heading:has(h4)')
    const bodyHtml = chunk
      .map((_, n) => $.html(n))
      .get()
      .join('')

    const priceMatch = title.match(/(?:TỪ|CHỈ TỪ)\s+[\d.,]+\s*(?:VNĐ|VND|đ)[^|]*/i)

    // Ảnh ưu đãi nằm ở cột bên cạnh (layout 2 cột: ảnh | tiêu đề+nội dung), không
    // phải anh em ngay sau h4 — chunk.find('img') sẽ luôn rỗng. Lùi ra .wpb_row
    // chứa cả hai cột để tìm.
    let img = chunk.find('img').first()
    if (!img.length) img = $(el).closest('.wpb_row').find('img').first()

    offers.push({
      kind: 'offer',
      slug: slugify(title),
      title,
      excerpt: textOf(bodyHtml).slice(0, 200) || undefined,
      image: toImageRef(realSrc(img), routeDir),
      body: toPortableText(bodyHtml),
      priceNote: priceMatch ? priceMatch[0].trim() : undefined,
      order: index,
    })
  })

  return offers
}
