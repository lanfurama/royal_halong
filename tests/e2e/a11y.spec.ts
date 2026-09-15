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

// `navigation.header` rỗng trong Sanity hôm nay -> Header không render
// <nav> và MobileMenu không render nút hamburger (`MobileMenu.tsx`: `if
// (items.length === 0) return null`). Test gốc trong task-8-brief.md giả
// định có menu để bấm — chạy trên dữ liệu thật hôm nay nó sẽ fail vì
// `getByRole('button', { name: 'Mở menu' })` không khớp gì cả. Hành vi
// mở/đóng/bẫy focus/Escape của MobileMenu đã được test đầy đủ với dữ liệu
// giả lập ở tests/unit/mobile-menu.test.tsx; ở đây chỉ xác nhận component
// không render gì khi navigation rỗng — đúng yêu cầu "test không được
// assert menu tồn tại" khi dữ liệu chưa có.
test('không có navigation -> không render nút menu mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vi')
  await expect(page.getByRole('button', { name: 'Mở menu' })).toHaveCount(0)
  await expect(page.locator('#mobile-menu')).toHaveCount(0)
})

test('lightbox thư viện ảnh mở và đóng được', async ({ page }) => {
  await page.goto('/vi/our-gallery')
  await page.getByRole('button', { name: /Phóng to ảnh 1/ }).first().click()
  await expect(page.locator('.yarl__container')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.yarl__container')).toBeHidden()
})
