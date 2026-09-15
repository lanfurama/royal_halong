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
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    const response = await page.goto(`/vi/${route}`)
    expect(response?.status()).toBe(200)

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
