import { describe, it, expect } from 'vitest'
import { resolveImageAlt } from '@/components/ui/SanityImage'

// resolveImageAlt() quyết định alt text cho ~150 ảnh import không có field
// `alt` (mọi thứ trừ `galleryAlbum` dùng kiểu `image` trần). Test đúng thứ tự
// ưu tiên là chỗ dễ bị "trông đúng với ca đã thử, rỗng lặng lẽ với ca thật".
describe('resolveImageAlt()', () => {
  it('decorative luôn trả rỗng, kể cả khi ảnh có alt riêng', () => {
    expect(resolveImageAlt({ alt: { vi: 'Sảnh khách sạn', en: 'Hotel lobby' } }, 'vi', { decorative: true })).toBe('')
  })

  it('dùng alt riêng của ảnh khi có (chỉ galleryAlbum)', () => {
    expect(resolveImageAlt({ alt: { vi: 'Sảnh khách sạn', en: 'Hotel lobby' } }, 'en')).toBe('Hotel lobby')
  })

  it('không có alt riêng -> dùng fallbackAlt do nơi gọi truyền (tên phòng, brandName...)', () => {
    expect(resolveImageAlt({}, 'vi', { fallbackAlt: 'Phòng Deluxe Biển' })).toBe('Phòng Deluxe Biển')
    expect(resolveImageAlt(null, 'vi', { fallbackAlt: 'Royal Halong Hotel' })).toBe('Royal Halong Hotel')
  })

  it('không có alt riêng và không có fallback -> rỗng, không tự bịa mô tả chung chung', () => {
    expect(resolveImageAlt({}, 'vi')).toBe('')
    expect(resolveImageAlt(undefined, 'vi')).toBe('')
  })

  it('fallbackAlt bị bỏ qua khi decorative=true', () => {
    expect(resolveImageAlt({}, 'vi', { decorative: true, fallbackAlt: 'Không nên xuất hiện' })).toBe('')
  })
})
