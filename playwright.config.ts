import { defineConfig, devices } from '@playwright/test'

// Mặc định 3000 (đúng theo task-8-brief.md). Cho phép ghi đè bằng biến môi
// trường PORT — máy phát triển dùng chung có thể đã có tiến trình khác chiếm
// cổng 3000 (gặp thật khi viết bộ test này: một dự án Next.js không liên
// quan đang chạy sẵn trên :3000, và `reuseExistingServer` sẽ vô tình dùng
// nhầm server đó nếu không đổi cổng). CI luôn chạy trong môi trường sạch nên
// không cần đổi.
const PORT = process.env.PORT ?? '3000'
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Chạy trên build production: dev server không phản ánh đúng caching và bundle.
    command: 'pnpm build && pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { PORT },
  },
})
