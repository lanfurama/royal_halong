import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// `axe-core` là dependency GIÁN TIẾP (qua `@axe-core/playwright`), không có
// trong `package.json` nên `import type { Result } from 'axe-core'` không
// type-check được. Khai đúng phần hình dạng cần dùng thay vì thêm một
// dependency chỉ để mượn một kiểu.
type ContrastViolation = { id: string; nodes: { failureSummary?: string }[] }

const SAMPLE = ['', 'deluxe', 'casino', 'our-gallery', 'news']

// `components/ui/Reveal.tsx` hiện nội dung dần bằng transition opacity 700ms
// khi cuộn tới, và đã tôn trọng prefers-reduced-motion sẵn: `reduced` thì
// hiện ngay, bỏ qua transition. Quét axe không giả lập cờ này sẽ có lúc bắt
// trúng khung hình giữa transition — opacity phân số làm màu chữ tính ra một
// mã pha trộn với nền có contrast thấp hơn ngưỡng. Đây là bắt trúng một
// khung hình thoáng qua của CHÍNH transition, không phải nội dung đứng yên ở
// trạng thái nào — bật reduced-motion cho context quét là cách dùng đúng
// affordance đã có sẵn trong component, không phải nới lỏng rule.
test.use({ reducedMotion: 'reduce' })

/* ---------------------------------------------------------------------------
   NGOẠI LỆ TƯƠNG PHẢN ĐÃ ĐƯỢC CHỦ DỰ ÁN CHỐT

   Bản redesign (Claude Design — "Royal Ha Long Home v2 Light") dùng vàng
   `#b8892b` làm chữ nhãn nhỏ trên nền kem, và chân trang vàng đậm `#8f6a1c`
   với chữ `#ffe6a3` / `#e8dcbf`. Cả ba cặp đều DƯỚI ngưỡng WCAG AA 4.5:1
   (2.92 / 4.03 / 3.63). Chủ dự án được hỏi thẳng và đã chọn "bám sát design
   100%", chấp nhận trượt chuẩn — xem ghi chú đầu `app/globals.css` và mục
   "Giao diện" trong `CLAUDE.md`.

   Test này KHÔNG bị nới lỏng thành "bỏ qua color-contrast". Nó vẫn đòi:
   - 0 vi phạm cho MỌI rule khác;
   - 0 vi phạm color-contrast cho mọi cặp màu mà foreground KHÔNG nằm trong
     danh sách token đã chốt, hoặc background KHÔNG phải một mặt nền của bản
     thiết kế.

   Vì sao lọc theo TOKEN chứ không theo từng cặp (fg|bg) cụ thể: cùng một
   nhãn vàng có thể rơi trên `#faf6ee`, `#fffdf7` hay `#f3ebdb` tuỳ biên tập
   viên đặt section ở dải nào — liệt kê cặp sẽ làm test đỏ ngẫu nhiên khi nội
   dung đổi chỗ, mà không có lỗi thật nào. Lọc theo token vẫn bắt được đúng
   thứ cần bắt: một màu MỚI bị trượt, hoặc một màu đã chốt bị đặt lên một nền
   ngoài hệ.

   Muốn đưa site về chuẩn AA: đổi `--color-gold-text` sang `--color-gold-deep`
   và các token chữ trên nền vàng đậm sang `--color-cream-hi`, rồi XOÁ hai
   danh sách này — test sẽ tự bắt chỗ nào còn sót.
--------------------------------------------------------------------------- */

/** Màu CHỮ được chấp nhận trượt ngưỡng. Đúng bốn token, không hơn. */
const ACCEPTED_FOREGROUNDS = new Set([
  '#b8892b', // --color-gold / --color-gold-text
  '#ffe6a3', // --color-gold-soft (nhãn cột chân trang)
  '#e8dcbf', // --color-cream-dim (chữ phụ chân trang)
  '#7d6f55', // --color-muted (chữ phụ trên dải kem đậm)
])

/** Các mặt nền của bản thiết kế. Một token chữ đã chốt mà rơi lên nền NGOÀI
 * danh sách này vẫn làm test đỏ — đó là dấu hiệu ai đó ghép màu ngoài hệ. */
const DESIGN_SURFACES = new Set([
  '#faf6ee', // --color-cream (nền trang)
  '#fffdf7', // --color-cream-soft (mặt thẻ, form)
  '#f3ebdb', // --color-cream-alt (dải xen kẽ)
  '#8f6a1c', // --color-gold-deep (chân trang)
])

/** Rút cặp màu ra khỏi `failureSummary` mà axe sinh cho rule color-contrast. */
function contrastPairs(violation: ContrastViolation): string[] {
  return violation.nodes.map((node) => {
    const summary = node.failureSummary ?? ''
    const match = summary.match(/foreground color: (#[0-9a-f]+), background color: (#[0-9a-f]+)/i)
    return match
      ? `${match[1].toLowerCase()}|${match[2].toLowerCase()}`
      : `KHÔNG ĐỌC ĐƯỢC: ${summary}`
  })
}

function isAccepted(pair: string): boolean {
  const [fg, bg] = pair.split('|')
  return ACCEPTED_FOREGROUNDS.has(fg) && DESIGN_SURFACES.has(bg)
}

for (const route of SAMPLE) {
  test(`/vi/${route} không vi phạm WCAG A/AA`, async ({ page }) => {
    await page.goto(`/vi/${route}`)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const contrast = results.violations.filter((v) => v.id === 'color-contrast')
    const others = results.violations.filter((v) => v.id !== 'color-contrast')

    // In chi tiết để sửa được, không chỉ báo số.
    if (others.length > 0) console.log(JSON.stringify(others, null, 2))
    expect(others).toEqual([])

    const unexpected = contrast
      .flatMap(contrastPairs)
      .filter((pair) => !isAccepted(pair))
    expect(
      [...new Set(unexpected)],
      'Cặp màu trượt tương phản NGOÀI danh sách đã chốt — xem ghi chú đầu file',
    ).toEqual([])
  })
}

test('điều hướng bàn phím: skip link đưa tới nội dung chính', async ({ page }) => {
  await page.goto('/vi')
  await page.keyboard.press('Tab')
  const focused = page.locator(':focus')
  await expect(focused).toContainText('Bỏ qua điều hướng')
  await focused.press('Enter')
  await expect(page.locator('#main')).toBeVisible()
})

// Ngưỡng đổi giữa menu ngang và hamburger là `--breakpoint-nav` (1180px, xem
// `app/globals.css`), không còn là `lg` (1024px) như bản trước — 390px vẫn
// nằm dưới ngưỡng nên nút hamburger phải hiện.
test('có navigation -> nút menu mobile mở/đóng được, Escape trả focus về nút bấm', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vi')

  const button = page.getByRole('button', { name: 'Mở menu' })
  await expect(button).toBeVisible()
  await expect(button).toHaveAttribute('aria-expanded', 'false')

  await button.click()
  const panel = page.locator('#mobile-menu')
  await expect(panel).toBeVisible()
  await expect(button).toHaveAttribute('aria-expanded', 'true')

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(button).toBeFocused()
})

test('lightbox thư viện ảnh mở và đóng được', async ({ page }) => {
  await page.goto('/vi/our-gallery')
  await page.getByRole('button', { name: /Phóng to ảnh 1/ }).first().click()
  await expect(page.locator('.yarl__container')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.yarl__container')).toBeHidden()
})

// Bộ chuyển ngôn ngữ chuyển từ dãy link sang dropdown khi site lên 6 ngôn
// ngữ (xem `components/layout/LangSwitcher.tsx`). Hợp đồng cần giữ trên
// trang thật: panel đóng thì link không nằm trong thứ tự Tab; mở ra thì đủ
// sáu ngôn ngữ và bấm được sang bản dịch.
test('bộ chuyển ngôn ngữ: mở được, đủ 6 ngôn ngữ, đi được sang bản dịch', async ({ page }) => {
  await page.goto('/vi')

  const trigger = page.getByRole('button', { name: /Ngôn ngữ/ })
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  for (const label of ['Tiếng Việt', 'English', '中文', '한국어', '日本語', 'ไทย']) {
    await expect(page.getByRole('link', { name: label })).toBeVisible()
  }

  await page.getByRole('link', { name: '日本語' }).click()
  await expect(page).toHaveURL(/\/ja$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
})
