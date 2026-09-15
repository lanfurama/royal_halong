import { describe, it, expect } from 'vitest'
import { docId, imageValue, localeValue, buildDocuments } from '@/scripts/import/transform'
import type { ParsedDataset } from '@/scripts/import/types'

const emptyDataset: ParsedDataset = {
  rooms: [], posts: [], offers: [], venues: [],
  halls: [], albums: [], testimonials: [], pages: [],
}

describe('docId()', () => {
  it('tất định và an toàn cho Sanity', () => {
    expect(docId('room', 'deluxe')).toBe('room.deluxe')
    expect(docId('room', 'deluxe')).toBe(docId('room', 'deluxe'))
  })

  it('thay ký tự Sanity không cho phép trong _id', () => {
    expect(docId('page', 'a/b')).toBe('page.a-b')
    expect(docId('page', 'a b')).toBe('page.a-b')
  })

  it('slug rỗng (trang chủ) vẫn ra id hợp lệ', () => {
    expect(docId('homePage', '')).toBe('homePage')
  })
})

describe('localeValue()', () => {
  it('bọc giá trị vi và KHÔNG tạo field en', () => {
    expect(localeValue('Xin chào')).toEqual({ vi: 'Xin chào' })
    expect(localeValue('Xin chào')).not.toHaveProperty('en')
  })

  it('trả undefined khi giá trị rỗng', () => {
    expect(localeValue('')).toBeUndefined()
    expect(localeValue(undefined)).toBeUndefined()
  })
})

describe('imageValue()', () => {
  const cache = { '/u/bed.png': 'image-abc123-100x100-png' }

  it('dựng tham chiếu ảnh Sanity từ cache', () => {
    expect(imageValue({ filePath: '/u/bed.png' }, cache)).toEqual({
      _type: 'figure',
      asset: { _type: 'reference', _ref: 'image-abc123-100x100-png' },
    })
  })

  it('trả undefined khi ảnh không có trong cache', () => {
    expect(imageValue({ filePath: '/u/thieu.png' }, cache)).toBeUndefined()
  })

  it('gắn alt khi có', () => {
    const value = imageValue({ filePath: '/u/bed.png', alt: 'Giường đôi' }, cache) as any
    expect(value.alt).toEqual({ vi: 'Giường đôi' })
  })
})

describe('buildDocuments()', () => {
  it('dựng document phòng với _id tất định và field vi', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      rooms: [{
        kind: 'room', slug: 'deluxe', title: 'PHÒNG DELUXE', category: 'hotel',
        areaSqm: 39, capacity: '2 khách', view: 'Hướng biển', bedType: 'Giường đôi',
        description: [], gallery: [], features: [{ label: 'Wifi' }], order: 1,
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc._id).toBe('room.deluxe')
    expect(doc._type).toBe('room')
    expect(doc.title).toEqual({ vi: 'PHÒNG DELUXE' })
    expect(doc.slug.vi.current).toBe('deluxe')
    expect(doc.areaSqm).toBe(39)
    expect(doc.features[0].label).toEqual({ vi: 'Wifi' })
  })

  it('chạy 2 lần cho kết quả y hệt (idempotent)', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      testimonials: [{ kind: 'testimonial', heading: 'Tốt', quote: 'Rất tốt', author: 'A', source: 'TripAdvisor', order: 0 }],
    }
    expect(buildDocuments(dataset, {})).toEqual(buildDocuments(dataset, {}))
  })

  it('giữ nguyên khối danh sách bài viết khi transform', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      pages: [{
        kind: 'page', slug: 'news', title: 'Tin tức',
        sections: [{ _type: 'postListSection', category: 'news', limit: 12 }],
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc.sections[0]._type).toBe('postListSection')
    expect(doc.sections[0].category).toBe('news')
  })

  it('trang có slug rỗng thành homePage chứ không phải page', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      pages: [{ kind: 'page', slug: '', title: 'Trang chủ', sections: [] }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc._type).toBe('homePage')
    expect(doc._id).toBe('homePage')
  })

  it('venue.highlights là mảng localeString có _type, không phải chuỗi trần', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      venues: [{
        kind: 'venue', slug: 'piano-bar', name: 'Piano Bar', venueKind: 'dining',
        highlights: ['Nhạc sống', 'Cocktail'], description: [], order: 0,
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc.kind).toBe('dining')
    expect(doc.highlights[0]).toEqual({ _key: expect.any(String), _type: 'localeString', vi: 'Nhạc sống' })
    expect(doc.background).toBeUndefined()
  })

  it('tableSection.headers/rows.cells mang _type localeString, hàng mang _type row', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      pages: [{
        kind: 'page', slug: 'casino', title: 'Casino',
        sections: [{
          _type: 'tableSection', headers: ['Cửa', 'Tỉ lệ'],
          rows: [['Banker', '1:0.95'], ['Player', '1:1']],
        }],
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    const table = doc.sections[0]
    expect(table.headers[0]).toEqual({ _key: expect.any(String), _type: 'localeString', vi: 'Cửa' })
    expect(table.rows[0]._type).toBe('row')
    expect(table.rows[0].cells[0]).toEqual({ _key: expect.any(String), _type: 'localeString', vi: 'Banker' })
  })

  it('richTextSection dùng field tone, không dùng background', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      pages: [{
        kind: 'page', slug: 'wedding', title: 'Wedding',
        sections: [{ _type: 'richTextSection', content: [], tone: 'cream' }],
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc.sections[0].tone).toBe('cream')
    expect(doc.sections[0]).not.toHaveProperty('background')
  })

  it('galleryCarouselSection tham chiếu tới _id album tất định', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      pages: [{
        kind: 'page', slug: 'our-gallery', title: 'Thư viện ảnh',
        sections: [{ _type: 'galleryCarouselSection', albumSlug: 'khach-san-villas' }],
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc.sections[0].album).toEqual({ _type: 'reference', _ref: 'galleryAlbum.khach-san-villas' })
  })

  it('mỗi document có _type nằm trong 33 loại schema đã định nghĩa', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      rooms: [{
        kind: 'room', slug: 'deluxe', title: 'Deluxe', category: 'hotel',
        description: [], gallery: [], features: [], order: 0,
      }],
      halls: [{ kind: 'hall', slug: 'ha-long', name: 'Hạ Long', description: [], order: 0 }],
      offers: [{ kind: 'offer', slug: 'x', title: 'X', body: [], order: 0 }],
    }
    const docs = buildDocuments(dataset, {}) as any[]
    const allowed = ['room', 'post', 'offer', 'venue', 'hall', 'galleryAlbum', 'testimonial', 'page', 'homePage']
    for (const d of docs) expect(allowed).toContain(d._type)
  })
})
