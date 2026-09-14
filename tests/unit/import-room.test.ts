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
