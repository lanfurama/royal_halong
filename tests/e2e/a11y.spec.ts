import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SAMPLE = ['', 'deluxe', 'casino', 'our-gallery', 'news']

// `components/ui/Reveal.tsx` hiện nội dung dần bằng transition opacity 700ms
// khi cuộn tới (thay cho anime.js bản gốc), và đã tôn trọng
// prefers-reduced-motion sẵn: `reduced` thì hiện ngay, bỏ qua transition. Quét
// axe không giả lập cờ này sẽ có lúc bắt trúng khung hình giữa transition —
// opacity phân số làm chữ `text-gold-text` (#896520, đạt 5.32:1 ở trạng thái
// cuối) tính ra một mã pha trộn với nền trắng có contrast thấp hơn ngưỡng.
// Đây là bắt trúng một khung hình thoáng qua của CHÍNH transition, không phải
// nội dung đứng yên ở trạng thái nào — bật reduced-motion cho context quét là
// cách dùng đúng affordance đã có sẵn trong component, không phải nới lỏng
// rule hay assertion.
test.use({ reducedMotion: 'reduce' })

for (const route of SAMPLE) {
  test(`/vi/${route} không vi phạm WCAG A/AA`, async ({ page }) => {
    await page.goto(`/vi/${route}`)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // In chi tiết để sửa được, không chỉ báo số.
    if (results.violations.length > 0) {
      console.log(JSON.stringify(results.violations, null, 2))
    }
    expect(results.violations).toEqual([])
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

// `navigation.header` từng rỗng trong Sanity lúc test này được viết (xem Plan
// D task-6: đo lại bằng GROQ trực tiếp — `count(header)` nay ra 9, không còn
// 0) -> giờ MobileMenu ĐÃ render nút hamburger (`MobileMenu.tsx`: `if
// (items.length === 0) return null` không còn nhánh trúng). Test bản trước
// khẳng định điều ngược lại (không render gì) đã lỗi thời so với dữ liệu
// sống — sửa lại đúng chiều "có navigation -> có menu, mở/đóng được", gần
// với ý định gốc ở task-8-brief.md hơn. Hành vi bẫy focus/Tab vòng đã test
// đầy đủ với dữ liệu giả lập ở tests/unit/mobile-menu.test.tsx; ở đây chỉ
// xác nhận tích hợp thật trên dữ liệu Sanity thật: render, mở bằng click,
// đóng bằng Escape, trả focus về đúng nút bấm.
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
