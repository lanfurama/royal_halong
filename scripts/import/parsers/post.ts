import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { toImageRef, realSrc } from './shared'
import type { ParsedPost } from '../types'

/** Yoast nhúng một graph JSON-LD; datePublished trong đó đáng tin hơn HTML hiển thị. */
function datePublishedFrom(html: string): string {
  const match = html.match(/"datePublished"\s*:\s*"([^"]+)"/)
  return match ? match[1] : new Date().toISOString()
}

export function parsePost(html: string, slug: string): ParsedPost {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, slug, 'index.html'))

  const title =
    textOf($('h1.entry-title').html() ?? '') ||
    textOf($('.page-header-content h1').html() ?? '') ||
    textOf($('h3').first().html() ?? '') ||
    ($('meta[property="og:title"]').attr('content') ?? '').replace(/\s*-\s*Royal.*$/i, '').trim()

  const bodyHtml =
    $('.post-content .content-inner').html() ??
    $('.entry-content').html() ??
    $('.post-area .content-inner').html() ??
    ''

  // Trang nguồn không có <meta name="description">, chỉ có og:description.
  const excerpt =
    ($('meta[name="description"]').attr('content') ?? '').trim() ||
    ($('meta[property="og:description"]').attr('content') ?? '').trim() ||
    undefined

  return {
    kind: 'post',
    slug,
    title,
    category: 'news',
    publishedAt: datePublishedFrom(html),
    excerpt,
    // `toImageRef()` trả `undefined` cho bất cứ chuỗi nào bắt đầu bằng `http`
    // (ảnh ngoài, không phải file trên đĩa) — nhưng TRƯỚC bản sửa này, `??`
    // được tính TRƯỚC khi lọc đó chạy: nếu og:image là URL tuyệt đối,
    // `?? realSrc(...)` không bao giờ rơi xuống nhánh dự phòng (chuỗi og:image
    // đã là truthy), rồi `toImageRef()` loại chuỗi đó và trả `undefined` — bài
    // viết mất cover image dù `.post-featured-img img` có ảnh thật. Gọi
    // `toImageRef()` trên TỪNG ứng viên rồi mới `??` giữa hai KẾT QUẢ để nhánh
    // dự phòng thật sự được thử khi ứng viên đầu bị loại.
    coverImage:
      toImageRef($('meta[property="og:image"]').attr('content'), routeDir) ??
      toImageRef(realSrc($('.post-featured-img img').first()), routeDir),
    body: toPortableText(bodyHtml),
    author: textOf($('.meta-author a').html() ?? '') || undefined,
  }
}
