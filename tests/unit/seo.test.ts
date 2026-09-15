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
    expect(meta.robots).toMatchObject({ index: false, follow: false })
  })

  // Fix c9-9: `/en/*` hôm nay là bản sao byte-for-byte của `/vi/*` — `t()`
  // luôn fallback về vi khi field en trống (lib/i18n.ts), nên "bản EN" không
  // có nội dung thật, chỉ có route thật. 24 URL đó bị Google index như một
  // bản tiếng Anh không tồn tại. Tín hiệu rẻ nhất-mà-đúng: field `title`
  // (bắt buộc trên mọi loại document) có bản dịch en THẬT hay không — không
  // qua `t()` (nó sẽ luôn báo "có" vì tự fallback).
  it('noindex (nhưng vẫn follow) bản /en khi document không có title.en riêng — bản sao vi giả làm en', () => {
    const meta = buildMetadata({ doc, lang: 'en', settings, siteUrl: 'https://e.com' })
    expect(meta.robots).toMatchObject({ index: false, follow: true })
  })

  it('KHÔNG noindex bản /en khi document có title.en riêng — nội dung EN thật', () => {
    const bilingualTitle = { ...doc, title: { vi: 'Casino', en: 'Casino Club' } }
    const meta = buildMetadata({ doc: bilingualTitle, lang: 'en', settings, siteUrl: 'https://e.com' })
    expect(meta.robots).toBeUndefined()
  })

  it('KHÔNG bao giờ noindex bản /vi (locale mặc định, nguồn nội dung thật)', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.robots).toBeUndefined()
  })

  it('sinh x-default trỏ về bản vi', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.alternates?.languages?.['x-default']).toBe('https://e.com/vi/casino')
  })

  it('set metadataBase theo siteUrl truyền vào', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.metadataBase?.toString()).toBe('https://e.com/')
  })

  // Fix c9-10: `seo.ogImage` được query nhưng trước đây không chỗ nào tiêu
  // thụ — ảnh chia sẻ mạng xã hội không bao giờ dùng ảnh biên tập viên chọn.
  it('wire seo.ogImage vào openGraph.images khi có', () => {
    const withOgImage = {
      ...doc,
      seo: {
        ...doc.seo,
        ogImage: {
          asset: { _id: 'image-abc-1200x630-jpg', url: 'https://cdn.sanity.io/images/proj/ds/abc-1200x630.jpg' },
        },
      },
    }
    const meta = buildMetadata({ doc: withOgImage, lang: 'vi', settings, siteUrl: 'https://e.com' })
    const images = meta.openGraph?.images as Array<{ url: string }> | undefined
    expect(images?.[0]?.url).toContain('cdn.sanity.io')
  })

  it('không có openGraph.images khi seo.ogImage không có asset', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.openGraph?.images).toBeUndefined()
  })
})
