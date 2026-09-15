import { describe, it, expect } from 'vitest'
import { cleanHtml, toPortableText, textOf } from '@/scripts/import/html'

/**
 * PortableTextBlock của Sanity gõ `children` rất lỏng (unknown) vì nó là type
 * chung cho mọi kiểu block. Trong test này ta biết chắc `toPortableText` luôn
 * trả block chữ (`block` type), nên khai một type hẹp chỉ để assert, không
 * đổi type trả về thật của `toPortableText`.
 */
type TestBlock = {
  _type: string
  style?: string
  listItem?: string
  children: { text: string; marks?: string[] }[]
}

describe('cleanHtml()', () => {
  it('bỏ thẻ script và style cùng nội dung', () => {
    const out = cleanHtml('<p>Giữ</p><script>var a=1</script><style>p{color:red}</style>')
    expect(out).toContain('Giữ')
    expect(out).not.toContain('var a=1')
    expect(out).not.toContain('color:red')
  })

  it('bỏ comment HTML', () => {
    expect(cleanHtml('<p>A</p><!-- ghi chú -->')).not.toContain('ghi chú')
  })

  it('mở gói div rỗng của WPBakery nhưng giữ nội dung bên trong', () => {
    const html =
      '<div class="vc_column-inner"><div class="wpb_wrapper"><p>Nội dung</p></div></div>'
    const out = cleanHtml(html)
    expect(textOf(out)).toBe('Nội dung')
    expect(out).not.toContain('wpb_wrapper')
  })

  it('bỏ div trang trí không có chữ', () => {
    const out = cleanHtml('<div class="divider-border"></div><p>X</p>')
    expect(textOf(out)).toBe('X')
  })
})

describe('textOf()', () => {
  it('trả văn bản thuần và gộp khoảng trắng', () => {
    expect(textOf('<p>Phòng   Deluxe</p>\n<p>39 m2</p>')).toBe('Phòng Deluxe 39 m2')
  })

  it('giải mã HTML entity', () => {
    expect(textOf('<p>H&#7897;i ngh&#7883; &amp; Ti&#7879;c c&#432;&#7899;i</p>'))
      .toBe('Hội nghị & Tiệc cưới')
  })
})

describe('toPortableText()', () => {
  it('chuyển đoạn văn thành block kiểu normal', () => {
    const blocks = toPortableText('<p>Phòng Deluxe hướng biển.</p>') as TestBlock[]
    expect(blocks).toHaveLength(1)
    expect(blocks[0]._type).toBe('block')
    expect(blocks[0].style).toBe('normal')
    expect(blocks[0].children[0].text).toBe('Phòng Deluxe hướng biển.')
  })

  it('giữ tiêu đề và danh sách', () => {
    const blocks = toPortableText('<h2>Luật chơi</h2><ul><li>Một</li><li>Hai</li></ul>') as TestBlock[]
    expect(blocks[0].style).toBe('h2')
    expect(blocks[1].listItem).toBe('bullet')
    expect(blocks).toHaveLength(3)
  })

  it('giữ chữ đậm thành decorator strong', () => {
    const blocks = toPortableText('<p>Giá <strong>500.000đ</strong></p>') as TestBlock[]
    const marked = blocks[0].children.find((c) => c.text === '500.000đ')!
    expect(marked.marks).toContain('strong')
  })

  it('trả mảng rỗng khi HTML không có chữ', () => {
    expect(toPortableText('<div class="divider-border"></div>')).toEqual([])
  })

  // Fix 3 — `htmlToBlocks()` mặc định sinh `_key` NGẪU NHIÊN cho mỗi
  // block/span/markDef, nên `out/documents.ndjson` khác nhau ở MỌI lần chạy
  // dù HTML nguồn không đổi — phá cơ chế "xuất NDJSON ra soát trước khi ghi"
  // của spec (không thể diff hai lần chạy để biết cái gì thật sự thay đổi).
  it('tất định: cùng một HTML đầu vào, hai lần gọi cho CÙNG một dãy _key', () => {
    const html =
      '<h2>Luật chơi</h2><p>Đoạn <strong>một</strong>.</p><ul><li>A</li><li>B</li></ul>'
    const a = toPortableText(html)
    const b = toPortableText(html)
    expect(a).toEqual(b)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('_key vẫn duy nhất trong cùng một mảng (không phải hằng số cố định)', () => {
    const blocks = toPortableText('<p>Một</p><p>Hai</p><p>Ba</p>') as Array<{ _key: string }>
    const keys = blocks.map((b) => b._key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
