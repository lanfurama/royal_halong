import { describe, it, expect } from 'vitest'
import {
  ALL_ROUTES_QUERY,
  DOC_BY_SLUG_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries'

describe('ALL_ROUTES_QUERY', () => {
  it('gom slug của cả 4 loại document có URL riêng', () => {
    for (const type of ['page', 'room', 'post', 'offer']) {
      expect(ALL_ROUTES_QUERY).toContain(`_type == "${type}"`)
    }
  })

  it('lấy slug cả hai ngôn ngữ', () => {
    expect(ALL_ROUTES_QUERY).toContain('slug.vi.current')
    expect(ALL_ROUTES_QUERY).toContain('slug.en.current')
  })
})

describe('DOC_BY_SLUG_QUERY', () => {
  it('khớp slug theo cả vi và en', () => {
    expect(DOC_BY_SLUG_QUERY).toContain('slug.vi.current == $slug')
    expect(DOC_BY_SLUG_QUERY).toContain('slug.en.current == $slug')
  })

  it('mở tham chiếu album trong galleryCarouselSection', () => {
    expect(DOC_BY_SLUG_QUERY).toContain('_type == "galleryCarouselSection"')
    expect(DOC_BY_SLUG_QUERY).toContain('album->')
  })

  it('resolve bài viết cho postListSection — nếu thiếu thì /news rỗng', () => {
    expect(DOC_BY_SLUG_QUERY).toContain('_type == "postListSection"')
    expect(DOC_BY_SLUG_QUERY).toContain('publishedAt desc')
  })
})

describe('SITE_SETTINGS_QUERY', () => {
  it('đọc singleton theo _id cố định', () => {
    expect(SITE_SETTINGS_QUERY).toContain('_id == "siteSettings"')
  })
})
