import { describe, it, expect } from 'vitest'
import { stripSizeSuffix } from '@/scripts/import/assets'

describe('stripSizeSuffix()', () => {
  it('bỏ hậu tố kích thước srcset của WordPress', () => {
    expect(stripSizeSuffix('/u/2023/04/bed-300x300.png')).toBe('/u/2023/04/bed.png')
    expect(stripSizeSuffix('/u/2023/04/room-1024x683.jpg')).toBe('/u/2023/04/room.jpg')
    expect(stripSizeSuffix('/u/2023/04/a-150x150.jpeg')).toBe('/u/2023/04/a.jpeg')
  })

  it('giữ nguyên tên file vốn đã là bản gốc', () => {
    expect(stripSizeSuffix('/u/2023/04/bed.png')).toBe('/u/2023/04/bed.png')
    expect(stripSizeSuffix('/u/2023/04/royal-halong.jpg')).toBe('/u/2023/04/royal-halong.jpg')
  })

  it('KHÔNG cắt nhầm tên file có chữ số nhưng không phải hậu tố kích thước', () => {
    expect(stripSizeSuffix('/u/2023/04/buffet-2-9.jpg')).toBe('/u/2023/04/buffet-2-9.jpg')
    expect(stripSizeSuffix('/u/2023/04/quy-2-2023.jpg')).toBe('/u/2023/04/quy-2-2023.jpg')
    expect(stripSizeSuffix('/u/2023/04/img2x3.jpg')).toBe('/u/2023/04/img2x3.jpg')
  })

  it('chỉ cắt ở ngay trước phần mở rộng', () => {
    expect(stripSizeSuffix('/u/a-300x300/b.jpg')).toBe('/u/a-300x300/b.jpg')
  })
})
