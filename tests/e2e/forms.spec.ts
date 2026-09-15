import { test, expect, type Page } from '@playwright/test'

/**
 * E2E cho form lead (`LeadForm`) và newsletter (`NewsletterForm`).
 *
 * QUAN TRỌNG — chưa có `DATABASE_URL` (Neon chưa được cấp phát, xem
 * `.env.example`): mọi submit hợp lệ đi tới `insertLead`/`db.insert` sẽ ném
 * "Thiếu DATABASE_URL" (`lib/db/index.ts`), `handleLead`/`submitNewsletter`
 * bắt lỗi đó và trả thông báo THẤT BẠI thân thiện cho người dùng — lead
 * KHÔNG được lưu. Vì vậy bộ test này KHÔNG khẳng định "gửi thành công" trừ
 * khi có `DATABASE_URL` (gate bằng `test.skip`), để không đỏ trên máy/CI
 * chưa có Neon. Phần chạy được không cần DB: render đủ field, label liên
 * kết đúng, submit hoạt động khi tắt JS (request thật sự chạm server),
 * validation phía server trả lỗi từng field, honeypot ẩn khỏi người dùng,
 * thông báo lỗi đúng ngôn ngữ trang.
 *
 * Ngân sách rate limit — TÍNH TOÁN CÓ CHỦ Ý, đừng thêm test POST vô tư:
 * `lib/rate-limit.ts` giới hạn 5 request/10 phút cho MỘT `clientKey`, dùng
 * chung cho lead + newsletter, cả Server Action lẫn Route Handler (cùng một
 * Map trong bộ nhớ tiến trình server). Playwright/browser không gửi header
 * `x-forwarded-for` khi gọi localhost nên MỌI request trong file này rơi vào
 * đúng MỘT key `'unknown'`. `playwright.config.ts` chạy 2 project (desktop +
 * mobile) trên CHUNG một `webServer` — không giới hạn theo project thì mỗi
 * test tính request 2 lần. Honeypot bị điền được kiểm tra TRƯỚC rate limit
 * trong `handleLead`/route newsletter nên không tốn hạn mức; những request
 * còn lại (submit hợp lệ/không hợp lệ thật) được gom vào 'desktop' và đếm
 * thủ công để tối đa 5 trong một lần chạy — xem từng `test.skip` bên dưới.
 */

function skipOnMobile(testInfo: { project: { name: string } }) {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Request thật chạm rate limit dùng chung (lib/rate-limit.ts) — chỉ chạy trên 1 project để không tính request 2 lần.',
  )
}

/**
 * Xác nhận field bẫy bot thật sự vô hình với người dùng.
 *
 * Đo thật bằng Playwright: input honeypot (`Field`/`NewsletterForm`) nằm
 * trong luồng bình thường của một div cha `absolute h-0 w-0 overflow-hidden`
 * — CHA có bounding box 0x0 (đúng ý "ẩn"), nhưng CHÍNH input vẫn giữ kích
 * thước tự nhiên của nó (vd. 187x25px) và bị cha cắt phần TRÀN ra ngoài chỉ
 * về mặt HIỂN THỊ (visual clipping), không phải về layout — `getBoundingClientRect()`
 * của input vẫn khác 0. `toBeHidden()` của Playwright chỉ xét bounding box +
 * display/visibility của CHÍNH phần tử được trỏ tới, không xét việc bị cha
 * overflow-hidden cắt — nên gọi trên input sẽ báo "visible" sai. Phải trỏ
 * vào phần tử THẬT SỰ có kích thước 0 (div cha) để khớp đúng cách trình
 * duyệt tính visibility.
 */
async function expectHoneypotHidden(page: Page, inputSelector: string) {
  const input = page.locator(inputSelector)
  const wrapper = input.locator('xpath=ancestor::div[1]')
  await expect(wrapper).toBeHidden()
  await expect(wrapper).toHaveAttribute('aria-hidden', 'true')
  await expect(input).toHaveAttribute('tabindex', '-1')
}

test.describe('LeadForm — render và liên kết label (không tốn rate limit)', () => {
  test('trang tiệc cưới: đủ field, label liên kết đúng id, honeypot ẩn khỏi người dùng', async ({
    page,
  }) => {
    await page.goto('/vi/wedding')

    const form = page.locator('form').filter({ has: page.locator('input[name="type"]') })
    await expect(form).toHaveCount(1)
    await expect(form.locator('input[name="type"]')).toHaveValue('wedding')

    // Mỗi label liên kết đúng bằng `getByLabel` (chỉ khớp khi htmlFor/id đúng
    // cặp) — không phải chỉ có text label nằm gần input trên màn hình.
    //
    // Field bắt buộc (`required`) có thêm `<span aria-hidden="true">*</span>`
    // trong chính `<label>` (xem `components/forms/Field.tsx`). Đo thật bằng
    // Playwright: dù span có `aria-hidden`, khi TÊN TRUY CẬP được tính từ nội
    // dung một `<label for>` (khác với `aria-label`/`aria-labelledby`), bước
    // "accumulate text" trong thuật toán accname KHÔNG loại trừ hậu duệ
    // aria-hidden — `getByLabel('Email', { exact: true })` khớp 0 phần tử,
    // tên thật là `"Email*"`. Không phải lỗi hiển thị (dấu * vẫn đúng ý định
    // là dấu hiệu trực quan bắt buộc, và axe không coi đây là vi phạm) — chỉ
    // là assertion phải khớp đúng tên đã tính, không phải tên "mong đợi".
    await expect(page.getByLabel('Họ và tên')).toHaveAttribute('id', 'field-name')
    await expect(page.getByLabel('Số điện thoại')).toHaveAttribute('id', 'field-phone')
    await expect(page.getByLabel('Email*', { exact: true })).toHaveAttribute('id', 'field-email')
    await expect(page.getByLabel('Ngày dự kiến')).toHaveAttribute('id', 'field-eventDate')
    await expect(page.getByLabel('Số khách')).toHaveAttribute('id', 'field-guestCount')
    await expect(page.getByLabel('Lời nhắn')).toHaveAttribute('id', 'field-message')
    await expect(page.getByRole('button', { name: /Gửi yêu cầu/ })).toBeVisible()

    await expectHoneypotHidden(page, '#field-company')
  })

  test('trang hội nghị MICE: đúng formType, honeypot ẩn', async ({ page }) => {
    await page.goto('/vi/royal-international-convention-palace')

    const form = page.locator('form').filter({ has: page.locator('input[name="type"]') })
    await expect(form).toHaveCount(1)
    await expect(form.locator('input[name="type"]')).toHaveValue('mice')
    await expectHoneypotHidden(page, '#field-company')
  })
})

test.describe('NewsletterForm — chân trang mọi trang (không tốn rate limit)', () => {
  test('hiển thị ở chân trang, label liên kết đúng, honeypot ẩn', async ({ page }) => {
    await page.goto('/vi')

    await expect(page.getByLabel('Email của bạn')).toHaveAttribute('id', 'newsletter-email')
    await expect(page.getByRole('button', { name: /Đăng ký/ })).toBeVisible()

    await expectHoneypotHidden(page, '#newsletter-company')
  })

  test('honeypot bị điền qua API -> trả 200 (không đụng DB, không tốn rate limit)', async ({
    request,
  }) => {
    // Honeypot được kiểm TRƯỚC rate limit trong route.ts, và (khác nhánh hợp
    // lệ) không chạm `lib/db` — nên request này thành công dù CHƯA có
    // DATABASE_URL, đúng như thiết kế "trả thành công giả cho bot".
    const response = await request.post('/api/newsletter', {
      data: { email: 'bot@example.com', locale: 'vi', company: 'Bot Inc' },
    })
    expect(response.status()).toBe(200)
    expect((await response.json()).ok).toBe(true)
  })
})

test.describe('Form liên hệ — hành vi khi tắt JavaScript (request thật tới server)', () => {
  test.use({ javaScriptEnabled: false })

  test('submit hợp lệ KHI CHƯA có DATABASE_URL -> báo lỗi thân thiện, không báo thành công', async ({
    page,
  }, testInfo) => {
    skipOnMobile(testInfo)
    test.skip(
      Boolean(process.env.DATABASE_URL),
      'Test này khẳng định đúng hành vi khi THIẾU DATABASE_URL — xem test song song bên dưới cho trường hợp có Neon.',
    )

    await page.goto('/vi/wedding')
    await page.fill('#field-name', 'Nguyễn Văn A')
    await page.fill('#field-phone', '0904030222')
    await page.fill('#field-email', `test+${Date.now()}@example.com`)
    // `<form action={formAction}>` là Server Action: với JS tắt, đây là POST
    // HTML chuẩn của trình duyệt tới URL trang hiện tại, Next.js chạy action
    // ở server rồi trả lại trang render mới — không có network call nào phía
    // client để giả lập, nút Gửi yêu cầu này chính là request thật.
    await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()

    // `insertLead` ném "Thiếu DATABASE_URL", `handleLead` bắt lỗi đó ở nhánh
    // `catch` quanh `deps.insert` và trả `code: 'failed'` — ĐÚNG như mô tả ở
    // đầu file, không phải lỗi test.
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toHaveText('Không gửi được. Vui lòng thử lại hoặc gọi hotline.')
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('submit hợp lệ KHI ĐÃ có DATABASE_URL -> lưu thành công', async ({ page }, testInfo) => {
    skipOnMobile(testInfo)
    test.skip(!process.env.DATABASE_URL, 'cần Neon — xem DATABASE_URL trong .env.local')

    await page.goto('/vi/wedding')
    await page.fill('#field-name', 'Nguyễn Văn A')
    await page.fill('#field-phone', '0904030222')
    await page.fill('#field-email', `test+${Date.now()}@example.com`)
    await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()

    await expect(page.getByRole('status')).toBeVisible()
  })

  test('email sai định dạng (vi) -> lỗi từng field, đúng tiếng Việt', async ({
    page,
  }, testInfo) => {
    skipOnMobile(testInfo)

    await page.goto('/vi/wedding')
    await page.fill('#field-name', 'A')
    await page.fill('#field-phone', '0904030222')
    await page.fill('#field-email', 'khong-phai-email')
    await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toHaveText('Vui lòng kiểm tra lại thông tin đã nhập.')
    // Lỗi RIÊNG của field email, liên kết bằng aria-describedby, không chỉ
    // câu chung chung trong alert.
    await expect(page.locator('#field-email-error')).toHaveText('Email không hợp lệ')
    await expect(page.locator('#field-email')).toHaveAttribute('aria-invalid', 'true')
  })

  test('email sai định dạng (en) -> lỗi từng field, đúng tiếng Anh', async ({
    page,
  }, testInfo) => {
    skipOnMobile(testInfo)

    // Nội dung trang (tiêu đề, mô tả...) vẫn tiếng Việt vì chưa nhập bản dịch
    // (xem "Việc còn lại" trong task-6-brief.md) — nhưng `lang` là tham số
    // route (`/en/...`), không phải nội dung Sanity, nên LeadForm/LABELS vẫn
    // render đúng tiếng Anh. Đã xác nhận thật bằng curl trước khi viết test
    // này: /en/wedding trả field-name với label "Full name", nút "Send
    // request".
    await page.goto('/en/wedding')
    await page.fill('#field-name', 'A')
    await page.fill('#field-phone', '0904030222')
    await page.fill('#field-email', 'not-an-email')
    await page.getByRole('button', { name: /Send request/ }).click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toHaveText('Please check the information you entered.')
    await expect(page.locator('#field-email-error')).toHaveText('Invalid email address')
  })
})

test.describe('API /api/leads và /api/newsletter (JSON, không qua trình duyệt)', () => {
  test('POST /api/leads: email sai -> 400 kèm lỗi field', async ({ request }, testInfo) => {
    skipOnMobile(testInfo)

    const response = await request.post('/api/leads', {
      data: { type: 'wedding', name: 'A', email: 'sai', phone: '0904030222', locale: 'vi' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.errors.email).toBe('Email không hợp lệ')
  })

  test('POST /api/leads: honeypot bị điền -> 200 (không đụng DB, không tốn rate limit)', async ({
    request,
  }) => {
    const response = await request.post('/api/leads', {
      data: {
        type: 'general',
        name: 'Bot',
        email: 'bot@example.com',
        phone: '0904030222',
        locale: 'vi',
        company: 'Bot Inc',
      },
    })
    expect(response.status()).toBe(200)
    expect((await response.json()).ok).toBe(true)
  })

  test('POST /api/newsletter: lead hợp lệ khi ĐÃ có DATABASE_URL -> 200', async ({
    request,
  }, testInfo) => {
    skipOnMobile(testInfo)
    test.skip(!process.env.DATABASE_URL, 'cần Neon — xem DATABASE_URL trong .env.local')

    const response = await request.post('/api/newsletter', {
      data: { email: `e2e+${Date.now()}@example.com`, locale: 'vi' },
    })
    expect(response.status()).toBe(200)
    expect((await response.json()).ok).toBe(true)
  })
})
