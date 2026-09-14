import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef, realSrc } from './shared'
import type { ParsedHall } from '../types'

const ROUTE = 'royal-international-convention-palace'
const NOT_A_HALL = ['Lưu trú', 'Chương trình ưu đãi', 'Tiệc cưới']

export function parseHalls(html: string): ParsedHall[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, ROUTE, 'index.html'))
  const halls: ParsedHall[] = []

  $('h4').each((index, el) => {
    const name = textOf($(el).html() ?? '')
    if (!name) return
    if (NOT_A_HALL.some((s) => name.toLowerCase().includes(s.toLowerCase()))) return

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
      description: toPortableText(
        chunk
          .map((_, n) => $.html(n))
          .get()
          .join(''),
      ),
      image: toImageRef(realSrc(imageEl), routeDir),
      order: index,
    })
  })

  return halls
}
