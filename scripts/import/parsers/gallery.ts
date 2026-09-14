import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { textOf } from '../html'
import { slugify, toImageRef, realSrc } from './shared'
import type { ParsedAlbum, ParsedImageRef } from '../types'

const ROUTE = 'our-gallery'

export function parseGalleryAlbums(html: string): ParsedAlbum[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, ROUTE, 'index.html'))
  const albums: ParsedAlbum[] = []

  $('.wpb_gallery').each((index, el) => {
    // Trên trang thật, không có h5 anh em ngay trước .wpb_gallery (nó nằm
    // trong .wpb_row riêng, con của .wpb_wrapper khác) — nên tiêu đề thật
    // ("KHÁCH SẠN & VILLAS", "LƯU TRÚ"...) nằm ở h4/h5 trong .wpb_row liền
    // trước đó, không phải anh em trực tiếp. Đi lên .wpb_row chứa gallery
    // rồi tìm .wpb_row liền trước để lấy tiêu đề thật của khu vực.
    const row = $(el).closest('.wpb_row')
    const prevRow = row.prevAll('.wpb_row').first()
    const title = textOf(prevRow.find('h4, h5').first().html() ?? '') || `Album ${index + 1}`

    // Flickity nhân bản slide -> khử trùng theo đường dẫn ảnh gốc.
    const seen = new Set<string>()
    const images: ParsedImageRef[] = []
    $(el)
      .find('img')
      .each((_, img) => {
        const ref = toImageRef(realSrc($(img)), routeDir)
        if (!ref || seen.has(ref.filePath)) return
        seen.add(ref.filePath)
        images.push({ ...ref, alt: $(img).attr('alt') || undefined })
      })

    if (images.length === 0) return
    albums.push({ kind: 'album', slug: slugify(title), title, images, order: index })
  })

  return albums
}
