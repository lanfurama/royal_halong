import { describe, it, expect } from 'vitest'
import { buildMetadata, absoluteUrl } from '@/lib/seo'

const settings = { brandName: { vi: 'Royal Hạ Long' } }

describe('absoluteUrl()', () => {
  it('ghép với NEXT_PUBLIC_SITE_URL và không tạo dấu / kép', () => {
    expect(absoluteUrl('/vi/casino', 'https://example.com')).toBe('https://example.com/vi/casino')
    expect(absoluteUrl('/vi/casino', 'https://example.com/')).toBe('https://example.com/vi/casino')
  })
})

describe('buildMetadata()', () => {
  const doc = {
    title: { vi: 'Casino' },
    slug: { vi: { current: 'casino' } },
    seo: { metaDescription: { vi: 'Câu lạc bộ quốc tế' } },
  }

  it('dùng metaTitle của SEO khi có, nếu không thì dùng tiêu đề trang', () => {
    expect(buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' }).title)
      .toContain('Casino')

    const withMeta = { ...doc, seo: { ...doc.seo, metaTitle: { vi: 'Casino Hoàng Gia' } } }
    expect(buildMetadata({ doc: withMeta, lang: 'vi', settings, siteUrl: 'https://e.com' }).title)
      .toContain('Casino Hoàng Gia')
  })

  it('sinh canonical trỏ domain mới, KHÔNG trỏ royalhalonghotel.com', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.alternates?.canonical).toBe('https://e.com/vi/casino')
    expect(JSON.stringify(meta)).not.toContain('royalhalonghotel.com')
  })

  it('sinh hreflang cho cả vi và en', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.alternates?.languages?.vi).toBe('https://e.com/vi/casino')
    expect(meta.alternates?.languages?.en).toBe('https://e.com/en/casino')
  })

  it('dùng slug EN riêng cho hreflang khi document có', () => {
    const bilingual = { ...doc, slug: { vi: { current: 'casino' }, en: { current: 'gaming-club' } } }
    const meta = buildMetadata({ doc: bilingual, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.alternates?.languages?.en).toBe('https://e.com/en/gaming-club')
  })

  it('tôn trọng noIndex', () => {
    const hidden = { ...doc, seo: { ...doc.seo, noIndex: true } }
    const meta = buildMetadata({ doc: hidden, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.robots).toMatchObject({ index: false })
  })
})
