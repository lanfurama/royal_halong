import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { toPortableText } from '../html'
import { toImageRef, realSrc } from './shared'
import type { ParsedAlbum, ParsedCard, ParsedCta, ParsedPage, ParsedSection } from '../types'

/** Slug album sinh từ khối ảnh mosaic của trang chủ. */
export const HOME_ALBUM_SLUG = 'trang-chu'

/**
 * Chuẩn hoá khoảng trắng TRƯỚC khi so khớp text.
 *
 * Salient tách tiêu đề qua nhiều thẻ con (`.nectar-split-heading`), nên
 * `.text()` trả về chuỗi có xuống dòng CHEN GIỮA các từ: so khớp
 * `/CẢM NHẬN THIẾT KẾ/` trên text thô trượt hoàn toàn dù mắt người đọc thấy
 * đúng. Đã kiểm chứng bằng cách chạy thật, không suy đoán.
 */
function norm($: CheerioAPI, el: unknown): string {
  return $(el as never)
    .text()
    .replace(/\s+/g, ' ')
    .trim()
}

/** `casino/index.html` -> `casino`; `index.html` -> ``. */
function routeOf(href: string | undefined): string | undefined {
  if (!href) return undefined
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return undefined
  return href.replace(/^\/+/, '').replace(/(?:^|\/)index\.html$/, '').replace(/\/+$/, '')
}

/**
 * Leo lên tổ tiên gần nhất chứa ĐỒNG THỜI một ảnh và một liên kết — đó là
 * "hộp" của một thẻ/khối trong layout WPBakery.
 */
function boxOf($: CheerioAPI, el: cheerio.Cheerio<never>, maxUp = 8) {
  let box = el
  for (let i = 0; i < maxUp; i += 1) {
    box = box.parent() as typeof box
    if (box.length === 0) break
    if (box.find('[data-nectar-img-src], img').length > 0 && box.find('a[href]').length > 0) {
      return box
    }
  }
  return null
}

function ctaFrom($: CheerioAPI, box: cheerio.Cheerio<never>): ParsedCta | undefined {
  const a = box.find('a[href]').first()
  const route = routeOf(a.attr('href'))
  if (route === undefined) return undefined
  const label = norm($, a)
  return { label: label || 'Xem thêm', route }
}

function imageFrom($: CheerioAPI, box: cheerio.Cheerio<never>, baseDir: string) {
  const el = box.find('[data-nectar-img-src], img').first()
  if (el.length === 0) return undefined
  const src = realSrc({ attr: (n: string) => el.attr(n) })
  if (!src) return undefined
  return toImageRef(src, baseDir)
}

function must<T>(value: T | null | undefined, what: string): T {
  // Mất im lặng một khối của trang chủ là đúng lớp lỗi đã lặp lại nhiều lần ở
  // pha import này — cho FAIL ngay lúc parse.
  if (value === null || value === undefined) {
    throw new Error(`parseHome(): không tìm thấy ${what} trong index.html`)
  }
  return value
}

/**
 * Trang chủ có cấu trúc riêng (slider, khối 4 thẻ, cảm nhận khách, bản đồ,
 * tiệc cưới, ưu đãi) mà `parsePage()` tổng quát chỉ bắt được hero + 2 đoạn
 * chữ — 7/10 khối bị mất. Parser riêng này dựng đủ.
 */
export function parseHome(html: string, baseDir: string): { page: ParsedPage; album: ParsedAlbum } {
  const $ = cheerio.load(html)
  const main = $('.container.main-content').first()
  if (main.length === 0) throw new Error('parseHome(): không thấy .container.main-content')

  const sections: ParsedSection[] = []

  // 1. Hero — tiêu đề H2 đầu tiên, ảnh đầu tiên của slider, link video nếu có.
  const heroHeading = must(
    main.find('h2').map((_, e) => norm($, e)).get().find((t) => t !== ''),
    'tiêu đề hero',
  )
  const heroImgEl = $('[data-nectar-img-src]').first()
  const heroSrc = realSrc({ attr: (n: string) => heroImgEl.attr(n) })
  const videoUrl = $('a[href*="youtube.com"], a[href*="youtu.be"]').first().attr('href')
  sections.push({
    _type: 'heroSection',
    heading: heroHeading,
    background: heroSrc ? toImageRef(heroSrc, baseDir) : undefined,
    videoUrl: videoUrl || undefined,
  })

  // 2. Hai đoạn giới thiệu.
  const intro = main
    .find('p')
    .map((_, e) => ({ el: e, text: norm($, e) }))
    .get()
    .filter((p) => p.text.length > 120)
    .slice(0, 2)
  for (const p of intro) {
    sections.push({
      _type: 'richTextSection',
      content: toPortableText($.html(p.el as never) ?? ''),
      tone: 'white',
    })
  }

  // 3. Khối ảnh mosaic + CTA "THƯ VIỆN ẢNH" -> album riêng của trang chủ.
  //    Neo bằng CTA NGOÀI <nav> (trong nav cũng có link tới our-gallery, neo
  //    nhầm vào đó sẽ leo lên tận wrapper toàn trang).
  const galleryCta = $('a[href*="our-gallery"]').filter((_, e) => $(e).parents('nav').length === 0).first()
  const galleryBox = must(
    galleryCta.length > 0 ? galleryCta.parents('.wpb_wrapper').first() : null,
    'khối thư viện ảnh',
  )
  const albumImages = galleryBox
    .find('[data-nectar-img-src]')
    .map((_, e) => {
      const src = realSrc({ attr: (n: string) => $(e).attr(n) })
      return src ? toImageRef(src, baseDir) : null
    })
    .get()
    .filter((x): x is NonNullable<typeof x> => x !== null)
  const album: ParsedAlbum = {
    kind: 'album',
    slug: HOME_ALBUM_SLUG,
    title: norm($, galleryCta) || 'THƯ VIỆN ẢNH',
    images: albumImages,
    order: 0,
  }
  sections.push({
    _type: 'galleryCarouselSection',
    heading: album.title,
    albumSlug: HOME_ALBUM_SLUG,
  })

  // 4. Khối 4 thẻ. Lấy H4 NẰM TRONG CÙNG HÀNG với tiêu đề khối, không chép tay
  //    4 tiêu đề: thêm/bớt thẻ ở bản gốc thì parser tự theo.
  const gridHeadingEl = main
    .find('h2')
    .filter((_, e) => norm($, e) !== heroHeading)
    .first()
  const gridHeading = norm($, gridHeadingEl)
  let gridRow = gridHeadingEl as unknown as cheerio.Cheerio<never>
  for (let i = 0; i < 10; i += 1) {
    gridRow = gridRow.parent() as typeof gridRow
    if (gridRow.length === 0) break
    if (gridRow.find('h4').length >= 4) break
  }
  const cards: ParsedCard[] = []
  gridRow.find('h4').each((_, h4) => {
    const box = boxOf($, $(h4) as unknown as cheerio.Cheerio<never>)
    if (!box) return
    const cta = ctaFrom($, box)
    // Cảm nhận khách cũng là H4 nhưng hộp của chúng không có link nội bộ.
    if (!cta) return
    cards.push({
      title: norm($, h4),
      image: imageFrom($, box, baseDir),
      cta,
    })
  })
  if (cards.length > 0) {
    sections.push({
      _type: 'cardGridSection',
      heading: gridHeading || undefined,
      cards,
      columns: cards.length >= 4 ? 4 : cards.length,
    })
  }

  // 5. Bản đồ.
  sections.push({ _type: 'mapSection', heading: 'TÌM CHÚNG TÔI TRÊN BẢN ĐỒ', zoom: 15 })

  // 6. Hai khối ảnh-chữ cuối (tiệc cưới, ưu đãi): H4 có hộp chứa ảnh + link nội
  //    bộ + đoạn mô tả — chính đoạn mô tả phân biệt chúng với 4 thẻ ở trên.
  const tail: ParsedSection[] = []
  main.find('h4').each((_, h4) => {
    const title = norm($, h4)
    if (cards.some((c) => c.title === title)) return
    const box = boxOf($, $(h4) as unknown as cheerio.Cheerio<never>)
    if (!box) return
    const cta = ctaFrom($, box)
    const desc = box.find('p').map((_, p) => norm($, p)).get().find((t) => t.length > 40)
    const image = imageFrom($, box, baseDir)
    if (!cta || !desc || !image) return
    tail.push({
      _type: 'imageTextSection',
      heading: title,
      content: toPortableText(`<p>${desc}</p>`),
      image,
      imageSide: tail.length % 2 === 0 ? 'left' : 'right',
      tone: tail.length % 2 === 0 ? 'white' : 'cream',
      cta,
    })
  })
  sections.push(...tail)

  return {
    page: { kind: 'page', slug: '', title: heroHeading, sections },
    album,
  }
}
