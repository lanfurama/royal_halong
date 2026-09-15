import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { ROOT, routeToHtmlPath } from '@/scripts/import/paths'
import { parseHome, HOME_ALBUM_SLUG } from '@/scripts/import/parsers/home'

const home = async () => parseHome(await readFile(routeToHtmlPath(''), 'utf-8'), ROOT)

describe('parseHome()', () => {
  it('dựng đủ 8 section theo đúng thứ tự bản gốc', async () => {
    const { page } = await home()
    expect(page.sections.map((s) => s._type)).toEqual([
      'heroSection',
      'richTextSection',
      'richTextSection',
      'galleryCarouselSection',
      'cardGridSection',
      'mapSection',
      'imageTextSection',
      'imageTextSection',
    ])
  })

  // parsePage() tổng quát chỉ bắt được hero + 2 đoạn chữ — đây chính là lý do
  // parser riêng tồn tại. Chốt lại để không ai lặng lẽ quay về dùng parsePage.
  it('giữ nhiều hơn hẳn 3 section mà parser tổng quát bắt được', async () => {
    const { page } = await home()
    expect(page.sections.length).toBeGreaterThan(3)
  })

  it('hero có ảnh nền và link video', async () => {
    const { page } = await home()
    const hero = page.sections[0] as any
    expect(hero.heading).toMatch(/ROYAL HẠ LONG/)
    expect(hero.background?.filePath).toBeTruthy()
    expect(hero.videoUrl).toMatch(/youtu/)
  })

  it('khối 4 thẻ suy ra từ cấu trúc, mỗi thẻ có ảnh và link nội bộ', async () => {
    const { page } = await home()
    const grid = page.sections.find((s) => s._type === 'cardGridSection') as any
    expect(grid.cards).toHaveLength(4)
    for (const card of grid.cards) {
      expect(card.title.trim()).not.toBe('')
      expect(card.image?.filePath).toBeTruthy()
      expect(card.cta?.route).toBeTruthy()
    }
    expect(grid.cards.map((c: any) => c.cta.route)).toEqual([
      'luu-tru-phong-khach-san-villas',
      'royal-international-convention-palace',
      'casino',
      'culinary',
    ])
  })

  // Cảm nhận khách cũng là <h4> trong bản gốc. Hộp của chúng không có link nội
  // bộ, và parser dựa vào ĐÚNG điều đó để loại — nếu loại sai thì khối 4 thẻ
  // sẽ phình thành 8.
  it('không nhầm cảm nhận khách thành thẻ', async () => {
    const { page } = await home()
    const grid = page.sections.find((s) => s._type === 'cardGridSection') as any
    const titles = grid.cards.map((c: any) => c.title)
    expect(titles.some((t: string) => /Good room|Nice stay|Beautiful hotel/i.test(t))).toBe(false)
  })

  it('hai khối cuối là tiệc cưới và ưu đãi, có ảnh + mô tả + nút', async () => {
    const { page } = await home()
    const tail = page.sections.filter((s) => s._type === 'imageTextSection') as any[]
    expect(tail).toHaveLength(2)
    expect(tail.map((s) => s.cta.route)).toEqual(['wedding', 'offers'])
    for (const s of tail) {
      expect(s.image?.filePath).toBeTruthy()
      expect(s.content.length).toBeGreaterThan(0)
    }
  })

  it('album ảnh trang chủ lấy đúng khối mosaic, không lấy ảnh logo/badge', async () => {
    const { album } = await home()
    expect(album.slug).toBe(HOME_ALBUM_SLUG)
    expect(album.images.length).toBeGreaterThanOrEqual(15)
    for (const img of album.images) {
      expect(img.filePath).not.toMatch(/Logo-Royal|bo-cong-thuong/)
    }
  })

  it('mọi ảnh trỏ file có thật dưới wp-content', async () => {
    const { page, album } = await home()
    const paths = [
      ...album.images.map((i) => i.filePath),
      ...page.sections.flatMap((s: any) => [
        s.background?.filePath,
        s.image?.filePath,
        ...((s.cards ?? []).map((c: any) => c.image?.filePath)),
      ]),
    ].filter(Boolean) as string[]
    expect(paths.length).toBeGreaterThan(20)
    for (const p of paths) expect(p).toContain('wp-content/uploads')
  })
})
