import { test, expect } from '@playwright/test'

// Toàn bộ slug hiện có trong Sanity hôm nay (lấy từ `/sitemap.xml` khi viết
// test này — 24 route + trang chủ = 25). Bản gốc trong task-8-brief.md chỉ
// liệt kê 19 route cấp điều hướng chính; danh sách dưới đây rộng hơn để phủ
// cả bài viết (`post`) và phòng (`room`) riêng lẻ — "E2E qua toàn bộ route"
// theo yêu cầu thật của task, không chỉ nhóm trang cấp một.
const ROUTES = [
  '',
  'luu-tru-phong-khach-san-villas',
  'deluxe',
  'premium',
  'villas-deluxe',
  'villas-suite',
  'casino',
  'culinary',
  'experiences',
  'wedding',
  'royal-international-convention-palace',
  'our-gallery',
  'offers',
  'reservation',
  'news',
  'our-announcement',
  'payment-methods',
  'privacy-policy',
  'terms-and-conditions',
  'buffet-mung-dai-le-2-9-hao-khi-viet-nam-tinh-hoa-hoi-tu-chi-tu-500-000vnd-khach',
  'dam-cuoi-co-tich-ben-vinh-di-san-tu-400-000-vnd-khach',
  'series-am-thuc-di-san-bun-be-be',
  'canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel',
  'quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh',
  'thong-cao-bao-chi-dhcd-ctcp-quoc-te-hoang-gia-khoi-sac-cung-du-lich-dia-phuong',
]

for (const route of ROUTES) {
  test(`/vi/${route} render sạch`, async ({ page }) => {
    // `console` + `pageerror` KHÔNG bắt được request thất bại — Playwright chỉ
    // phát `console` khi trang gọi console.*() thật, một request mạng lỗi
    // (404, DNS fail, bị chặn CORS...) không đi qua đó. Đây chính xác là lý do
    // favicon 404 (app/icon.png bị middleware redirect sang /vi/icon.png rồi
    // 404) sống sót qua bộ test này trước đây: `errors` luôn rỗng vì loại lỗi
    // đó chưa từng có cơ hội được thu thập, không phải vì trang thực sự sạch.
    // Thêm `requestfailed` (lỗi tầng mạng: DNS, bị abort, bị chặn) và
    // `response` với status ngoài 2xx/3xx (404, 500...) — hai kênh này mới
    // thực sự phủ được lỗi tải tài nguyên.
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`)
    })
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
    page.on('requestfailed', (request) => {
      errors.push(`requestfailed: ${request.url()} — ${request.failure()?.errorText ?? '?'}`)
    })
    page.on('response', (response) => {
      const status = response.status()
      // Chỉ 2xx và 3xx là hợp lệ — 3xx PHẢI qua (middleware tự redirect
      // locale, đó là hành vi đúng, không phải lỗi). Ngoài khoảng đó (404,
      // 500, CORS-blocked opaque...) mới là request thật sự hỏng.
      if (status < 200 || status >= 400) {
        errors.push(`response: ${response.url()} -> ${status}`)
      }
    })

    const response = await page.goto(`/vi/${route}`)
    expect(response?.status()).toBe(200)

    // Thu thập lỗi không xong ngay lúc `goto()` trả về (`load` chỉ đợi tài
    // nguyên có mặt sẵn trong HTML ban đầu) — hydrate xong, React còn gọi
    // thêm request phía client (SanityLive tới live API, ảnh lazy...). Review
    // đã đo trực tiếp: cùng một lượt tải, không đợi ra 0 lỗi, đợi 3 giây ra 2
    // lỗi — I/O y hệt nhau, chỉ khác thời điểm đọc mảng `errors`. Đợi một
    // khoảng cố định trước khi assert để kết quả không phụ thuộc trang chạy
    // nhanh hay chậm tình cờ tới đâu khi test đọc mảng.
    await page.waitForTimeout(3000)

    // có đúng một h1
    await expect(page.locator('h1')).toHaveCount(1)

    // không ảnh vỡ
    const broken = await page.evaluate(() =>
      [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length,
    )
    expect(broken).toBe(0)

    expect(errors).toEqual([])
  })
}

test('URL không có prefix locale thì redirect sang /vi', async ({ page }) => {
  const response = await page.goto('/casino')
  expect(response?.url()).toContain('/vi/casino')
})

test('trang EN fallback về nội dung tiếng Việt khi EN trống', async ({ page }) => {
  await page.goto('/en/casino')
  await expect(page.locator('h1')).not.toBeEmpty()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

// `page.locator('html')` ở test trên đọc DOM SAU khi hydrate — một cơ chế
// phía client (vd: script sửa `document.documentElement.lang` sau khi tải)
// có thể làm DOM đúng trong khi HTML server trả về vẫn sai, và test đó vẫn
// xanh. Đã xảy ra thật: bản trước dùng `next/script` `beforeInteractive` để
// sửa `lang`, DOM cuối cùng đúng, nhưng response gốc (curl, không chạy JS)
// luôn là `lang="vi"` kể cả `/en/*` — screen reader áp quy tắc phát âm theo
// tài liệu ban đầu, và Google thấy `lang="vi"` cạnh `hreflang="en"` ngược
// nhau. Test này gọi thẳng `request` (không phải `page`) để đọc chuỗi HTML
// thô, y hệt cách kiểm chứng bằng `curl` ở NOTES.
test('<html lang> đúng theo locale ngay trong HTML server trả về, không qua JS', async ({
  request,
}) => {
  const vi = await (await request.get('/vi/casino')).text()
  expect(vi).toMatch(/<html[^>]*\slang="vi"/)

  const en = await (await request.get('/en/casino')).text()
  expect(en).toMatch(/<html[^>]*\slang="en"/)
})

// Bẫy favicon đã xảy ra thật: `app/icon.png` bị `middleware.ts` redirect
// locale (308 -> /vi/icon.png) rồi 404 — xác nhận bằng curl. Nhưng KHÔNG một
// test `page.goto()` + `page.on('response'|'requestfailed')` nào bắt được nó:
// đo trực tiếp bằng cách log toàn bộ response của `/vi/casino` (kể cả sau khi
// đợi 3 giây) — không có request nào tới icon.png/favicon.ico xuất hiện.
// Chromium headless không tự fetch favicon ở tầng trang/CDP Network mà
// Playwright hook vào (favicon tab-icon là fetch nội bộ của tiến trình
// browser, không phải của renderer) — không có UI tab để cần icon, nên dù
// route test có mạnh cỡ nào cũng không thấy được request này. Cách kiểm
// đúng: đọc thẳng href từ chính `<link rel="icon">` mà trang render ra rồi
// tự fetch nó qua `request` — y hệt cách xác minh bằng curl, không phụ thuộc
// hành vi tự chọn của trình duyệt.
test('favicon (href do <link rel="icon"> khai) tải được, không bị middleware redirect locale rồi 404', async ({
  page,
  request,
}) => {
  await page.goto('/vi/casino')
  const href = await page
    .locator('link[rel="icon"], link[rel="shortcut icon"]')
    .first()
    .getAttribute('href')
  expect(href).toBeTruthy()

  const res = await request.get(href!)
  expect(res.status()).toBe(200)
})

test('trang tin tức liệt kê được bài viết', async ({ page }) => {
  await page.goto('/vi/news')
  // 3 bài trong bản clone gốc. Nếu là 0 -> thiếu postListSection trong Sanity
  // hoặc thiếu component PostListSection.
  await expect(page.locator('article')).not.toHaveCount(0)
})

test('không còn tham chiếu tới domain gốc', async ({ page }) => {
  await page.goto('/vi')
  const html = await page.content()
  expect(html).not.toContain('royalhalonghotel.com')
})

test('trang không cuộn ngang ở khổ điện thoại', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vi/casino')
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
  expect(overflows).toBe(false)
})
