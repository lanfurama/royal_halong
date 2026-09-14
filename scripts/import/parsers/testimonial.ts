import * as cheerio from 'cheerio'
import { textOf } from '../html'
import type { ParsedTestimonial } from '../types'

export function parseTestimonials(html: string): ParsedTestimonial[] {
  const $ = cheerio.load(html)
  const items: ParsedTestimonial[] = []

  // Bản gốc để mỗi review trong một khối có dấu ngoặc kép cong và chữ Tripadvisor.
  $('h4').each((index, el) => {
    const heading = textOf($(el).html() ?? '')
    const chunk = $(el).nextUntil('h4')
    const raw = textOf(
      chunk
        .map((_, n) => $.html(n))
        .get()
        .join(''),
    )
    if (!raw.includes('“') || !/tripadvisor/i.test(raw)) return

    const quoteMatch = raw.match(/“([^”]+)”/)
    if (!quoteMatch) return

    // Phần sau dấu đóng ngoặc: "<Tác giả> Tripadvisor"
    const after = raw.slice(raw.indexOf('”') + 1).trim()
    const author = after.replace(/tripadvisor/i, '').trim()

    items.push({
      kind: 'testimonial',
      heading,
      quote: quoteMatch[1].trim(),
      author: author || 'Khách lưu trú',
      source: 'TripAdvisor',
      order: index,
    })
  })

  return items
}
