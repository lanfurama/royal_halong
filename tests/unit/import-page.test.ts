import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parsePage } from '@/scripts/import/parsers/page'
import { routeToHtmlPath } from '@/scripts/import/paths'

const read = (r: string) => readFile(routeToHtmlPath(r), 'utf-8')

describe('parsePage()', () => {
  it('trang casino có hero và ít nhất một bảng luật Baccarat', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    expect(page.sections[0]._type).toBe('heroSection')
    const tables = page.sections.filter((s) => s._type === 'tableSection')
    expect(tables.length).toBeGreaterThanOrEqual(1)
  })

  it('bảng Baccarat có hàng tiêu đề và các hàng dữ liệu', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    const table = page.sections.find((s) => s._type === 'tableSection') as any
    expect(table.headers.length).toBeGreaterThan(0)
    expect(table.rows.length).toBeGreaterThan(0)
    // mọi hàng có cùng số ô với hàng tiêu đề
    for (const row of table.rows) {
      expect(row.length).toBe(table.headers.length)
    }
  })

  it('trang reservation có khối widget đặt phòng', async () => {
    const page = await read('reservation').then((h) => parsePage(h, 'reservation'))
    expect(page.sections.some((s) => s._type === 'bookingWidgetSection')).toBe(true)
  })

  it('trang news và our-announcement có khối danh sách bài viết', async () => {
    for (const [slug, category] of [
      ['news', 'news'],
      ['our-announcement', 'announcement'],
    ] as const) {
      const page = await read(slug).then((h) => parsePage(h, slug))
      const list = page.sections.find((sec) => sec._type === 'postListSection') as any
      expect(list, `${slug} phải có postListSection`).toBeTruthy()
      expect(list.category).toBe(category)
    }
  })

  it('trang thường KHÔNG có khối danh sách bài viết', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    expect(page.sections.some((sec) => sec._type === 'postListSection')).toBe(false)
  })

  it('trang chính sách bảo mật có nội dung văn bản dài', async () => {
    const page = await read('privacy-policy').then((h) => parsePage(h, 'privacy-policy'))
    const rich = page.sections.filter((s) => s._type === 'richTextSection') as any[]
    const total = rich.reduce((n, s) => n + s.content.length, 0)
    expect(total).toBeGreaterThan(10)
  })

  it('lấy được tiêu đề trang', async () => {
    const page = await read('wedding').then((h) => parsePage(h, 'wedding'))
    expect(page.title.length).toBeGreaterThan(0)
  })
})

describe('slug giữ nguyên để không mất SEO', () => {
  it('không đổi tên slug gốc', async () => {
    const page = await read('luu-tru-phong-khach-san-villas').then((h) =>
      parsePage(h, 'luu-tru-phong-khach-san-villas'),
    )
    expect(page.slug).toBe('luu-tru-phong-khach-san-villas')
  })
})
