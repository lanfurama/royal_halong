import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { routeToHtmlPath } from '@/scripts/import/paths'
import { parseVenues } from '@/scripts/import/parsers/venue'
import { parseHalls } from '@/scripts/import/parsers/hall'
import { parseGalleryAlbums } from '@/scripts/import/parsers/gallery'
import { parseTestimonials } from '@/scripts/import/parsers/testimonial'

const read = (r: string) => readFile(routeToHtmlPath(r), 'utf-8')

describe('parseVenues()', () => {
  it('lấy các điểm ẩm thực từ trang culinary', async () => {
    const venues = parseVenues(await read('culinary'), 'culinary', 'dining')
    const names = venues.map((v) => v.name.toUpperCase())
    expect(names).toContain('PIANO BAR')
    expect(names).toContain('POOL BAR')
    expect(names).toContain('LA TERRASSE')
    expect(venues.every((v) => v.venueKind === 'dining')).toBe(true)
  })

  it('lấy tiện ích từ trang experiences', async () => {
    const venues = parseVenues(await read('experiences'), 'experiences', 'facility')
    const names = venues.map((v) => v.name.toUpperCase())
    expect(names).toContain('FITNESS CENTER')
    expect(names).toContain('RENATA SPA')
    expect(venues.every((v) => v.venueKind === 'facility')).toBe(true)
  })

  // Heuristic "tên viết hoa toàn bộ" trên trang thật còn khớp cả các nhãn phụ như
  // "ĐỊA ĐIỂM"/"SỨC CHỨA"/"MỞ CỬA"/"CÁC MÓN ĐẶC TRƯNG" (nằm trong khối chi tiết
  // của nhà hàng chính) và chuỗi không có chữ cái như "24/7" — đã bổ sung các
  // nhãn này vào NOT_A_VENUE / thêm điều kiện phải chứa chữ cái để loại trừ.
  it('không lẫn các nhãn phụ (ĐỊA ĐIỂM, SỨC CHỨA, MỞ CỬA...) thành venue', async () => {
    const venues = parseVenues(await read('culinary'), 'culinary', 'dining')
    const names = venues.map((v) => v.name.toUpperCase())
    expect(names).not.toContain('ĐỊA ĐIỂM')
    expect(names).not.toContain('SỨC CHỨA')
    expect(names).not.toContain('MỞ CỬA')
    expect(names).not.toContain('CÁC MÓN ĐẶC TRƯNG')
    expect(names).not.toContain('24/7')
  })

  // Tiêu đề banner đầu trang (h5, viết hoa toàn bộ, cũng khớp heuristic) không
  // phải venue — đã hạ ngưỡng độ dài tên để loại các câu dài kiểu banner này.
  it('không lẫn tiêu đề banner đầu trang thành venue', async () => {
    const culinary = parseVenues(await read('culinary'), 'culinary', 'dining')
    const experiences = parseVenues(await read('experiences'), 'experiences', 'facility')
    for (const v of [...culinary, ...experiences]) {
      expect(v.name.length).toBeLessThanOrEqual(35)
    }
  })
})

describe('parseHalls()', () => {
  it('lấy 3 phòng của cung hội nghị với diện tích', async () => {
    const halls = parseHalls(await read('royal-international-convention-palace'))
    expect(halls).toHaveLength(3)
    const halong = halls.find((h) => h.name.toUpperCase().includes('HA LONG'))
    expect(halong?.areaSqm).toBe(762)
  })
})

describe('parseGalleryAlbums()', () => {
  it('lấy 5 album, mỗi album có ảnh và không lẫn ảnh trùng', async () => {
    const albums = parseGalleryAlbums(await read('our-gallery'))
    expect(albums).toHaveLength(5)
    for (const album of albums) {
      expect(album.images.length).toBeGreaterThan(0)
      const paths = album.images.map((i) => i.filePath)
      expect(new Set(paths).size).toBe(paths.length)
    }
  })
})

describe('parseTestimonials()', () => {
  it('lấy 4 cảm nhận từ trang chủ', async () => {
    const items = parseTestimonials(await read(''))
    expect(items).toHaveLength(4)
    expect(items.every((t) => t.quote.length > 20)).toBe(true)
    expect(items.every((t) => t.author.length > 0)).toBe(true)
  })
})
