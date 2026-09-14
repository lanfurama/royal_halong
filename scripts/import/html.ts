import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'
import { htmlToBlocks } from '@portabletext/block-tools'
import { Schema } from '@sanity/schema'
import type { PortableTextBlock } from 'sanity'

/** Class wrapper của WPBakery / Salient — mở gói, giữ con bên trong. */
const UNWRAP_CLASS = /(^|\s)(vc_|wpb_|nectar-|row_col_wrap|col span_|column_container)/

/** Phần tử thuần trang trí — xoá hẳn. */
const DROP_SELECTOR = [
  'script',
  'style',
  'noscript',
  'svg',
  '.divider-wrap',
  '.divider-border',
  '.clear',
  '.row-bg-wrap',
  '.nectar-shape-divider-wrap',
].join(',')

export function cleanHtml(html: string): string {
  const $ = cheerio.load(html, null, false)

  $(DROP_SELECTOR).remove()
  // `$('*')` không khớp node root của fragment, nên comment nằm ngay ở cấp
  // cao nhất (không lồng trong thẻ nào) sẽ lọt lưới nếu chỉ duyệt `$('*')`.
  // `.addBack()` gộp root vào tập chọn để `.contents()` quét luôn cấp đó.
  $.root()
    .find('*')
    .addBack()
    .contents()
    .filter((_, node) => node.type === 'comment')
    .remove()

  // Mở gói lặp cho tới khi không còn wrapper nào — wrapper lồng wrapper rất sâu.
  let unwrapped = true
  let guard = 0
  while (unwrapped && guard < 20) {
    unwrapped = false
    guard += 1
    $('div, span').each((_, el) => {
      const $el = $(el)
      const cls = $el.attr('class') ?? ''
      if (UNWRAP_CLASS.test(cls)) {
        $el.replaceWith($el.contents())
        unwrapped = true
      }
    })
  }
  // Hết vòng lặp mà vẫn còn wrapper nghĩa là việc mở gói không hội tụ — báo lỗi
  // ngay thay vì âm thầm trả về HTML mở gói dở dang (sẽ hỏng mọi parser sau này).
  if (unwrapped) {
    throw new Error(
      `cleanHtml: mở gói wrapper không hội tụ sau ${guard} vòng lặp — vẫn còn wrapper chưa mở`,
    )
  }

  // Bỏ phần tử rỗng còn sót (không chữ, không ảnh).
  $('div, span, p').each((_, el) => {
    const $el = $(el)
    if ($el.text().trim() === '' && $el.find('img').length === 0) $el.remove()
  })

  return $.html()
}

export function textOf(html: string): string {
  return cheerio.load(html, null, false).text().replace(/\s+/g, ' ').trim()
}

/** Schema block tối thiểu, khớp với localeBlock ở sanity/schemaTypes/objects/localeBlock.ts */
const compiled = Schema.compile({
  name: 'import',
  types: [
    {
      type: 'object',
      name: 'wrapper',
      fields: [
        {
          name: 'content',
          type: 'array',
          of: [
            {
              type: 'block',
              styles: [
                { title: 'Thường', value: 'normal' },
                { title: 'H2', value: 'h2' },
                { title: 'H3', value: 'h3' },
                { title: 'H4', value: 'h4' },
                { title: 'Trích dẫn', value: 'blockquote' },
              ],
              lists: [
                { title: 'Bullet', value: 'bullet' },
                { title: 'Number', value: 'number' },
              ],
              marks: {
                decorators: [
                  { title: 'Đậm', value: 'strong' },
                  { title: 'Nghiêng', value: 'em' },
                ],
                annotations: [
                  {
                    name: 'link',
                    type: 'object',
                    fields: [
                      { name: 'href', type: 'url' },
                      { name: 'blank', type: 'boolean' },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
})

const blockContentType = compiled
  .get('wrapper')
  .fields.find((f: { name: string }) => f.name === 'content')!.type

export function toPortableText(html: string): PortableTextBlock[] {
  const cleaned = cleanHtml(html)
  if (textOf(cleaned) === '') return []
  const blocks = htmlToBlocks(cleaned, blockContentType, {
    parseHtml: (h: string) => new JSDOM(h).window.document,
  })
  return blocks as PortableTextBlock[]
}
