import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parsePost } from '@/scripts/import/parsers/post'
import { parseOffers } from '@/scripts/import/parsers/offer'
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

  // Fix 10 — `toImageRef()` trả `undefined` cho chuỗi bắt đầu bằng `http` (ảnh
  // ngoài, không phải file trên đĩa). TRƯỚC bản sửa này, code viết
  // `toImageRef(ogImage ?? realSrc(...))` — `??` được tính TRƯỚC khi lọc đó
  // chạy, nên nếu og:image là URL TUYỆT ĐỐI (trường hợp phổ biến của Yoast),
  // `?? realSrc(...)` không bao giờ rơi xuống nhánh dự phòng (chuỗi og:image
  // đã truthy), rồi `toImageRef()` loại chuỗi đó — bài viết mất cover image dù
  // `.post-featured-img img` có ảnh thật. 3 bài viết thật trong dataset không
  // lộ lỗi này (og:image của chúng tình cờ là đường dẫn TƯƠNG ĐỐI, không phải
  // URL tuyệt đối) — test này dựng HTML tổng hợp có og:image tuyệt đối để bắt
  // đúng nhánh lỗi mà dữ liệu thật không chạm tới.
  it('og:image là URL TUYỆT ĐỐI vẫn rơi xuống .post-featured-img img làm cover image', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://cdn.example.com/abs-image.jpg">
      </head><body>
        <div class="post-featured-img">
          <img src="data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E"
               data-nectar-img-src="../wp-content/uploads/2023/01/local-800x600.jpg">
        </div>
        <div class="post-content"><div class="content-inner"><p>Nội dung.</p></div></div>
      </body></html>`
    const post = parsePost(html, 'bai-tong-hop')
    expect(post.coverImage?.filePath).toBeTruthy()
    expect(post.coverImage?.filePath).toMatch(/wp-content[/\\]uploads[/\\]2023[/\\]01[/\\]local\.jpg$/)
  })
})

// Heading ưu đãi thật nằm trong div .nectar-split-heading — nội dung thật là anh em
// của WRAPPER đó, không phải anh em của chính h4, nên nextUntil('h4') từ chính h4
// luôn rỗng. Test này khoá lại hành vi lấy nội dung, không chỉ tiêu đề/giá.
describe('parseOffers()', () => {
  it('mỗi ưu đãi có nội dung Portable Text không rỗng', async () => {
    const html = await readFile(routeToHtmlPath('offers'), 'utf-8')
    const offers = parseOffers(html)
    expect(offers.length).toBeGreaterThan(0)
    for (const o of offers) {
      expect(o.body.length).toBeGreaterThan(0)
    }
  })

  it('ít nhất một ưu đãi có excerpt không rỗng', async () => {
    const html = await readFile(routeToHtmlPath('offers'), 'utf-8')
    const offers = parseOffers(html)
    expect(offers.some((o) => (o.excerpt?.length ?? 0) > 0)).toBe(true)
  })
})
