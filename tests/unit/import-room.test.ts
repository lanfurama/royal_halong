import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parseRoom } from '@/scripts/import/parsers/room'
import { routeToHtmlPath } from '@/scripts/import/paths'
import type { ParsedRoom } from '@/scripts/import/types'

let deluxe: ParsedRoom

beforeAll(async () => {
  const html = await readFile(routeToHtmlPath('deluxe'), 'utf-8')
  deluxe = parseRoom(html, 'deluxe')
})

describe('parseRoom() trên trang deluxe thật', () => {
  it('lấy đúng tên phòng', () => {
    expect(deluxe.title).toBe('PHÒNG DELUXE')
  })

  it('lấy đúng diện tích dạng số', () => {
    expect(deluxe.areaSqm).toBe(39)
  })

  it('lấy đúng sức chứa, hướng phòng, loại giường', () => {
    expect(deluxe.capacity).toContain('2 khách')
    expect(deluxe.view).toContain('Hướng biển')
    expect(deluxe.bedType).toContain('Giường đôi')
  })

  // Đếm trực tiếp trên HTML thật: 3 khối .iwithtext x 5 mục = 15, không phải 16
  // như dự đoán ban đầu trong brief (đã xác minh bằng grep 'class="iwithtext"'
  // trên deluxe/premium/villas-suite/villas-deluxe — cả 4 trang đều ra 15).
  it('lấy đủ 15 tiện nghi', () => {
    expect(deluxe.features).toHaveLength(15)
  })

  it('mỗi tiện nghi có nhãn không rỗng', () => {
    for (const f of deluxe.features) {
      expect(f.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('tiện nghi có icon trỏ tới file ảnh gốc, không phải biến thể 300x300', () => {
    const withIcon = deluxe.features.filter((f) => f.icon)
    expect(withIcon.length).toBeGreaterThan(10)
    for (const f of withIcon) {
      expect(f.icon!.filePath).not.toMatch(/-\d+x\d+\.(png|jpg|jpeg)$/)
    }
  })

  it('phân loại đúng là phòng khách sạn', () => {
    expect(deluxe.category).toBe('hotel')
  })

  it('có mô tả dạng Portable Text không rỗng', () => {
    expect(deluxe.description.length).toBeGreaterThan(0)
    expect(deluxe.description[0]._type).toBe('block')
  })

  // Trước bản sửa này, `description` của CẢ 4 phòng là chuỗi 76 ký tự
  // "Chúng tôi mang đến sự trải nghiệm sang trọng, chất lượng và dịch vụ tốt
  // nhất" — khẩu hiệu chung của site, không phải văn xuôi riêng của từng
  // phòng (selector cũ `$('.wpb_text_column').slice(0, 2).html()` chỉ khớp
  // đúng khối khẩu hiệu này). Chỉ kiểm `length > 0` không bắt được lỗi này vì
  // khẩu hiệu cũng thoả `length > 0`. Hai test dưới đây đòi nội dung THẬT sự
  // riêng của phòng deluxe, và đòi 4 phòng khác nhau — cả hai đều ĐỎ trên bản
  // cũ, XANH sau khi sửa selector.
  const flattenText = (blocks: typeof deluxe.description) =>
    blocks
      .filter((b: any) => b._type === 'block' && Array.isArray(b.children))
      .flatMap((b: any) => b.children.map((c: any) => c.text ?? ''))
      .join(' ')

  it('mô tả deluxe chứa văn xuôi RIÊNG của phòng deluxe, không phải khẩu hiệu chung', () => {
    const text = flattenText(deluxe.description)
    expect(text).toContain('39 m2')
    expect(text).toContain('Vịnh Ha Long')
    expect(text).not.toContain('Chúng tôi mang đến sự trải nghiệm sang trọng')
  })

  it('4 phòng có description KHÁC NHAU — không phải cùng một khẩu hiệu chung', async () => {
    const slugs = ['deluxe', 'premium', 'villas-suite', 'villas-deluxe']
    const texts = await Promise.all(
      slugs.map(async (slug) => {
        const html = await readFile(routeToHtmlPath(slug), 'utf-8')
        return flattenText(parseRoom(html, slug).description)
      }),
    )
    expect(new Set(texts).size).toBe(texts.length)
    for (const text of texts) {
      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toContain('Chúng tôi mang đến sự trải nghiệm sang trọng')
    }
  })

  it('có ảnh đại diện', () => {
    expect(deluxe.heroImage?.filePath).toBeTruthy()
  })
})

describe('parseRoom() phân loại villa', () => {
  it('villas-suite và villas-deluxe là villa', async () => {
    for (const slug of ['villas-suite', 'villas-deluxe']) {
      const html = await readFile(routeToHtmlPath(slug), 'utf-8')
      expect(parseRoom(html, slug).category).toBe('villa')
    }
  })
})
