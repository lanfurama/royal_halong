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

  // NHÀ HÀNG PHÚC VIÊN: heading là h5 bọc trong div .nectar-split-heading — nội
  // dung mô tả thật (3 đoạn văn + CTA) là anh em của WRAPPER đó, không phải anh em
  // của chính h5, nên nextUntil('h4') từ chính heading luôn rỗng.
  it('nhà hàng chính có mô tả không rỗng', async () => {
    const venues = parseVenues(await read('culinary'), 'culinary', 'dining')
    const main = venues.find((v) => v.name.toUpperCase().includes('PHÚC VIÊN'))
    expect(main?.description.length ?? 0).toBeGreaterThan(0)
  })

  // Nhãn ĐỊA ĐIỂM/SỨC CHỨA/MỞ CỬA nằm trong .nectar-list-item (đôi khi là h5, đôi
  // khi là text thường), giá trị đi kèm là .nectar-list-item anh em — không phải
  // "h5 nhãn" rồi ".next('h5')" như code brief giả định.
  it('ít nhất một venue mỗi trang có location hoặc hours', async () => {
    const culinary = parseVenues(await read('culinary'), 'culinary', 'dining')
    const experiences = parseVenues(await read('experiences'), 'experiences', 'facility')
    expect(culinary.some((v) => v.location || v.hours)).toBe(true)
    expect(experiences.some((v) => v.location || v.hours)).toBe(true)
  })

  // Ảnh venue là <div class="column-image-bg" data-nectar-img-src="..."> trong cột
  // anh em của .wpb_row chứa heading — không phải <img> trong chunk.
  it('ít nhất một venue có ảnh trỏ tới file thật, không phải placeholder', async () => {
    const culinary = parseVenues(await read('culinary'), 'culinary', 'dining')
    const withImage = culinary.filter((v) => v.image?.filePath)
    expect(withImage.length).toBeGreaterThan(0)
    for (const v of withImage) {
      expect(v.image!.filePath).not.toMatch(/^data:/)
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

  // Ảnh hall là <div class="column-image-bg" data-nectar-img-src="..."> trong cột
  // anh em cùng .wpb_row, không phải <img> trong chunk.
  it('ít nhất một hall có ảnh trỏ tới file thật, không phải placeholder', async () => {
    const halls = parseHalls(await read('royal-international-convention-palace'))
    const withImage = halls.filter((h) => h.image?.filePath)
    expect(withImage.length).toBeGreaterThan(0)
    for (const h of withImage) {
      expect(h.image!.filePath).not.toMatch(/^data:/)
    }
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
