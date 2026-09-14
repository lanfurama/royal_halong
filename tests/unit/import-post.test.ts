import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parsePost } from '@/scripts/import/parsers/post'
import { routeToHtmlPath } from '@/scripts/import/paths'

const FB_WARNING = 'canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel'
const RIC_Q2 = 'quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh'

describe('parsePost()', () => {
  it('lấy ngày đăng từ JSON-LD của Yoast', async () => {
    const html = await readFile(routeToHtmlPath(FB_WARNING), 'utf-8')
    const post = parsePost(html, FB_WARNING)
    expect(post.publishedAt.startsWith('2025-04-01')).toBe(true)
  })

  it('lấy ngày đúng cho bài quý 2/2023', async () => {
    const html = await readFile(routeToHtmlPath(RIC_Q2), 'utf-8')
    expect(parsePost(html, RIC_Q2).publishedAt.startsWith('2023-07-20')).toBe(true)
  })

  it('lấy tiêu đề không kèm hậu tố tên site', async () => {
    const html = await readFile(routeToHtmlPath(FB_WARNING), 'utf-8')
    const post = parsePost(html, FB_WARNING)
    expect(post.title.length).toBeGreaterThan(10)
    expect(post.title).not.toContain('Royal Halong Hotel -')
  })

  // Bài quý 2/2023 thật chỉ có đúng 3 đoạn văn trong .content-inner (đã xác minh
  // bằng cách đọc trực tiếp file nguồn — không còn <p> nào khác trong post-content).
  // Dùng >=3 thay vì >3 như dự đoán ban đầu trong brief.
  it('có nội dung Portable Text đáng kể', async () => {
    const html = await readFile(routeToHtmlPath(RIC_Q2), 'utf-8')
    const post = parsePost(html, RIC_Q2)
    expect(post.body.length).toBeGreaterThanOrEqual(3)
  })

  it('mặc định xếp vào chuyên mục news', async () => {
    const html = await readFile(routeToHtmlPath(RIC_Q2), 'utf-8')
    expect(parsePost(html, RIC_Q2).category).toBe('news')
  })
})
