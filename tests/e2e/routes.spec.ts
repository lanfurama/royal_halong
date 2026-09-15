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

// Bẫy `public/` đã xảy ra thật, rộng hơn riêng favicon: `middleware.ts` cũ
// chỉ liệt kê tường minh `favicon.ico|robots.txt|sitemap.xml`, MỌI file khác
// trong `public/` (vd. `public/leaflet/marker-icon.png`, thêm ở nhánh này)
// vẫn bị redirect locale (308 -> `/vi/leaflet/marker-icon.png`) rồi 404 — xác
// nhận bằng curl. Test favicon trước chỉ đóng ĐÚNG MỘT instance (favicon có
// test), để ngỏ cả lớp lỗi. Hai phần dưới đây đóng lớp lỗi rộng hơn:
//
// (1) quét MỌI `href`/`src` cùng gốc (same-origin) thật sự có trong DOM của
//     một trang (không chỉ favicon) và fetch từng cái — bắt được asset nào
//     tình cờ bị middleware nuốt mà không cần biết trước tên file.
// (2) fetch trực tiếp hai file Leaflet mới thêm — `LeafletMap.tsx` tự đặt
//     `iconUrl`/`iconRetinaUrl` bằng JS (Leaflet gắn `background-image` cho
//     `<img class="leaflet-marker-icon">` khi marker mount), không phải một
//     `<img src>`/`<link href>` tĩnh nằm sẵn trong HTML — DOM-scan ở (1)
//     không thấy được, và hôm nay chưa có `mapSection` nào trong Sanity nên
//     không trang nào trong danh sách ROUTES thực sự render `<LeafletMap>`.
//     Fetch thẳng theo đúng path mà component khai để không phụ thuộc dữ
//     liệu Sanity có mapSection hay chưa.
test('mọi href/src cùng gốc trong DOM tải được (không bị middleware redirect locale rồi 404)', async ({
  page,
  request,
}) => {
  await page.goto('/vi/casino')

  const sameOriginPaths = await page.evaluate(() => {
    const urls = new Set<string>()
    const collect = (el: Element, attr: string) => {
      const value = el.getAttribute(attr)
      if (!value) return
      try {
        const url = new URL(value, window.location.href)
        if (url.origin === window.location.origin) urls.add(url.pathname + url.search)
      } catch {
        // href/src không parse được (vd. `mailto:`, `tel:`) -> bỏ qua, không
        // phải asset để fetch.
      }
    }
    document.querySelectorAll('img[src]').forEach((el) => collect(el, 'src'))
    document
      .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="stylesheet"], link[rel="preload"]')
      .forEach((el) => collect(el, 'href'))
    document.querySelectorAll('script[src]').forEach((el) => collect(el, 'src'))
    return [...urls]
  })

  expect(sameOriginPaths.length).toBeGreaterThan(0)

  for (const path of sameOriginPaths) {
    const res = await request.get(path)
    expect(res.status(), `${path} -> ${res.status()}`).toBe(200)
  }
})

test('asset Leaflet cục bộ (public/leaflet/*) tải được, không bị middleware redirect locale rồi 404', async ({
  request,
}) => {
  for (const path of ['/leaflet/marker-icon.png', '/leaflet/marker-icon-2x.png']) {
    const res = await request.get(path)
    expect(res.status(), `${path} -> ${res.status()}`).toBe(200)
  }
})

test('trang tin tức liệt kê được bài viết', async ({ page }) => {
  await page.goto('/vi/news')
  // 3 bài trong bản clone gốc. Nếu là 0 -> thiếu postListSection trong Sanity
  // hoặc thiếu component PostListSection.
  await expect(page.locator('article')).not.toHaveCount(0)
})

// Test cũ chỉ kiểm `/vi` — trang RỖNG NHẤT site, 0 link. Đo thật trên toàn bộ
// route: `/vi/offers` có 12 lần xuất hiện "royalhalonghotel.com" (gồm 2
// anchor SỐNG `<a href="http://www.royalhalonghotel.com/">` trong richText
// `page.offers`), `/en/offers` cũng 12, `/vi/privacy-policy` có 4 — nhưng 4
// lần ở privacy-policy là chữ `sales@royalhalonghotel.com` (nội dung hợp lệ,
// không phải link). Test cũ xanh dù cả hai anchor sống đó tồn tại — không hề
// chạm tới `/offers`.
//
// Sửa hai việc:
// 1. Quét MỌI route trong ROUTES, cả hai locale (dùng `request.get()` đọc
//    HTML thô thay vì `page.goto()` từng route — rẻ hơn nhiều lần, không cần
//    render/hydrate để đếm text).
// 2. Phân biệt LIÊN KẾT (rò rỉ thật — `href="...royalhalonghotel.com..."`
//    hoặc `src="...royalhalonghotel.com..."`) với domain xuất hiện dưới dạng
//    CHỮ (email hiển thị dạng text, không phải mailto/anchor — hợp lệ, không
//    assert). Chỉ assert rỗng cho nhóm (1).
//
// Dữ liệu đã sửa qua `scripts/fix-offers-old-domain-links.ts` (gỡ 2 anchor
// sống trong `page.offers`, giữ nguyên chữ) — test này là guard để lớp lỗi
// đó (anchor sống trỏ domain chết) không quay lại, ở BẤT KỲ route nào, không
// chỉ `/offers`.
test('không còn LIÊN KẾT (href/src) trỏ domain gốc royalhalonghotel.com ở bất kỳ route nào — domain dưới dạng chữ (vd. email) vẫn hợp lệ', async ({
  request,
}) => {
  // `mailto:` không phải "liên kết tới website cũ" — nó là địa chỉ email,
  // vẫn hoạt động độc lập với việc web hosting của domain cũ còn sống hay
  // không (khác hạ tầng). Cùng nhóm hợp lệ với domain xuất hiện dưới dạng
  // chữ thường — loại trừ khỏi bẫy rò rỉ, chỉ bắt link http(s)/src thật sự
  // dẫn ra ngoài site.
  const OLD_DOMAIN_LINK = /(?:href|src)\s*=\s*"(?!mailto:)[^"]*royalhalonghotel\.com[^"]*"/gi
  const leaks: string[] = []

  for (const route of ROUTES) {
    for (const lang of ['vi', 'en'] as const) {
      const path = `/${lang}/${route}`
      const res = await request.get(path)
      const html = await res.text()
      const matches = html.match(OLD_DOMAIN_LINK) ?? []
      for (const match of matches) leaks.push(`${path}: ${match}`)
    }
  }

  expect(leaks).toEqual([])
})

test('trang không cuộn ngang ở khổ điện thoại', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vi/casino')
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
  expect(overflows).toBe(false)
})
