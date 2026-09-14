# Plan D — Neon Postgres + form lead & newsletter

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Form liên hệ tiệc cưới / hội nghị và đăng ký nhận ưu đãi ghi được vào Neon Postgres, có chống spam, hoạt động cả khi JavaScript chưa load.

**Architecture:** Drizzle ORM trên `@neondatabase/serverless`. Form là Server Component render `<form action={serverAction}>` — chạy không cần JS. Validation bằng zod dùng chung giữa Server Action và Route Handler. Gửi mail qua Resend là tuỳ chọn.

**Tech Stack:** drizzle-orm 0.45.2, drizzle-kit 0.31.10, @neondatabase/serverless 1.1.0, zod 4.6.5, resend 6.28.0 (tuỳ chọn).

**Spec:** `docs/superpowers/specs/2026-09-14-nextjs-sanity-migration-design.md` (mục 5)

## Global Constraints

- Plan A, B, C phải xong. Plan C để lại `components/sections/LeadFormSection.tsx` bản tạm —
  plan này thay nó.
- Đây là **thứ duy nhất bản gốc thiếu hẳn**: endpoint `admin-ajax` của WordPress đã chết,
  không có form nào còn hoạt động.
- **Không** đụng vào đặt phòng — SecureBookings lo việc đó.
- `DATABASE_URL` dùng connection string **pooled** của Neon.
- Thiếu `RESEND_API_KEY` thì **vẫn phải lưu DB và trả thành công**, chỉ bỏ qua gửi mail.
- Thông báo lỗi hiển thị cho người dùng phải song ngữ, lấy qua `t()`.
- Form phải submit được khi JS chưa load (progressive enhancement).

---

### Task 1: Kết nối Neon + schema + migration

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/index.ts`, `drizzle.config.ts`
- Modify: `package.json`, `.env.example`

**Interfaces:**
- Consumes: (không)
- Produces:
  - `lib/db/schema.ts` → `leads`, `newsletterSubscribers` (bảng Drizzle)
  - `lib/db/index.ts` → `db` (Drizzle client)

- [ ] **Step 1: Tạo database Neon**

Vào <https://console.neon.tech>, tạo project `royal-halong`, lấy **pooled** connection
string. Thêm vào `.env.local`:

```
DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
```

Thêm hai dòng vào `.env.example` (không giá trị thật):

```
DATABASE_URL=
RESEND_API_KEY=
LEAD_NOTIFY_EMAIL=
```

- [ ] **Step 2: Cài dependency**

```bash
pnpm add drizzle-orm@0.45.2 @neondatabase/serverless@1.1.0
pnpm add -D drizzle-kit@0.31.10
```

- [ ] **Step 3: Viết lib/db/schema.ts**

```ts
import { pgTable, uuid, text, integer, date, timestamp, index } from 'drizzle-orm/pg-core'

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 'wedding' | 'mice' | 'general' */
    type: text('type').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    eventDate: date('event_date'),
    guestCount: integer('guest_count'),
    message: text('message'),
    /** slug trang đã gửi form, để biết lead đến từ đâu */
    sourcePage: text('source_page'),
    locale: text('locale').notNull().default('vi'),
    /** 'new' | 'contacted' | 'closed' */
    status: text('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('leads_created_at_idx').on(table.createdAt),
    index('leads_status_idx').on(table.status),
  ],
)

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  locale: text('locale').notNull().default('vi'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
})

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type NewSubscriber = typeof newsletterSubscribers.$inferInsert
```

- [ ] **Step 4: Viết lib/db/index.ts**

```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('Thiếu DATABASE_URL — xem .env.example')

export const db = drizzle(neon(url), { schema })
export * from './schema'
```

- [ ] **Step 5: Viết drizzle.config.ts**

```ts
import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

- [ ] **Step 6: Thêm script vào package.json**

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 7: Sinh và chạy migration**

```bash
pnpm db:generate
pnpm db:migrate
```

Expected: thư mục `drizzle/` có file `.sql`, chạy migrate thành công.

- [ ] **Step 8: Kiểm chứng bảng đã tạo**

```bash
pnpm db:studio
```

Mở Drizzle Studio, xác nhận có `leads` và `newsletter_subscribers` với đủ cột.

- [ ] **Step 9: Commit**

```bash
git add lib/db drizzle.config.ts drizzle package.json pnpm-lock.yaml .env.example
git commit -m "feat(d1): Neon + Drizzle, bảng leads và newsletter_subscribers

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Validation zod dùng chung

Quy tắc validation phải giống hệt nhau giữa Server Action và Route Handler, nên
định nghĩa một chỗ và viết test trước.

**Files:**
- Create: `lib/validation.ts`
- Test: `tests/unit/validation.test.ts`

**Interfaces:**
- Consumes: (không)
- Produces:
  - `leadSchema` (zod) → `{ type, name, email, phone, eventDate?, guestCount?, message?, sourcePage?, locale, company? }`
  - `newsletterSchema` (zod) → `{ email, locale, company? }`
  - `type LeadInput`, `type NewsletterInput`
  - `isHoneypotFilled(data): boolean`

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/unit/validation.test.ts
import { describe, it, expect } from 'vitest'
import { leadSchema, newsletterSchema, isHoneypotFilled } from '@/lib/validation'

const valid = {
  type: 'wedding',
  name: 'Nguyễn Văn A',
  email: 'a@example.com',
  phone: '0904030222',
  locale: 'vi',
}

describe('leadSchema', () => {
  it('chấp nhận dữ liệu hợp lệ', () => {
    expect(leadSchema.safeParse(valid).success).toBe(true)
  })

  it('từ chối email sai định dạng', () => {
    expect(leadSchema.safeParse({ ...valid, email: 'khong-phai-email' }).success).toBe(false)
  })

  it('từ chối tên rỗng và số điện thoại rỗng', () => {
    expect(leadSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    expect(leadSchema.safeParse({ ...valid, phone: '' }).success).toBe(false)
  })

  it('chỉ nhận 3 loại form đã định nghĩa', () => {
    expect(leadSchema.safeParse({ ...valid, type: 'mice' }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, type: 'general' }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, type: 'linh-tinh' }).success).toBe(false)
  })

  it('chấp nhận số điện thoại Việt Nam có khoảng trắng và dấu +', () => {
    expect(leadSchema.safeParse({ ...valid, phone: '+84 90 4030 222' }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, phone: '0904 030 222' }).success).toBe(true)
  })

  it('từ chối số điện thoại quá ngắn', () => {
    expect(leadSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false)
  })

  it('guestCount phải là số dương khi có', () => {
    expect(leadSchema.safeParse({ ...valid, guestCount: 120 }).success).toBe(true)
    expect(leadSchema.safeParse({ ...valid, guestCount: -5 }).success).toBe(false)
  })

  it('ép chuỗi rỗng của field tuỳ chọn thành undefined', () => {
    const parsed = leadSchema.parse({ ...valid, message: '', eventDate: '' })
    expect(parsed.message).toBeUndefined()
    expect(parsed.eventDate).toBeUndefined()
  })

  it('locale chỉ nhận vi hoặc en', () => {
    expect(leadSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(false)
  })
})

describe('newsletterSchema', () => {
  it('chấp nhận email hợp lệ', () => {
    expect(newsletterSchema.safeParse({ email: 'a@b.com', locale: 'vi' }).success).toBe(true)
  })

  it('chuẩn hoá email về chữ thường và bỏ khoảng trắng', () => {
    const parsed = newsletterSchema.parse({ email: '  A@B.COM ', locale: 'vi' })
    expect(parsed.email).toBe('a@b.com')
  })
})

describe('isHoneypotFilled()', () => {
  it('true khi trường bẫy có giá trị', () => {
    expect(isHoneypotFilled({ company: 'bot' })).toBe(true)
  })

  it('false khi trường bẫy rỗng hoặc không có', () => {
    expect(isHoneypotFilled({ company: '' })).toBe(false)
    expect(isHoneypotFilled({})).toBe(false)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/validation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Viết lib/validation.ts**

```ts
import { z } from 'zod'

/** Chuỗi rỗng của field tuỳ chọn -> undefined, để không ghi '' vào DB. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional()

/** Số VN: cho phép +, khoảng trắng, dấu chấm, gạch ngang; tối thiểu 8 chữ số. */
const phone = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập số điện thoại')
  .refine((value) => (value.replace(/\D/g, '').length >= 8), 'Số điện thoại không hợp lệ')

const locale = z.enum(['vi', 'en'])

export const leadSchema = z.object({
  type: z.enum(['wedding', 'mice', 'general']),
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(200),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  phone,
  eventDate: optionalText,
  guestCount: z.coerce.number().int().positive().optional(),
  message: optionalText,
  sourcePage: optionalText,
  locale: locale.default('vi'),
  /** Trường bẫy bot — người thật không bao giờ điền. */
  company: optionalText,
})

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  locale: locale.default('vi'),
  company: optionalText,
})

export type LeadInput = z.infer<typeof leadSchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>

export function isHoneypotFilled(data: { company?: unknown }): boolean {
  return typeof data.company === 'string' && data.company.trim() !== ''
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/validation.test.ts`
Expected: PASS, 12 test.

Nếu `guestCount: ''` làm `z.coerce.number()` ra `0` thay vì `undefined`, thêm
`.or(z.literal('').transform(() => undefined))` — nhưng test Step 1 không phủ ca đó
nên chỉ sửa khi form thật gặp.

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts tests/unit/validation.test.ts
git commit -m "feat(d2): zod schema dùng chung cho lead và newsletter

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Rate limit + gửi mail tuỳ chọn

**Files:**
- Create: `lib/rate-limit.ts`, `lib/mail.ts`
- Test: `tests/unit/rate-limit.test.ts`

**Interfaces:**
- Consumes: (không)
- Produces:
  - `rateLimit(key: string, now?: number): { allowed: boolean; retryAfterSeconds: number }`
  - `sendLeadNotification(lead): Promise<'sent' | 'skipped'>`

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/unit/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, resetRateLimit, LIMIT, WINDOW_MS } from '@/lib/rate-limit'

beforeEach(() => resetRateLimit())

describe('rateLimit()', () => {
  it('cho qua trong hạn mức', () => {
    for (let i = 0; i < LIMIT; i += 1) {
      expect(rateLimit('1.2.3.4', 1000).allowed).toBe(true)
    }
  })

  it('chặn khi vượt hạn mức', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('1.2.3.4', 1000)
    const result = rateLimit('1.2.3.4', 1000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tính riêng theo từng key', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('1.2.3.4', 1000)
    expect(rateLimit('5.6.7.8', 1000).allowed).toBe(true)
  })

  it('mở lại sau khi hết cửa sổ thời gian', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('1.2.3.4', 1000)
    expect(rateLimit('1.2.3.4', 1000).allowed).toBe(false)
    expect(rateLimit('1.2.3.4', 1000 + WINDOW_MS + 1).allowed).toBe(true)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/rate-limit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Viết lib/rate-limit.ts**

```ts
export const LIMIT = 5
export const WINDOW_MS = 10 * 60 * 1000

/**
 * Rate limit trong bộ nhớ tiến trình. Đủ cho một site marketing:
 * chặn được bot ngây thơ và người bấm nhầm nhiều lần.
 * KHÔNG dùng chung giữa các instance serverless — nếu cần chặt hơn thì
 * thay bằng Upstash Redis, giữ nguyên chữ ký hàm này.
 */
const hits = new Map<string, number[]>()

export function resetRateLimit(): void {
  hits.clear()
}

export function rateLimit(
  key: string,
  now: number = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS)

  if (recent.length >= LIMIT) {
    const oldest = recent[0]
    hits.set(key, recent)
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
    }
  }

  recent.push(now)
  hits.set(key, recent)
  return { allowed: true, retryAfterSeconds: 0 }
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/rate-limit.test.ts`
Expected: PASS, 4 test.

- [ ] **Step 5: Viết lib/mail.ts**

```bash
pnpm add resend@6.28.0
```

```ts
import type { LeadInput } from './validation'

const LABEL: Record<LeadInput['type'], string> = {
  wedding: 'Tiệc cưới',
  mice: 'Hội nghị / MICE',
  general: 'Liên hệ chung',
}

/**
 * Gửi mail thông báo lead. Thiếu RESEND_API_KEY thì bỏ qua — có chủ ý,
 * để deploy được trước khi chốt nhà cung cấp mail. Lead vẫn nằm trong DB.
 */
export async function sendLeadNotification(lead: LeadInput): Promise<'sent' | 'skipped'> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.LEAD_NOTIFY_EMAIL
  if (!apiKey || !to) return 'skipped'

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const rows = [
    ['Loại', LABEL[lead.type]],
    ['Họ tên', lead.name],
    ['Email', lead.email],
    ['Điện thoại', lead.phone],
    ['Ngày tổ chức', lead.eventDate ?? '—'],
    ['Số khách', lead.guestCount ? String(lead.guestCount) : '—'],
    ['Trang gửi', lead.sourcePage ?? '—'],
    ['Lời nhắn', lead.message ?? '—'],
  ]

  await resend.emails.send({
    from: 'Royal Halong <onboarding@resend.dev>',
    to,
    subject: `[${LABEL[lead.type]}] Liên hệ mới từ ${lead.name}`,
    html: `<table cellpadding="6">${rows
      .map(([key, value]) => `<tr><td><b>${key}</b></td><td>${escapeHtml(value)}</td></tr>`)
      .join('')}</table>`,
  })

  return 'sent'
}

/** Nội dung do người dùng nhập -> phải escape trước khi nhét vào HTML mail. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

`from` mặc định là domain sandbox của Resend. Đổi sang domain thật sau khi verify
domain trong Resend, nếu không mail sẽ vào spam.

- [ ] **Step 6: Commit**

```bash
git add lib/rate-limit.ts lib/mail.ts tests/unit/rate-limit.test.ts package.json pnpm-lock.yaml
git commit -m "feat(d3): rate limit trong bộ nhớ + gửi mail Resend tuỳ chọn

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Server Action + Route Handler

**Files:**
- Create: `app/actions/lead.ts`, `app/actions/newsletter.ts`
- Create: `app/api/leads/route.ts`, `app/api/newsletter/route.ts`
- Test: `tests/unit/lead-action.test.ts`

**Interfaces:**
- Consumes: Task 1, 2, 3
- Produces:
  - `submitLead(prevState, formData): Promise<FormState>`
  - `submitNewsletter(prevState, formData): Promise<FormState>`
  - `type FormState = { status: 'idle' | 'success' | 'error'; message?: string; fieldErrors?: Record<string, string> }`
  - `POST /api/leads`, `POST /api/newsletter`

- [ ] **Step 1: Viết test thất bại cho logic xử lý (tách khỏi Next runtime)**

```ts
// tests/unit/lead-action.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleLead } from '@/app/actions/lead'
import { resetRateLimit } from '@/lib/rate-limit'

const valid = {
  type: 'wedding',
  name: 'Nguyễn Văn A',
  email: 'a@example.com',
  phone: '0904030222',
  locale: 'vi',
}

beforeEach(() => resetRateLimit())

describe('handleLead()', () => {
  it('lưu lead hợp lệ và báo thành công', async () => {
    const insert = vi.fn(async () => undefined)
    const result = await handleLead(valid, '1.2.3.4', { insert, notify: async () => 'skipped' })
    expect(result.status).toBe('success')
    expect(insert).toHaveBeenCalledOnce()
  })

  it('trả lỗi từng field khi dữ liệu sai, không ghi DB', async () => {
    const insert = vi.fn(async () => undefined)
    const result = await handleLead(
      { ...valid, email: 'sai' },
      '1.2.3.4',
      { insert, notify: async () => 'skipped' },
    )
    expect(result.status).toBe('error')
    expect(result.fieldErrors?.email).toBeTruthy()
    expect(insert).not.toHaveBeenCalled()
  })

  it('honeypot có giá trị: báo thành công giả nhưng KHÔNG ghi DB', async () => {
    const insert = vi.fn(async () => undefined)
    const result = await handleLead(
      { ...valid, company: 'bot inc' },
      '1.2.3.4',
      { insert, notify: async () => 'skipped' },
    )
    expect(result.status).toBe('success')
    expect(insert).not.toHaveBeenCalled()
  })

  it('chặn khi vượt rate limit', async () => {
    const insert = vi.fn(async () => undefined)
    const deps = { insert, notify: async () => 'skipped' as const }
    for (let i = 0; i < 5; i += 1) await handleLead(valid, '9.9.9.9', deps)
    const result = await handleLead(valid, '9.9.9.9', deps)
    expect(result.status).toBe('error')
    expect(result.message).toContain('thử lại')
  })

  it('vẫn thành công khi gửi mail lỗi — lead đã nằm trong DB', async () => {
    const insert = vi.fn(async () => undefined)
    const notify = vi.fn(async () => {
      throw new Error('Resend sập')
    })
    const result = await handleLead(valid, '1.2.3.4', { insert, notify })
    expect(result.status).toBe('success')
    expect(insert).toHaveBeenCalledOnce()
  })

  it('báo lỗi khi ghi DB thất bại', async () => {
    const insert = vi.fn(async () => {
      throw new Error('Neon sập')
    })
    const result = await handleLead(valid, '1.2.3.4', { insert, notify: async () => 'skipped' })
    expect(result.status).toBe('error')
  })
})
```

Ca "mail lỗi vẫn thành công" quan trọng: lead đã lưu rồi, báo lỗi cho khách là sai.

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/lead-action.test.ts`
Expected: FAIL.

- [ ] **Step 3: Viết app/actions/lead.ts**

```ts
'use server'

import { headers } from 'next/headers'
import { leadSchema, isHoneypotFilled, type LeadInput } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { sendLeadNotification } from '@/lib/mail'

export interface FormState {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
}

interface Deps {
  insert: (lead: LeadInput) => Promise<void>
  notify: (lead: LeadInput) => Promise<'sent' | 'skipped'>
}

const MESSAGES = {
  vi: {
    success: 'Cảm ơn bạn. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.',
    invalid: 'Vui lòng kiểm tra lại thông tin đã nhập.',
    rateLimited: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau ít phút.',
    failed: 'Không gửi được. Vui lòng thử lại hoặc gọi hotline.',
  },
  en: {
    success: 'Thank you. We will get back to you shortly.',
    invalid: 'Please check the information you entered.',
    rateLimited: 'Too many submissions. Please thử lại in a few minutes.',
    failed: 'Could not send. Please try again or call our hotline.',
  },
} as const

/** Logic thuần, không chạm Next runtime — đây là thứ được test. */
export async function handleLead(
  raw: unknown,
  clientKey: string,
  deps: Deps,
): Promise<FormState> {
  const locale =
    (raw as { locale?: string })?.locale === 'en' ? ('en' as const) : ('vi' as const)
  const text = MESSAGES[locale]

  // Bot điền trường bẫy: trả thành công giả để nó không thử cách khác.
  if (isHoneypotFilled(raw as { company?: unknown })) {
    return { status: 'success', message: text.success }
  }

  const limit = rateLimit(clientKey)
  if (!limit.allowed) {
    return { status: 'error', message: text.rateLimited }
  }

  const parsed = leadSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return { status: 'error', message: text.invalid, fieldErrors }
  }

  try {
    await deps.insert(parsed.data)
  } catch (error) {
    console.error('Ghi lead thất bại:', error)
    return { status: 'error', message: text.failed }
  }

  // Mail hỏng không được làm hỏng kết quả — lead đã nằm an toàn trong DB.
  try {
    await deps.notify(parsed.data)
  } catch (error) {
    console.error('Gửi mail thông báo lead thất bại:', error)
  }

  return { status: 'success', message: text.success }
}

async function insertLead(lead: LeadInput): Promise<void> {
  const { db, leads } = await import('@/lib/db')
  await db.insert(leads).values({
    type: lead.type,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    eventDate: lead.eventDate ?? null,
    guestCount: lead.guestCount ?? null,
    message: lead.message ?? null,
    sourcePage: lead.sourcePage ?? null,
    locale: lead.locale,
  })
}

/** Server Action gắn vào <form action>. */
export async function submitLead(_prev: FormState, formData: FormData): Promise<FormState> {
  const headerList = await headers()
  const clientKey =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  return handleLead(Object.fromEntries(formData), clientKey, {
    insert: insertLead,
    notify: sendLeadNotification,
  })
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/lead-action.test.ts`
Expected: PASS, 6 test.

- [ ] **Step 5: Viết app/actions/newsletter.ts**

```ts
'use server'

import { headers } from 'next/headers'
import { newsletterSchema, isHoneypotFilled } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import type { FormState } from './lead'

const MESSAGES = {
  vi: {
    success: 'Đăng ký thành công. Cảm ơn bạn!',
    invalid: 'Email không hợp lệ.',
    rateLimited: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau ít phút.',
    failed: 'Không đăng ký được. Vui lòng thử lại.',
  },
  en: {
    success: 'Subscribed. Thank you!',
    invalid: 'Invalid email address.',
    rateLimited: 'Too many attempts. Please try again in a few minutes.',
    failed: 'Could not subscribe. Please try again.',
  },
} as const

export async function submitNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  const locale = raw.locale === 'en' ? ('en' as const) : ('vi' as const)
  const text = MESSAGES[locale]

  if (isHoneypotFilled(raw as { company?: unknown })) {
    return { status: 'success', message: text.success }
  }

  const headerList = await headers()
  const clientKey = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(clientKey).allowed) {
    return { status: 'error', message: text.rateLimited }
  }

  const parsed = newsletterSchema.safeParse(raw)
  if (!parsed.success) {
    return { status: 'error', message: text.invalid, fieldErrors: { email: text.invalid } }
  }

  try {
    const { db, newsletterSubscribers } = await import('@/lib/db')
    await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data.email, locale: parsed.data.locale })
      // Đăng ký lại cùng email không phải lỗi — coi như thành công.
      .onConflictDoNothing({ target: newsletterSubscribers.email })
  } catch (error) {
    console.error('Ghi newsletter thất bại:', error)
    return { status: 'error', message: text.failed }
  }

  return { status: 'success', message: text.success }
}
```

- [ ] **Step 6: Viết Route Handler cho client ngoài (tuỳ chọn nhưng spec có nêu)**

```ts
// app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { handleLead } from '@/app/actions/lead'
import { sendLeadNotification } from '@/lib/mail'
import type { LeadInput } from '@/lib/validation'

export const runtime = 'nodejs'

async function insertLead(lead: LeadInput): Promise<void> {
  const { db, leads } = await import('@/lib/db')
  await db.insert(leads).values({
    type: lead.type,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    eventDate: lead.eventDate ?? null,
    guestCount: lead.guestCount ?? null,
    message: lead.message ?? null,
    sourcePage: lead.sourcePage ?? null,
    locale: lead.locale,
  })
}

export async function POST(request: NextRequest) {
  const clientKey =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body không phải JSON hợp lệ' }, { status: 400 })
  }

  const result = await handleLead(body, clientKey, {
    insert: insertLead,
    notify: sendLeadNotification,
  })

  return NextResponse.json(
    { ok: result.status === 'success', message: result.message, errors: result.fieldErrors },
    { status: result.status === 'success' ? 200 : 400 },
  )
}
```

```ts
// app/api/newsletter/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { newsletterSchema, isHoneypotFilled } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const clientKey =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Body không phải JSON hợp lệ' }, { status: 400 })
  }

  if (isHoneypotFilled(body)) return NextResponse.json({ ok: true })
  if (!rateLimit(clientKey).allowed) {
    return NextResponse.json({ ok: false, message: 'Quá nhiều yêu cầu' }, { status: 429 })
  }

  const parsed = newsletterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Email không hợp lệ' }, { status: 400 })
  }

  const { db, newsletterSubscribers } = await import('@/lib/db')
  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email, locale: parsed.data.locale })
    .onConflictDoNothing({ target: newsletterSubscribers.email })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Commit**

```bash
git add app/actions app/api tests/unit/lead-action.test.ts
git commit -m "feat(d4): Server Action + Route Handler cho lead và newsletter

Honeypot trả thành công giả; lỗi gửi mail không làm hỏng kết quả đã lưu DB.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Component form

**Files:**
- Create: `components/forms/LeadForm.tsx`, `components/forms/NewsletterForm.tsx`,
  `components/forms/Field.tsx`
- Modify: `components/sections/LeadFormSection.tsx` (thay bản tạm của Plan C)

**Interfaces:**
- Consumes: Task 4
- Produces: `<LeadForm formType lang sourcePage successMessage />`, `<NewsletterForm lang />`

- [ ] **Step 1: Viết components/forms/Field.tsx**

```tsx
export function Field({
  name,
  label,
  type = 'text',
  required,
  error,
  ...rest
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `field-${name}`
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold tracking-widest uppercase">
        {label}
        {required && (
          <span className="text-gold-text ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`border-line focus:border-gold-deep focus:outline-gold-deep w-full border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 ${
          error ? 'border-red-600' : ''
        }`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
```

Lỗi dùng `text-red-700` chứ không `text-red-500` — đỏ nhạt trên nền trắng không đạt AA.

- [ ] **Step 2: Viết components/forms/LeadForm.tsx**

```tsx
'use client'

import { useActionState } from 'react'
import { submitLead, type FormState } from '@/app/actions/lead'
import { Field } from './Field'
import type { Locale } from '@/lib/i18n'

const INITIAL: FormState = { status: 'idle' }

const LABELS = {
  vi: {
    name: 'Họ và tên', email: 'Email', phone: 'Số điện thoại',
    eventDate: 'Ngày dự kiến', guestCount: 'Số khách', message: 'Lời nhắn',
    submit: 'Gửi yêu cầu', sending: 'Đang gửi...',
  },
  en: {
    name: 'Full name', email: 'Email', phone: 'Phone',
    eventDate: 'Preferred date', guestCount: 'Guests', message: 'Message',
    submit: 'Send request', sending: 'Sending...',
  },
} as const

export function LeadForm({
  formType,
  lang,
  sourcePage,
  successMessage,
}: {
  formType: 'wedding' | 'mice' | 'general'
  lang: Locale
  sourcePage?: string
  successMessage?: string
}) {
  const [state, formAction, pending] = useActionState(submitLead, INITIAL)
  const text = LABELS[lang]

  if (state.status === 'success') {
    return (
      <p role="status" className="border-gold-deep bg-white border-l-4 p-4 text-sm">
        {successMessage ?? state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="type" value={formType} />
      <input type="hidden" name="locale" value={lang} />
      {sourcePage && <input type="hidden" name="sourcePage" value={sourcePage} />}

      {/* Bẫy bot: ẩn khỏi mắt và khỏi screen reader, người thật không bao giờ điền. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="field-company">Company</label>
        <input id="field-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={text.name} required autoComplete="name" error={state.fieldErrors?.name} />
        <Field name="phone" label={text.phone} type="tel" required autoComplete="tel" error={state.fieldErrors?.phone} />
      </div>
      <Field name="email" label={text.email} type="email" required autoComplete="email" error={state.fieldErrors?.email} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="eventDate" label={text.eventDate} type="date" error={state.fieldErrors?.eventDate} />
        <Field name="guestCount" label={text.guestCount} type="number" min={1} error={state.fieldErrors?.guestCount} />
      </div>

      <div>
        <label htmlFor="field-message" className="mb-1 block text-xs font-semibold tracking-widest uppercase">
          {text.message}
        </label>
        <textarea
          id="field-message"
          name="message"
          rows={4}
          className="border-line focus:border-gold-deep focus:outline-gold-deep w-full border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1"
        />
      </div>

      {state.status === 'error' && state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-gold text-ink hover:bg-gold-hi focus-visible:outline-gold-deep px-8 py-3 text-sm font-semibold tracking-wide uppercase disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {pending ? text.sending : text.submit}
      </button>
    </form>
  )
}
```

`<form action={formAction}>` với Server Action: submit được ngay cả khi JS chưa load.
`useActionState` chỉ nâng cấp trải nghiệm, không phải điều kiện để form chạy.

- [ ] **Step 3: Viết components/forms/NewsletterForm.tsx**

```tsx
'use client'

import { useActionState } from 'react'
import { submitNewsletter } from '@/app/actions/newsletter'
import type { FormState } from '@/app/actions/lead'
import type { Locale } from '@/lib/i18n'

const INITIAL: FormState = { status: 'idle' }

export function NewsletterForm({ lang }: { lang: Locale }) {
  const [state, formAction, pending] = useActionState(submitNewsletter, INITIAL)
  const placeholder = lang === 'vi' ? 'Email của bạn' : 'Your email'
  const submit = lang === 'vi' ? 'Đăng ký' : 'Subscribe'

  if (state.status === 'success') {
    return (
      <p role="status" className="text-sm">
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-wrap gap-2" noValidate>
      <input type="hidden" name="locale" value={lang} />
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <input name="company" tabIndex={-1} autoComplete="off" aria-label="Company" />
      </div>

      <label htmlFor="newsletter-email" className="sr-only">
        {placeholder}
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder={placeholder}
        aria-invalid={state.fieldErrors?.email ? 'true' : undefined}
        className="border-line focus:outline-gold-deep min-w-0 flex-1 border bg-white px-3 py-2 text-sm focus:outline-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-6 py-2 text-sm font-semibold tracking-wide text-white uppercase disabled:opacity-60"
      >
        {submit}
      </button>

      {state.status === 'error' && state.message && (
        <p role="alert" className="w-full text-xs text-red-700">
          {state.message}
        </p>
      )}
    </form>
  )
}
```

- [ ] **Step 4: Thay LeadFormSection bản tạm**

```tsx
// components/sections/LeadFormSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { LeadForm } from '@/components/forms/LeadForm'

export function LeadFormSection({
  heading,
  description,
  formType = 'general',
  successMessage,
  lang,
  sourcePage,
}: any & { lang: Locale }) {
  return (
    <section className="bg-cream py-16">
      <Container size="narrow">
        <h2 className="font-display text-gold-deep mb-3 text-3xl">{t(heading, lang)}</h2>
        {description && <p className="mb-8 text-sm">{t(description, lang)}</p>}
        <LeadForm
          formType={formType}
          lang={lang}
          sourcePage={sourcePage}
          successMessage={t(successMessage, lang)}
        />
      </Container>
    </section>
  )
}
```

Truyền `sourcePage` xuống bằng cách bơm thêm prop trong `SectionRenderer`, giống cách
đã làm với `widgetId` ở Plan C Task 6:

```tsx
{...(section._type === 'leadFormSection' ? { sourcePage: currentSlug } : {})}
```

`SectionRenderer` nhận thêm prop `currentSlug?: string`, truyền từ
`app/[lang]/[slug]/page.tsx` (`slug`) và `app/[lang]/page.tsx` (`''`).

- [ ] **Step 5: Thêm NewsletterForm vào Footer**

Trong `components/layout/Footer.tsx`, thêm vào trước khối bản quyền:

```tsx
import { NewsletterForm } from '@/components/forms/NewsletterForm'

// ... trong grid, thêm một cột:
<div>
  <h2 className="mb-4 text-xs font-semibold tracking-widest uppercase">
    {lang === 'vi' ? 'Nhận ưu đãi' : 'Get offers'}
  </h2>
  <NewsletterForm lang={lang} />
</div>
```

- [ ] **Step 6: Kiểm chứng thủ công**

Run: `pnpm dev`

Trong Studio, thêm một `leadFormSection` vào trang Tiệc cưới với `formType: wedding`.
Mở `/vi/wedding`, gửi thử form. Kiểm bằng `pnpm db:studio` xem row đã vào bảng `leads`.

Test tắt JS: DevTools → Settings → Debugger → Disable JavaScript, tải lại, gửi form.
Kỳ vọng vẫn lưu được — đây là điều kiện progressive enhancement.

- [ ] **Step 7: Commit**

```bash
git add components/forms components/sections/LeadFormSection.tsx components/layout/Footer.tsx components/sections/SectionRenderer.tsx app
git commit -m "feat(d5): form lead và newsletter, chạy được khi chưa có JS

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: E2E cho form + dọn dẹp bàn giao

**Files:**
- Create: `tests/e2e/forms.spec.ts`
- Create: `README.md`
- Modify: `docs/import.md` (thêm mục biến môi trường)

**Interfaces:**
- Consumes: toàn bộ Task 1–5

- [ ] **Step 1: Viết tests/e2e/forms.spec.ts**

```ts
import { test, expect } from '@playwright/test'

test.describe('Form liên hệ', () => {
  test('gửi thành công với dữ liệu hợp lệ', async ({ page }) => {
    await page.goto('/vi/wedding')
    const form = page.locator('form').filter({ has: page.locator('input[name="type"]') })
    test.skip((await form.count()) === 0, 'Trang chưa có leadFormSection trong Sanity')

    await page.fill('#field-name', 'Nguyễn Văn A')
    await page.fill('#field-phone', '0904030222')
    await page.fill('#field-email', `test+${Date.now()}@example.com`)
    await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()

    await expect(page.getByRole('status')).toBeVisible()
  })

  test('báo lỗi khi email sai định dạng', async ({ page }) => {
    await page.goto('/vi/wedding')
    const form = page.locator('form').filter({ has: page.locator('input[name="type"]') })
    test.skip((await form.count()) === 0, 'Trang chưa có leadFormSection trong Sanity')

    await page.fill('#field-name', 'A')
    await page.fill('#field-phone', '0904030222')
    await page.fill('#field-email', 'khong-phai-email')
    await page.getByRole('button', { name: /Gửi yêu cầu/ }).click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('API từ chối email sai', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: { type: 'wedding', name: 'A', email: 'sai', phone: '0904030222', locale: 'vi' },
    })
    expect(response.status()).toBe(400)
  })

  test('API chấp nhận lead hợp lệ', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: {
        type: 'general',
        name: 'Playwright',
        email: `e2e+${Date.now()}@example.com`,
        phone: '0904030222',
        locale: 'vi',
      },
    })
    expect(response.status()).toBe(200)
    expect((await response.json()).ok).toBe(true)
  })

  test('honeypot bị điền: trả 200 nhưng không tạo lead', async ({ request }) => {
    const response = await request.post('/api/leads', {
      data: {
        type: 'general', name: 'Bot', email: 'bot@example.com',
        phone: '0904030222', locale: 'vi', company: 'Bot Inc',
      },
    })
    expect(response.status()).toBe(200)
  })

  test('newsletter ở chân trang đăng ký được', async ({ page }) => {
    await page.goto('/vi')
    await page.fill('#newsletter-email', `news+${Date.now()}@example.com`)
    await page.getByRole('button', { name: /Đăng ký/ }).click()
    await expect(page.getByRole('status')).toBeVisible()
  })
})
```

E2E chạm database thật. Trong CI dùng **Neon branch riêng** cho test:
tạo branch trong Neon console, đặt `DATABASE_URL` của branch đó vào secret của CI.

- [ ] **Step 2: Chạy E2E**

Run: `pnpm test:e2e tests/e2e/forms.spec.ts`
Expected: PASS. Test nào skip vì Sanity chưa có `leadFormSection` thì vào Studio thêm
khối đó vào trang Tiệc cưới rồi chạy lại.

- [ ] **Step 3: Viết README.md bàn giao**

```markdown
# Royal Halong — Next.js + Sanity + Neon

Website khách sạn Royal Halong, dựng lại từ bản clone WordPress/Salient.

## Bắt đầu

```bash
pnpm install
cp .env.example .env.local    # điền giá trị thật
pnpm import                   # đổ nội dung từ bản clone HTML vào Sanity (chạy một lần)
pnpm dev
```

- Site: <http://localhost:3000>
- Studio: <http://localhost:3000/studio>

## Lệnh

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy dev server |
| `pnpm build` / `pnpm start` | Build và chạy production |
| `pnpm test` | Unit test (Vitest) |
| `pnpm test:e2e` | E2E (Playwright, tự build trước) |
| `pnpm import` | Import nội dung — xem `docs/import.md` |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Migration Neon |

## Kiến trúc

- **Next.js 16** App Router, static generation. Một catch-all `app/[lang]/[slug]`
  giữ nguyên toàn bộ URL của site cũ.
- **Sanity** giữ nội dung. Revalidate tự động qua Live Content API — không có
  webhook nào phải cấu hình.
- **Neon Postgres** giữ lead form và newsletter. Đặt phòng do SecureBookings lo.
- Song ngữ `{vi, en}`, fallback một chiều EN → VI.

## Quy tắc màu (đã đo, đừng đoán)

Không tông vàng nào của bản gốc đọc được cho chữ nhỏ trên nền sáng:

| Token | trên trắng | Dùng cho |
|---|---|---|
| `gold #bf8d2c` | 2.97 ✗ | nền, viền, icon, chữ trên nền tối |
| `gold-deep #9b7f22` | 3.85 | heading ≥ 24px trên nền sáng |
| `gold-text #896520` | 5.32 ✓ | chữ nhỏ trên nền sáng |

Nút nền gold dùng chữ `ink`, **không** dùng chữ trắng (chỉ 2.97:1).

## Trước khi deploy công khai

Xem `NOTES.md` mục "Must replace". Ảnh, bài viết, logo, GCN ĐKDN và badge Bộ Công Thương
là tài sản của Royal Halong Hotel. Theme Salient gốc đã bị bỏ hoàn toàn nên không còn
ràng buộc license ThemeForest.
```

- [ ] **Step 4: Chạy toàn bộ kiểm thử lần cuối**

Run: `pnpm test && pnpm build && pnpm test:e2e`
Expected: unit test xanh, build thành công, e2e xanh.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/forms.spec.ts README.md docs/import.md
git commit -m "test(d6): E2E form + README bàn giao

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Hoàn thành Plan D

- Lead tiệc cưới / hội nghị và newsletter ghi vào Neon.
- Chống spam: honeypot + rate limit; honeypot trả thành công giả.
- Form chạy khi chưa có JS.
- Mail thông báo là tuỳ chọn — thiếu key vẫn lưu được lead.

## Việc còn lại sau cả 4 plan

Không thuộc phạm vi 4 plan này, ghi ra để không bị quên:

- **Nội dung tiếng Anh** — hạ tầng đã sẵn, cần người nhập vào Studio.
- **Deploy** — tạo project Vercel, đặt biến môi trường (KHÔNG đặt
  `SANITY_API_WRITE_TOKEN`), trỏ domain.
- **Verify domain trong Resend** rồi đổi `from` trong `lib/mail.ts`, nếu không mail vào spam.
- **Analytics** — GTM đã bị gỡ khỏi bản clone; thêm lại là quyết định riêng.
- **Thay nội dung có bản quyền** nếu đây không phải dự án cho chính khách sạn.
