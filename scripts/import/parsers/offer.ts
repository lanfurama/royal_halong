import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef } from './shared'
import type { ParsedOffer } from '../types'

/** h4 không phải tiêu đề ưu đãi — là khối CTA/điều hướng lặp ở cuối mọi trang. */
const NOT_AN_OFFER = [
  'Thông tin liên lạc',
  'Tiệc cưới',
  'Chương trình ưu đãi',
  'Lưu trú',
  'Cung Hội Nghị',
]

export function parseOffers(html: string, route = 'offers'): ParsedOffer[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, route, 'index.html'))
  const offers: ParsedOffer[] = []

  $('h4').each((index, el) => {
    const title = textOf($(el).html() ?? '')
    if (!title) return
    if (NOT_AN_OFFER.some((skip) => title.toLowerCase().includes(skip.toLowerCase()))) return

    // Nội dung ưu đãi = mọi phần tử anh em cho tới h4 kế tiếp.
    const chunk = $(el).nextUntil('h4')
    const bodyHtml = chunk
      .map((_, n) => $.html(n))
      .get()
      .join('')

    const priceMatch = title.match(/(?:TỪ|CHỈ TỪ)\s+[\d.,]+\s*(?:VNĐ|VND|đ)[^|]*/i)

    offers.push({
      kind: 'offer',
      slug: slugify(title),
      title,
      excerpt: textOf(bodyHtml).slice(0, 200) || undefined,
      image: toImageRef(chunk.find('img').first().attr('src'), routeDir),
      body: toPortableText(bodyHtml),
      priceNote: priceMatch ? priceMatch[0].trim() : undefined,
      order: index,
    })
  })

  return offers
}
