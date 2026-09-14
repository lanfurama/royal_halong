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

  /** Nhặt giá trị đứng ngay sau một nhãn h5, ví dụ "SỨC CHỨA" -> "250 khách". */
  const valueAfterLabel = (scope: ReturnType<typeof $>, label: string): string | undefined => {
    let found: string | undefined
    scope.find('h5').each((_, el) => {
      if (textOf($(el).html() ?? '').toUpperCase().includes(label.toUpperCase())) {
        const next = $(el).next('h5')
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

    const chunk = $(el).nextUntil('h4')
    const bodyHtml = chunk
      .map((_, n) => $.html(n))
      .get()
      .join('')

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
      image: toImageRef(realSrc(chunk.find('img').first()), routeDir),
      menuUrl: chunk.find('a[href*="drive.google.com"]').first().attr('href'),
      phone: (textOf(bodyHtml).match(/0\d[\d\s.]{7,}/) ?? [])[0]?.trim(),
      order: index,
    })
  })

  return venues
}
