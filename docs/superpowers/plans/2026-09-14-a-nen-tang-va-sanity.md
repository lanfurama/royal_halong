# Plan A — Nền tảng Next.js + Sanity schema

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng Next.js 16 + Tailwind 4 + Sanity Studio với schema đầy đủ, để biên tập viên nhập được nội dung ngay cả khi chưa có script import.

**Architecture:** Một Next.js app, Sanity Studio nhúng tại `/studio`, nội dung song ngữ bằng object `{vi, en}` tự định nghĩa. Chưa có trang public nào ngoài Studio — plan C dựng frontend.

**Tech Stack:** Next.js 16.3.5, React 19.3.0, Tailwind CSS 4.3.3, Sanity 6.13.2, next-sanity 13.3.4, TypeScript, Vitest 5.0.0, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-09-14-nextjs-sanity-migration-design.md`

## Global Constraints

- Node 22.22.0, pnpm 11.21.0. Dùng `pnpm`, không `npm`/`yarn`.
- Version chốt (đã kiểm tra trên npm registry ngày 2026-09-14, **pin chính xác, không dùng `^`**):
  `next@16.3.5` · `react@19.3.0` · `react-dom@19.3.0` · `tailwindcss@4.3.3` ·
  `sanity@6.13.2` · `next-sanity@13.3.4` · `@sanity/image-url@2.1.1` ·
  `@sanity/vision@6.13.2` · `vitest@5.0.0` · `zod@4.6.5`
- **Tailwind 4 không có `tailwind.config.js`.** Token khai bằng `@theme` trong CSS.
- **Next 16: `params` và `searchParams` là Promise**, phải `await`. Dùng type helper
  toàn cục `PageProps<'/route'>` / `LayoutProps<'/route'>` (Next sinh tự động, không import).
- **`cacheComponents: true`** → `generateStaticParams` **không được trả mảng rỗng**.
- Không tự dựng `/api/revalidate`. Live Content API của next-sanity lo việc đó.
- Mã nguồn mới đặt ở gốc repo. **Không sửa, không xoá** `index.html`, `*/index.html`,
  `wp-content/`, `wp-includes/`, `assets/` — đó là nguồn dữ liệu cho plan B.
- Mọi text hiển thị cho người dùng cuối là tiếng Việt. Tên biến/hàm tiếng Anh.
- Locale hợp lệ: `'vi' | 'en'`. Mặc định `'vi'`. Fallback một chiều `en → vi`.

---

### Task 1: Scaffold Next.js + Tailwind + token + font

Dựng khung app, khai báo design token đã đo tương phản, nạp 4 font. Kết thúc task
này `pnpm dev` chạy được và hiện một trang kiểm chứng token.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `lib/fonts.ts`
- Create: `vitest.config.ts`, `tests/setup.ts`

**Interfaces:**
- Consumes: (không có — task đầu tiên)
- Produces: `lib/fonts.ts` export `display`, `body`, `accent`, `alt` — mỗi cái là
  `NextFontWithVariable` có `.variable` là tên class CSS.

- [ ] **Step 1: Khởi tạo package.json và cài dependency**

```bash
cd "/Users/bcmac/Desktop/projects/Outside Projects/royal-halong"
pnpm init
pnpm add next@16.3.5 react@19.3.0 react-dom@19.3.0
pnpm add -D typescript@5 @types/node@22 @types/react@19 @types/react-dom@19 \
  tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 postcss@8 \
  vitest@5.0.0 @vitejs/plugin-react@5
```

- [ ] **Step 2: Viết package.json scripts**

Mở `package.json`, thay khối `"scripts"` bằng:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typegen": "next typegen",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "packageManager": "pnpm@11.21.0"
}
```

- [ ] **Step 3: Viết tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "wp-content", "wp-includes", "assets"]
}
```

`exclude` bỏ `wp-content`/`wp-includes`/`assets` để TS không quét 1.000 file tĩnh.

`jsx` phải là `react-jsx`, không phải `preserve`: Next 16 + React 19 dùng automatic JSX
runtime, và `next dev` sẽ **tự sửa** field này rồi in "mandatory changes were made to your
tsconfig.json" nếu bạn đặt khác. Next cũng tự thêm `.next/dev/types/**/*.ts` vào `include` —
để yên, đó là hành vi bình thường chứ không phải rác.

Ngoài ra `pnpm init` của pnpm 11 sinh sẵn một khối `devEngines.packageManager` mà chính pnpm
sau đó từ chối (`Invalid package manager specification`). Xoá khối đó đi; `packageManager`
ở Step 2 mới là thứ cần giữ.

- [ ] **Step 4: Viết next.config.ts**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
}

export default nextConfig
```

`cacheLife: { default: sanity }` sẽ được thêm ở Task 3, khi `next-sanity` đã cài.

- [ ] **Step 5: Viết postcss.config.mjs**

```js
const config = {
  plugins: { '@tailwindcss/postcss': {} },
}
export default config
```

- [ ] **Step 6: Viết app/globals.css với design token**

Giá trị tương phản trong comment là số đo thật (xem spec mục 7), không phải ước lượng.

```css
@import "tailwindcss";

@theme {
  /* Màu thương hiệu — lấy từ salient-dynamic-styles.css của bản gốc */
  --color-gold: #bf8d2c;       /* trên trắng 2.97 — CHỈ dùng làm nền/viền/icon */
  --color-gold-hi: #d19f2b;    /* trên trắng 2.41 — CHỈ nền/viền/icon */
  --color-gold-deep: #9b7f22;  /* trên trắng 3.85 — chữ >= 24px hoặc >= 19px bold */
  --color-gold-text: #896520;  /* trên trắng 5.32, trên cream 4.55 — chữ nhỏ */
  --color-ink: #0a0a0a;
  --color-cream: #f4ece2;
  --color-line: #e3d9cb;
  --color-body: #333333;
  --color-sky: #98c8e8;        /* trang trí, không làm chữ trên nền sáng */
  --color-peach: #ffac66;      /* trang trí, không làm chữ trên nền sáng */

  /* Font — biến do lib/fonts.ts gán */
  --font-display: var(--font-arsenal), Georgia, serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
  --font-accent: var(--font-cormorant), Georgia, serif;
  --font-alt: var(--font-fahkwang), system-ui, sans-serif;
}

@layer base {
  body {
    background: #ffffff;
    color: var(--color-body);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.6;
  }
  h1, h2, h3 { font-family: var(--font-display); }
}
```

- [ ] **Step 7: Viết lib/fonts.ts**

```ts
import { Arsenal, Inter, Cormorant, Fahkwang } from 'next/font/google'

export const display = Arsenal({
  weight: ['700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-arsenal',
})

export const body = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
})

export const accent = Cormorant({
  weight: ['500'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-cormorant',
})

export const alt = Fahkwang({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fahkwang',
})
```

⚠️ **Mọi đối số của `next/font/google` phải là literal.** Không tách hằng dùng chung
(`const SUBSETS = [...]` rồi `subsets: [...SUBSETS]`), không biến, không giá trị tính toán.
`next/font` là transform lúc biên dịch, đọc AST của đối số chứ không đánh giá nó —
gặp spread sẽ hỏng với `Error: Unexpected spread` và trang trả HTTP 500. Lặp lại
`['latin', 'vietnamese']` ở từng font là đúng, không phải trùng lặp cần dọn.

Fahkwang không có subset `vietnamese` trên Google Fonts — chỉ khai `latin`.

- [ ] **Step 8: Viết app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { display, body, accent, alt } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Royal Halong Hotel',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const fontVars = [display, body, accent, alt].map((f) => f.variable).join(' ')
  return (
    <html lang="vi" className={fontVars}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Viết app/page.tsx — trang kiểm chứng token**

Trang tạm để mắt thường xác nhận font và màu đã nạp. Plan C sẽ thay bằng redirect.

```tsx
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl text-gold-deep">Royal Hạ Long</h1>
      <p className="mt-4">Chữ thường tiếng Việt: đầy đủ dấu — ạ ằ ể ỗ ữ ợ.</p>
      <p className="mt-2 text-gold-text">Chữ nhỏ màu vàng dùng gold-text (5.32:1).</p>
      <p className="font-accent mt-2 text-2xl italic">Cormorant nghiêng</p>
      <div className="mt-6 flex gap-3">
        <span className="bg-gold text-ink px-4 py-2">Nút nền gold, chữ ink</span>
        <span className="bg-ink px-4 py-2 text-gold-hi">Nền tối, chữ gold-hi</span>
      </div>
    </main>
  )
}
```

- [ ] **Step 10: Viết vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, '.') } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
  },
})
```

- [ ] **Step 11: Viết tests/setup.ts**

```ts
// Chỗ đặt global test setup. Hiện chưa cần gì, giữ file để vitest.config trỏ vào.
export {}
```

- [ ] **Step 12: Chạy dev và mắt thường kiểm chứng**

Run: `pnpm dev`
Mở `http://localhost:3000`. Kỳ vọng: tiêu đề "Royal Hạ Long" font serif đậm màu vàng
đậm, dấu tiếng Việt hiển thị đúng, nút nền vàng chữ đen. Nếu chữ hiện font hệ thống
thì biến font chưa gắn vào `<html>`.

- [ ] **Step 13: Chạy build để bắt lỗi cấu hình sớm**

Run: `pnpm build`
Expected: build thành công. Nếu lỗi `LayoutProps is not defined`, chạy `pnpm typegen`
trước rồi build lại.

- [ ] **Step 14: Commit**

Lần `pnpm dev` đầu tiên, Next 16 tự sinh `AGENTS.md` và `CLAUDE.md` ở gốc repo và ghi lại
chúng ở mỗi lần chạy sau. **Commit cả hai** — `AGENTS.md` trỏ tới `node_modules/next/dist/docs/`
là tài liệu Next 16 thật, và nếu gitignore thì chúng tái sinh thành rác trong `git status`
suốt phần còn lại của dự án. Đừng đặt `agentRules: false`.

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts postcss.config.mjs \
  app lib vitest.config.ts tests .gitignore AGENTS.md CLAUDE.md
git commit -m "feat(a1): scaffold Next.js 16 + Tailwind 4 + design token + font

Token gold/cream/ink lấy từ bản gốc, thêm --color-gold-text #896520 cho chữ nhỏ
trên nền sáng vì không tông vàng gốc nào đạt AA (đo: gold 2.97, gold-deep 3.85).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Helper i18n

Hàm `t()` là thứ mọi component sẽ gọi. Viết test trước.

**Files:**
- Create: `lib/i18n.ts`
- Test: `tests/unit/i18n.test.ts`

**Interfaces:**
- Consumes: (không)
- Produces:
  - `type Locale = 'vi' | 'en'`
  - `const LOCALES: readonly Locale[]`
  - `const DEFAULT_LOCALE: Locale`
  - `type LocaleField<T> = { vi?: T | null; en?: T | null }`
  - `function t<T>(field: LocaleField<T> | null | undefined, locale: Locale): T | undefined`
  - `function isLocale(value: string): value is Locale`

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/unit/i18n.test.ts
import { describe, it, expect } from 'vitest'
import { t, isLocale, LOCALES, DEFAULT_LOCALE } from '@/lib/i18n'

describe('t()', () => {
  it('trả đúng giá trị của locale được yêu cầu', () => {
    expect(t({ vi: 'Lưu trú', en: 'Stay' }, 'en')).toBe('Stay')
    expect(t({ vi: 'Lưu trú', en: 'Stay' }, 'vi')).toBe('Lưu trú')
  })

  it('fallback về vi khi en trống', () => {
    expect(t({ vi: 'Lưu trú', en: '' }, 'en')).toBe('Lưu trú')
    expect(t({ vi: 'Lưu trú', en: null }, 'en')).toBe('Lưu trú')
    expect(t({ vi: 'Lưu trú' }, 'en')).toBe('Lưu trú')
  })

  it('KHÔNG fallback ngược: vi trống thì trả undefined kể cả khi en có', () => {
    expect(t({ vi: '', en: 'Stay' }, 'vi')).toBeUndefined()
  })

  it('trả undefined khi field null hoặc undefined', () => {
    expect(t(null, 'vi')).toBeUndefined()
    expect(t(undefined, 'vi')).toBeUndefined()
  })

  it('hoạt động với mảng Portable Text, không chỉ chuỗi', () => {
    const blocks = [{ _type: 'block', children: [] }]
    expect(t({ vi: blocks, en: [] }, 'en')).toEqual(blocks)
  })
})

describe('isLocale()', () => {
  it('nhận vi và en, từ chối phần còn lại', () => {
    expect(isLocale('vi')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('')).toBe(false)
  })
})

describe('hằng số', () => {
  it('LOCALES là [vi, en] và mặc định là vi', () => {
    expect(LOCALES).toEqual(['vi', 'en'])
    expect(DEFAULT_LOCALE).toBe('vi')
  })
})
```

Lưu ý test "mảng rỗng cũng là trống": `t({vi: blocks, en: []}, 'en')` trả `blocks`.
Đây là chủ ý — biên tập viên tạo field EN rồi để rỗng vẫn phải fallback.

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/i18n.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/i18n"`.

- [ ] **Step 3: Viết lib/i18n.ts**

```ts
export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

export type LocaleField<T> = { vi?: T | null; en?: T | null }

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Đọc một field song ngữ. Fallback MỘT CHIỀU: en trống -> dùng vi.
 * vi trống là lỗi dữ liệu, trả undefined để chỗ gọi tự xử lý, không fallback ngược.
 */
export function t<T>(
  field: LocaleField<T> | null | undefined,
  locale: Locale,
): T | undefined {
  if (!field) return undefined
  const value = field[locale]
  if (!isEmpty(value)) return value as T
  if (locale === DEFAULT_LOCALE) return undefined
  const fallback = field[DEFAULT_LOCALE]
  return isEmpty(fallback) ? undefined : (fallback as T)
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/i18n.test.ts`
Expected: PASS, 7 test.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts tests/unit/i18n.test.ts
git commit -m "feat(a2): helper i18n với fallback một chiều en->vi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Sanity client, Live API, Studio

Kết thúc task này `/studio` mở được (schema còn rỗng).

**Files:**
- Create: `sanity/env.ts`, `sanity/lib/client.ts`, `sanity/lib/live.ts`, `sanity/lib/image.ts`
- Create: `sanity/schemaTypes/index.ts`, `sanity/structure.ts`, `sanity.config.ts`, `sanity.cli.ts`
- Create: `app/studio/[[...tool]]/page.tsx`
- Create: `.env.example`
- Modify: `next.config.ts`, `app/layout.tsx`

**Interfaces:**
- Consumes: Task 1 (`app/layout.tsx`, `next.config.ts`)
- Produces:
  - `sanity/lib/client.ts` → `client` (SanityClient)
  - `sanity/lib/live.ts` → `SanityLive`, `sanityFetch`, `cachedSanity`,
    `cachedSanityStaticParams({query, params})`, `cachedSanityMetadata({query, params, perspective})`
  - `sanity/lib/image.ts` → `urlFor(source): ImageUrlBuilder`
  - `sanity/schemaTypes/index.ts` → `schemaTypes: SchemaTypeDefinition[]`

- [ ] **Step 1: Cài dependency Sanity**

```bash
pnpm add sanity@6.13.2 next-sanity@13.3.4 @sanity/image-url@2.1.1 @sanity/vision@6.13.2 styled-components@6
```

- [ ] **Step 2: Tạo project Sanity và ghi biến môi trường**

```bash
pnpm dlx sanity@6.13.2 login
pnpm dlx sanity@6.13.2 projects create "Royal Halong" --dataset production
```

Lệnh trên in ra project id. Tạo `.env.local` (đã bị gitignore) với id đó:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=<id vừa in ra>
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-09-14
SANITY_API_READ_TOKEN=<tạo ở sanity.io/manage -> API -> Tokens, quyền Viewer>
SANITY_API_WRITE_TOKEN=<token quyền Editor, chỉ dùng cho plan B>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: Viết .env.example (có commit, không chứa giá trị thật)**

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-09-14
# Viewer token — bắt buộc, defineLive ném lỗi nếu thiếu
SANITY_API_READ_TOKEN=
# Editor token — chỉ script import (plan B) dùng, KHÔNG đặt trên Vercel
SANITY_API_WRITE_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4: Viết sanity/env.ts**

```ts
function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`)
  return value
}

export const projectId = required(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
)
export const dataset = required(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'NEXT_PUBLIC_SANITY_DATASET',
)
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-09-14'
```

- [ ] **Step 5: Viết sanity/lib/client.ts**

```ts
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Live Content API cần useCdn: false
})
```

- [ ] **Step 6: Viết sanity/lib/live.ts**

Chép sát mẫu chính thức của next-sanity 13 — `sanityFetch` tự gọi `cacheTag`/`cacheLife`
bên trong, nên `cachedSanity` là ranh giới `'use cache'` **duy nhất**; chỗ gọi tuyệt đối
không tự thêm `'use cache'` nữa.

```ts
import { type QueryParams } from 'next-sanity'
import {
  defineLive,
  resolvePerspectiveFromCookies,
  type LivePerspective,
  type StrictDefinedFetchType,
} from 'next-sanity/live'
import { cookies, draftMode } from 'next/headers'
import { client } from './client'

const token = process.env.SANITY_API_READ_TOKEN
if (!token) throw new Error('Thiếu SANITY_API_READ_TOKEN')

export const { SanityLive, sanityFetch } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
})

export const cachedSanity: StrictDefinedFetchType = async (options) => {
  'use cache'
  return sanityFetch(options)
}

export interface DynamicFetchOptions {
  perspective: LivePerspective
  stega: boolean
}

export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const { isEnabled: isDraftMode } = await draftMode()
  if (!isDraftMode) return { perspective: 'published', stega: false }
  const jar = await cookies()
  const perspective = await resolvePerspectiveFromCookies({ cookies: jar })
  return { perspective: perspective ?? 'drafts', stega: true }
}

export async function cachedSanityStaticParams<const QueryString extends string>({
  query,
  params = {},
}: {
  query: QueryString
  params?: QueryParams
}) {
  const { data } = await cachedSanity({
    query,
    params,
    perspective: 'published',
    stega: false,
  })
  return { data }
}

export async function cachedSanityMetadata<const QueryString extends string>({
  query,
  params = {},
  perspective,
}: {
  query: QueryString
  params?: QueryParams
  perspective: LivePerspective
}) {
  const { data } = await cachedSanity({ query, params, perspective, stega: false })
  return { data }
}
```

- [ ] **Step 7: Viết sanity/lib/image.ts**

```ts
import createImageUrlBuilder from '@sanity/image-url'
import type { Image } from 'sanity'
import { dataset, projectId } from '../env'

const builder = createImageUrlBuilder({ projectId, dataset })

export function urlFor(source: Image) {
  return builder.image(source).auto('format').fit('max')
}
```

- [ ] **Step 8: Cập nhật next.config.ts thêm cacheLife**

Thay nội dung `next.config.ts` thành:

```ts
import type { NextConfig } from 'next'
import { sanity } from 'next-sanity/live/cache-life'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: { default: sanity },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
}

export default nextConfig
```

- [ ] **Step 9: Viết sanity/schemaTypes/index.ts (rỗng, điền ở Task 4–7)**

```ts
import type { SchemaTypeDefinition } from 'sanity'

export const schemaTypes: SchemaTypeDefinition[] = []
```

- [ ] **Step 10: Viết sanity/structure.ts**

```ts
import type { StructureResolver } from 'sanity/structure'

const SINGLETONS = [
  { id: 'siteSettings', title: 'Cấu hình site' },
  { id: 'navigation', title: 'Menu điều hướng' },
  { id: 'homePage', title: 'Trang chủ' },
] as const

const SINGLETON_IDS: string[] = SINGLETONS.map((s) => s.id)

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Nội dung')
    .items([
      ...SINGLETONS.map(({ id, title }) =>
        S.listItem()
          .title(title)
          .id(id)
          .child(S.document().schemaType(id).documentId(id).title(title)),
      ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETON_IDS.includes(item.getId() ?? ''),
      ),
    ])
```

- [ ] **Step 11: Viết sanity.config.ts**

```ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schemaTypes } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
})
```

- [ ] **Step 12: Viết sanity.cli.ts (cho lệnh CLI của plan B)**

```ts
import { defineCliConfig } from 'sanity/cli'
import { dataset, projectId } from './sanity/env'

export default defineCliConfig({ api: { projectId, dataset } })
```

- [ ] **Step 13: Viết app/studio/[[...tool]]/page.tsx**

```tsx
import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

- [ ] **Step 14: Gắn SanityLive vào root layout**

Thay `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { display, body, accent, alt } from '@/lib/fonts'
import { SanityLive } from '@/sanity/lib/live'
import './globals.css'

export const metadata: Metadata = {
  title: 'Royal Halong Hotel',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { isEnabled: isDraftMode } = await draftMode()
  const fontVars = [display, body, accent, alt].map((f) => f.variable).join(' ')
  return (
    <html lang="vi" className={fontVars}>
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

- [ ] **Step 15: Chạy dev và mở Studio**

Run: `pnpm dev`
Mở `http://localhost:3000/studio`. Kỳ vọng: Studio load, đăng nhập được, sidebar hiện
3 mục singleton (Cấu hình site / Menu điều hướng / Trang chủ) — bấm vào sẽ báo lỗi
schema chưa tồn tại, đúng như mong đợi ở bước này.

- [ ] **Step 16: Commit**

```bash
git add sanity sanity.config.ts sanity.cli.ts app next.config.ts .env.example package.json pnpm-lock.yaml
git commit -m "feat(a3): Sanity client + Live Content API + Studio nhúng tại /studio

Dùng defineLive của next-sanity 13 thay cho webhook revalidate tự dựng.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Object type dùng chung (locale, seo, link, image)

Nền của mọi schema sau. Không có test tự động — Studio là nơi kiểm chứng.

**Files:**
- Create: `sanity/schemaTypes/objects/localeString.ts`, `localeText.ts`, `localeBlock.ts`,
  `localeSlug.ts`, `seo.ts`, `link.ts`, `figure.ts`
- Modify: `sanity/schemaTypes/index.ts`

**Interfaces:**
- Consumes: Task 3 (`schemaTypes` array)
- Produces: 7 type name dùng ở Task 5–7: `localeString`, `localeText`, `localeBlock`,
  `localeSlug`, `seo`, `link`, `figure`.

- [ ] **Step 1: Viết sanity/schemaTypes/objects/localeString.ts**

```ts
import { defineType, defineField } from 'sanity'

export const localeString = defineType({
  name: 'localeString',
  title: 'Chuỗi song ngữ',
  type: 'object',
  fields: [
    defineField({
      name: 'vi',
      title: 'Tiếng Việt',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'en', title: 'English', type: 'string' }),
  ],
  preview: { select: { title: 'vi', subtitle: 'en' } },
})
```

`vi` bắt buộc, `en` không — khớp quy tắc fallback một chiều ở `lib/i18n.ts`.

- [ ] **Step 2: Viết localeText.ts**

```ts
import { defineType, defineField } from 'sanity'

export const localeText = defineType({
  name: 'localeText',
  title: 'Đoạn văn song ngữ',
  type: 'object',
  fields: [
    defineField({
      name: 'vi',
      title: 'Tiếng Việt',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 3 }),
  ],
  preview: { select: { title: 'vi' } },
})
```

- [ ] **Step 3: Viết localeBlock.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'

const blockContent = [
  defineArrayMember({
    type: 'block',
    styles: [
      { title: 'Thường', value: 'normal' },
      { title: 'Tiêu đề 2', value: 'h2' },
      { title: 'Tiêu đề 3', value: 'h3' },
      { title: 'Tiêu đề 4', value: 'h4' },
      { title: 'Trích dẫn', value: 'blockquote' },
    ],
    lists: [
      { title: 'Gạch đầu dòng', value: 'bullet' },
      { title: 'Đánh số', value: 'number' },
    ],
    marks: {
      decorators: [
        { title: 'Đậm', value: 'strong' },
        { title: 'Nghiêng', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Liên kết',
          fields: [
            { name: 'href', type: 'url', title: 'URL',
              validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }) },
            { name: 'blank', type: 'boolean', title: 'Mở tab mới' },
          ],
        },
      ],
    },
  }),
  defineArrayMember({ type: 'figure' }),
]

export const localeBlock = defineType({
  name: 'localeBlock',
  title: 'Nội dung song ngữ',
  type: 'object',
  fields: [
    defineField({ name: 'vi', title: 'Tiếng Việt', type: 'array', of: blockContent }),
    defineField({ name: 'en', title: 'English', type: 'array', of: blockContent }),
  ],
})
```

- [ ] **Step 4: Viết localeSlug.ts**

```ts
import { defineType, defineField } from 'sanity'

export const localeSlug = defineType({
  name: 'localeSlug',
  title: 'Đường dẫn song ngữ',
  type: 'object',
  fields: [
    defineField({
      name: 'vi',
      title: 'Đường dẫn tiếng Việt',
      type: 'slug',
      validation: (r) => r.required(),
      options: { maxLength: 96 },
    }),
    defineField({
      name: 'en',
      title: 'Đường dẫn English',
      type: 'slug',
      options: { maxLength: 96 },
      description: 'Để trống thì dùng chung đường dẫn tiếng Việt.',
    }),
  ],
})
```

- [ ] **Step 5: Viết figure.ts**

```ts
import { defineType, defineField } from 'sanity'

export const figure = defineType({
  name: 'figure',
  title: 'Ảnh',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Mô tả ảnh (alt)',
      type: 'localeString',
      description: 'Bắt buộc cho accessibility. Mô tả nội dung ảnh, không phải "ảnh khách sạn".',
    }),
    defineField({ name: 'caption', title: 'Chú thích hiển thị', type: 'localeString' }),
  ],
})
```

- [ ] **Step 6: Viết link.ts**

```ts
import { defineType, defineField } from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Liên kết',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Loại',
      type: 'string',
      options: {
        list: [
          { title: 'Trang trong site', value: 'internal' },
          { title: 'Địa chỉ ngoài', value: 'external' },
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'reference',
      title: 'Trang',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'room' }, { type: 'post' }, { type: 'offer' }],
      hidden: ({ parent }) => parent?.kind !== 'internal',
    }),
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
      hidden: ({ parent }) => parent?.kind !== 'external',
    }),
    defineField({ name: 'label', title: 'Chữ trên liên kết', type: 'localeString' }),
    defineField({ name: 'blank', title: 'Mở tab mới', type: 'boolean', initialValue: false }),
  ],
})
```

`reference` trỏ tới `page`/`room`/`post`/`offer` — các type này định nghĩa ở Task 5–6.
Sanity chỉ kiểm tra tên type lúc chạy, nên thứ tự khai báo không quan trọng, nhưng
**phải hoàn thành Task 5 và 6 trước khi mở Studio**, nếu không Studio báo unknown type.

- [ ] **Step 7: Viết seo.ts**

```ts
import { defineType, defineField } from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Tiêu đề meta',
      type: 'localeString',
      description: 'Để trống thì dùng tiêu đề trang. Nên dưới 60 ký tự.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Mô tả meta',
      type: 'localeText',
      description: 'Nên 120–160 ký tự.',
    }),
    defineField({ name: 'ogImage', title: 'Ảnh chia sẻ mạng xã hội', type: 'figure' }),
    defineField({
      name: 'noIndex',
      title: 'Chặn Google lập chỉ mục',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
```

- [ ] **Step 8: Đăng ký object type vào index**

Thay `sanity/schemaTypes/index.ts`:

```ts
import type { SchemaTypeDefinition } from 'sanity'
import { localeString } from './objects/localeString'
import { localeText } from './objects/localeText'
import { localeBlock } from './objects/localeBlock'
import { localeSlug } from './objects/localeSlug'
import { figure } from './objects/figure'
import { link } from './objects/link'
import { seo } from './objects/seo'

export const schemaTypes: SchemaTypeDefinition[] = [
  localeString,
  localeText,
  localeBlock,
  localeSlug,
  figure,
  link,
  seo,
]
```

- [ ] **Step 9: Commit**

```bash
git add sanity/schemaTypes
git commit -m "feat(a4): object type dùng chung — locale*, figure, link, seo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Document type nội dung (room, post, offer, venue, hall, galleryAlbum, testimonial)

**Files:**
- Create: `sanity/schemaTypes/documents/room.ts`, `post.ts`, `offer.ts`, `venue.ts`,
  `hall.ts`, `galleryAlbum.ts`, `testimonial.ts`
- Modify: `sanity/schemaTypes/index.ts`

**Interfaces:**
- Consumes: Task 4 (`localeString`, `localeText`, `localeBlock`, `localeSlug`, `figure`, `link`, `seo`)
- Produces: type name `room`, `post`, `offer`, `venue`, `hall`, `galleryAlbum`, `testimonial`

- [ ] **Step 1: Viết room.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const room = defineType({
  name: 'room',
  title: 'Loại phòng',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tên phòng', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({
      name: 'category',
      title: 'Nhóm',
      type: 'string',
      options: {
        list: [
          { title: 'Phòng khách sạn', value: 'hotel' },
          { title: 'Villa', value: 'villa' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'areaSqm', title: 'Diện tích (m²)', type: 'number', validation: (r) => r.positive() }),
    defineField({ name: 'capacity', title: 'Sức chứa', type: 'localeString' }),
    defineField({ name: 'view', title: 'Hướng phòng', type: 'localeString' }),
    defineField({ name: 'bedType', title: 'Loại giường', type: 'localeString' }),
    defineField({ name: 'summary', title: 'Tóm tắt', type: 'localeText' }),
    defineField({ name: 'description', title: 'Mô tả chi tiết', type: 'localeBlock' }),
    defineField({ name: 'heroImage', title: 'Ảnh đại diện', type: 'figure', validation: (r) => r.required() }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh phòng',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
    }),
    defineField({
      name: 'features',
      title: 'Tiện nghi',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'feature',
          fields: [
            defineField({ name: 'icon', title: 'Biểu tượng', type: 'image' }),
            defineField({ name: 'label', title: 'Nội dung', type: 'localeString', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'label.vi', media: 'icon' } },
        }),
      ],
    }),
    defineField({ name: 'order', title: 'Thứ tự hiển thị', type: 'number', initialValue: 0 }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [
    { name: 'order', title: 'Thứ tự', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'title.vi', subtitle: 'category', media: 'heroImage' } },
})
```

- [ ] **Step 2: Viết post.ts**

```ts
import { defineType, defineField } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Bài viết',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({
      name: 'category',
      title: 'Chuyên mục',
      type: 'string',
      options: {
        list: [
          { title: 'Tin tức & Báo chí', value: 'news' },
          { title: 'Thông báo', value: 'announcement' },
        ],
        layout: 'radio',
      },
      initialValue: 'news',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Ngày đăng', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'excerpt', title: 'Tóm tắt', type: 'localeText' }),
    defineField({ name: 'coverImage', title: 'Ảnh bìa', type: 'figure' }),
    defineField({ name: 'body', title: 'Nội dung', type: 'localeBlock' }),
    defineField({ name: 'author', title: 'Tác giả', type: 'string' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [
    { name: 'newest', title: 'Mới nhất', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: { select: { title: 'title.vi', subtitle: 'publishedAt', media: 'coverImage' } },
})
```

- [ ] **Step 3: Viết offer.ts**

```ts
import { defineType, defineField } from 'sanity'

export const offer = defineType({
  name: 'offer',
  title: 'Chương trình ưu đãi',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tên chương trình', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({ name: 'excerpt', title: 'Tóm tắt', type: 'localeText' }),
    defineField({ name: 'image', title: 'Ảnh', type: 'figure' }),
    defineField({ name: 'body', title: 'Nội dung', type: 'localeBlock' }),
    defineField({
      name: 'priceNote',
      title: 'Ghi chú giá',
      type: 'localeString',
      description: 'Ví dụ: "CHỈ TỪ 500.000VNĐ/KHÁCH"',
    }),
    defineField({ name: 'validFrom', title: 'Bắt đầu', type: 'date' }),
    defineField({ name: 'validTo', title: 'Kết thúc', type: 'date' }),
    defineField({ name: 'cta', title: 'Nút hành động', type: 'link' }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { select: { title: 'title.vi', subtitle: 'priceNote.vi', media: 'image' } },
})
```

- [ ] **Step 4: Viết venue.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const venue = defineType({
  name: 'venue',
  title: 'Nhà hàng & Tiện ích',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Tên', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug' }),
    defineField({
      name: 'kind',
      title: 'Loại',
      type: 'string',
      options: {
        list: [
          { title: 'Ẩm thực', value: 'dining' },
          { title: 'Tiện ích', value: 'facility' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'location', title: 'Địa điểm', type: 'localeString', description: 'Ví dụ: "Tầng 2 Khách sạn"' }),
    defineField({ name: 'capacity', title: 'Sức chứa', type: 'localeString' }),
    defineField({ name: 'hours', title: 'Giờ mở cửa', type: 'localeString' }),
    defineField({
      name: 'highlights',
      title: 'Món đặc trưng / Điểm nhấn',
      type: 'array',
      of: [defineArrayMember({ type: 'localeString' })],
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeBlock' }),
    defineField({ name: 'image', title: 'Ảnh đại diện', type: 'figure' }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
    }),
    defineField({ name: 'menuUrl', title: 'Link menu', type: 'url' }),
    defineField({ name: 'phone', title: 'Điện thoại đặt chỗ', type: 'string' }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'name.vi', subtitle: 'kind', media: 'image' } },
})
```

- [ ] **Step 5: Viết hall.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const hall = defineType({
  name: 'hall',
  title: 'Phòng hội nghị',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Tên phòng', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug' }),
    defineField({ name: 'areaSqm', title: 'Diện tích (m²)', type: 'number' }),
    defineField({ name: 'capacity', title: 'Sức chứa', type: 'localeString' }),
    defineField({
      name: 'layouts',
      title: 'Kiểu bố trí',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'layout',
          fields: [
            defineField({ name: 'style', title: 'Kiểu', type: 'localeString' }),
            defineField({ name: 'seats', title: 'Số chỗ', type: 'number' }),
          ],
          preview: { select: { title: 'style.vi', subtitle: 'seats' } },
        }),
      ],
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeBlock' }),
    defineField({ name: 'image', title: 'Ảnh', type: 'figure' }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
    }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'name.vi', subtitle: 'capacity.vi', media: 'image' } },
})
```

- [ ] **Step 6: Viết galleryAlbum.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const galleryAlbum = defineType({
  name: 'galleryAlbum',
  title: 'Album ảnh',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tên album', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug' }),
    defineField({
      name: 'images',
      title: 'Ảnh',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
      validation: (r) => r.min(1),
    }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  preview: {
    select: { title: 'title.vi', media: 'images.0' },
  },
})
```

- [ ] **Step 7: Viết testimonial.ts**

```ts
import { defineType, defineField } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Cảm nhận khách hàng',
  type: 'document',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề đánh giá', type: 'localeString' }),
    defineField({ name: 'quote', title: 'Nội dung', type: 'localeText', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'Người viết', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'source', title: 'Nguồn', type: 'string', initialValue: 'TripAdvisor' }),
    defineField({ name: 'sourceUrl', title: 'Link nguồn', type: 'url' }),
    defineField({
      name: 'rating',
      title: 'Số sao',
      type: 'number',
      validation: (r) => r.min(1).max(5),
    }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'author', subtitle: 'heading.vi' } },
})
```

- [ ] **Step 8: Đăng ký vào index**

Thêm import và phần tử vào `sanity/schemaTypes/index.ts`:

```ts
import { room } from './documents/room'
import { post } from './documents/post'
import { offer } from './documents/offer'
import { venue } from './documents/venue'
import { hall } from './documents/hall'
import { galleryAlbum } from './documents/galleryAlbum'
import { testimonial } from './documents/testimonial'
```

và nối vào mảng `schemaTypes` sau các object type:

```ts
  room, post, offer, venue, hall, galleryAlbum, testimonial,
```

- [ ] **Step 9: Commit**

```bash
git add sanity/schemaTypes
git commit -m "feat(a5): document type room/post/offer/venue/hall/galleryAlbum/testimonial

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Section block + document `page`

15 block theo spec mục 4. Mỗi block là một object type riêng, gom trong một thư mục.

**Files:**
- Create: `sanity/schemaTypes/sections/` — 15 file, một file một block
- Create: `sanity/schemaTypes/sections/index.ts`
- Create: `sanity/schemaTypes/documents/page.ts`
- Modify: `sanity/schemaTypes/index.ts`

**Interfaces:**
- Consumes: Task 4, Task 5
- Produces: type name `page`, và 15 block:
  `heroSection`, `richTextSection`, `imageTextSection`, `cardGridSection`,
  `galleryCarouselSection`, `venueListSection`, `hallListSection`, `roomListSection`,
  `ctaBandSection`, `mapSection`, `tableSection`, `bookingWidgetSection`,
  `leadFormSection`, `faqSection`, `postListSection`.
  Mọi block đều có field `_type` và (trừ `bookingWidgetSection`) một field `heading: localeString`.

- [ ] **Step 1: Viết heroSection.ts, richTextSection.ts, imageTextSection.ts**

```ts
// sanity/schemaTypes/sections/heroSection.ts
import { defineType, defineField } from 'sanity'

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Khối hero',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'subheading', title: 'Tiêu đề phụ', type: 'localeString' }),
    defineField({ name: 'background', title: 'Ảnh nền', type: 'figure', validation: (r) => r.required() }),
    defineField({ name: 'videoUrl', title: 'Video (tuỳ chọn)', type: 'url' }),
    defineField({ name: 'cta', title: 'Nút', type: 'link' }),
    defineField({
      name: 'height',
      title: 'Chiều cao',
      type: 'string',
      options: {
        list: [
          { title: 'Toàn màn hình', value: 'full' },
          { title: 'Vừa', value: 'medium' },
          { title: 'Thấp', value: 'short' },
        ],
      },
      initialValue: 'medium',
    }),
  ],
  preview: { select: { title: 'heading.vi', media: 'background' }, prepare: ({ title, media }) => ({ title: `Hero — ${title ?? ''}`, media }) },
})
```

```ts
// sanity/schemaTypes/sections/richTextSection.ts
import { defineType, defineField } from 'sanity'

export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Khối văn bản',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'content', title: 'Nội dung', type: 'localeBlock', validation: (r) => r.required() }),
    defineField({
      name: 'background',
      title: 'Nền',
      type: 'string',
      options: {
        list: [
          { title: 'Trắng', value: 'white' },
          { title: 'Kem', value: 'cream' },
          { title: 'Tối', value: 'ink' },
        ],
      },
      initialValue: 'white',
    }),
    defineField({ name: 'narrow', title: 'Thu hẹp chiều ngang', type: 'boolean', initialValue: true }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Văn bản — ${title ?? '(không tiêu đề)'}` }) },
})
```

```ts
// sanity/schemaTypes/sections/imageTextSection.ts
import { defineType, defineField } from 'sanity'

export const imageTextSection = defineType({
  name: 'imageTextSection',
  title: 'Khối ảnh + chữ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'eyebrow', title: 'Chữ nhỏ phía trên', type: 'localeString' }),
    defineField({ name: 'content', title: 'Nội dung', type: 'localeBlock' }),
    defineField({ name: 'image', title: 'Ảnh', type: 'figure', validation: (r) => r.required() }),
    defineField({
      name: 'imageSide',
      title: 'Ảnh nằm bên',
      type: 'string',
      options: {
        list: [
          { title: 'Trái', value: 'left' },
          { title: 'Phải', value: 'right' },
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'background',
      title: 'Nền',
      type: 'string',
      options: {
        list: [
          { title: 'Trắng', value: 'white' },
          { title: 'Kem', value: 'cream' },
          { title: 'Tối', value: 'ink' },
        ],
      },
      initialValue: 'white',
    }),
    defineField({ name: 'cta', title: 'Nút', type: 'link' }),
  ],
  preview: { select: { title: 'heading.vi', media: 'image' }, prepare: ({ title, media }) => ({ title: `Ảnh + chữ — ${title ?? ''}`, media }) },
})
```

- [ ] **Step 2: Viết cardGridSection.ts, galleryCarouselSection.ts, ctaBandSection.ts**

```ts
// sanity/schemaTypes/sections/cardGridSection.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const cardGridSection = defineType({
  name: 'cardGridSection',
  title: 'Lưới thẻ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'subheading', title: 'Tiêu đề phụ', type: 'localeString' }),
    defineField({
      name: 'cards',
      title: 'Thẻ',
      type: 'array',
      validation: (r) => r.min(1).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'card',
          fields: [
            defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
            defineField({ name: 'image', title: 'Ảnh', type: 'figure' }),
            defineField({ name: 'cta', title: 'Liên kết', type: 'link' }),
          ],
          preview: { select: { title: 'title.vi', media: 'image' } },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Số cột trên desktop',
      type: 'number',
      options: { list: [2, 3, 4] },
      initialValue: 3,
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Lưới thẻ — ${title ?? ''}` }) },
})
```

```ts
// sanity/schemaTypes/sections/galleryCarouselSection.ts
import { defineType, defineField } from 'sanity'

export const galleryCarouselSection = defineType({
  name: 'galleryCarouselSection',
  title: 'Carousel thư viện ảnh',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'album',
      title: 'Album',
      type: 'reference',
      to: [{ type: 'galleryAlbum' }],
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: 'heading.vi', album: 'album.title.vi' }, prepare: ({ title, album }) => ({ title: `Carousel — ${title ?? album ?? ''}` }) },
})
```

```ts
// sanity/schemaTypes/sections/ctaBandSection.ts
import { defineType, defineField } from 'sanity'

export const ctaBandSection = defineType({
  name: 'ctaBandSection',
  title: 'Dải kêu gọi hành động',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
    defineField({ name: 'background', title: 'Ảnh nền', type: 'figure', validation: (r) => r.required() }),
    defineField({ name: 'cta', title: 'Nút', type: 'link', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'heading.vi', media: 'background' }, prepare: ({ title, media }) => ({ title: `CTA — ${title ?? ''}`, media }) },
})
```

- [ ] **Step 3: Viết 3 block danh sách tham chiếu**

```ts
// sanity/schemaTypes/sections/roomListSection.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const roomListSection = defineType({
  name: 'roomListSection',
  title: 'Danh sách loại phòng',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'rooms',
      title: 'Phòng',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'room' }] })],
      description: 'Để trống thì hiển thị tất cả loại phòng theo thứ tự.',
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Danh sách phòng — ${title ?? ''}` }) },
})
```

```ts
// sanity/schemaTypes/sections/hallListSection.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const hallListSection = defineType({
  name: 'hallListSection',
  title: 'Danh sách phòng hội nghị',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'halls',
      title: 'Phòng hội nghị',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'hall' }] })],
      description: 'Để trống thì hiển thị tất cả.',
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Phòng hội nghị — ${title ?? ''}` }) },
})
```

```ts
// sanity/schemaTypes/sections/venueListSection.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const venueListSection = defineType({
  name: 'venueListSection',
  title: 'Danh sách nhà hàng / tiện ích',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'filterKind',
      title: 'Lọc theo loại',
      type: 'string',
      options: {
        list: [
          { title: 'Ẩm thực', value: 'dining' },
          { title: 'Tiện ích', value: 'facility' },
          { title: 'Chọn tay bên dưới', value: 'manual' },
        ],
        layout: 'radio',
      },
      initialValue: 'dining',
    }),
    defineField({
      name: 'venues',
      title: 'Chọn tay',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'venue' }] })],
      hidden: ({ parent }) => parent?.filterKind !== 'manual',
    }),
  ],
  preview: { select: { title: 'heading.vi', subtitle: 'filterKind' }, prepare: ({ title, subtitle }) => ({ title: `Venue — ${title ?? ''}`, subtitle }) },
})
```

- [ ] **Step 4: Viết mapSection.ts, tableSection.ts, faqSection.ts**

`tableSection` là block duy nhất có cấu trúc bất thường — trang Casino có bảng luật
Baccarat nhiều hàng nhiều cột. Lưu hàng dưới dạng mảng chuỗi phân tách, không dùng
type `table` của plugin để tránh thêm dependency.

```ts
// sanity/schemaTypes/sections/mapSection.ts
import { defineType, defineField } from 'sanity'

export const mapSection = defineType({
  name: 'mapSection',
  title: 'Bản đồ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'overrideCoords',
      title: 'Dùng toạ độ riêng',
      type: 'boolean',
      initialValue: false,
      description: 'Tắt thì lấy toạ độ từ Cấu hình site.',
    }),
    defineField({ name: 'lat', title: 'Vĩ độ', type: 'number', hidden: ({ parent }) => !parent?.overrideCoords }),
    defineField({ name: 'lng', title: 'Kinh độ', type: 'number', hidden: ({ parent }) => !parent?.overrideCoords }),
    defineField({ name: 'zoom', title: 'Mức phóng', type: 'number', initialValue: 15 }),
  ],
  preview: { prepare: () => ({ title: 'Bản đồ' }) },
})
```

```ts
// sanity/schemaTypes/sections/tableSection.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const tableSection = defineType({
  name: 'tableSection',
  title: 'Bảng',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({ name: 'caption', title: 'Chú thích bảng', type: 'localeString' }),
    defineField({
      name: 'headers',
      title: 'Hàng tiêu đề',
      type: 'array',
      of: [defineArrayMember({ type: 'localeString' })],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'rows',
      title: 'Các hàng',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            defineField({
              name: 'cells',
              title: 'Ô',
              type: 'array',
              of: [defineArrayMember({ type: 'localeString' })],
            }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare: ({ cells }) => ({
              title: Array.isArray(cells)
                ? cells.map((c: { vi?: string }) => c?.vi ?? '').join(' | ')
                : '',
            }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `Bảng — ${title ?? ''}` }) },
})
```

```ts
// sanity/schemaTypes/sections/faqSection.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const faqSection = defineType({
  name: 'faqSection',
  title: 'Câu hỏi thường gặp',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'items',
      title: 'Câu hỏi',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Câu hỏi', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'answer', title: 'Trả lời', type: 'localeBlock', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'question.vi' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading.vi' }, prepare: ({ title }) => ({ title: `FAQ — ${title ?? ''}` }) },
})
```

- [ ] **Step 5: Viết bookingWidgetSection.ts và leadFormSection.ts**

```ts
// sanity/schemaTypes/sections/bookingWidgetSection.ts
import { defineType, defineField } from 'sanity'

export const bookingWidgetSection = defineType({
  name: 'bookingWidgetSection',
  title: 'Widget đặt phòng',
  type: 'object',
  fields: [
    defineField({
      name: 'note',
      title: 'Ghi chú nội bộ',
      type: 'string',
      readOnly: true,
      initialValue: 'Widget SecureBookings, id lấy từ Cấu hình site.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Widget đặt phòng (SecureBookings)' }) },
})
```

```ts
// sanity/schemaTypes/sections/leadFormSection.ts
import { defineType, defineField } from 'sanity'

export const leadFormSection = defineType({
  name: 'leadFormSection',
  title: 'Form liên hệ',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Mô tả', type: 'localeText' }),
    defineField({
      name: 'formType',
      title: 'Loại form',
      type: 'string',
      options: {
        list: [
          { title: 'Tiệc cưới', value: 'wedding' },
          { title: 'Hội nghị / MICE', value: 'mice' },
          { title: 'Liên hệ chung', value: 'general' },
        ],
        layout: 'radio',
      },
      initialValue: 'general',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'successMessage', title: 'Thông báo khi gửi thành công', type: 'localeText' }),
  ],
  preview: { select: { title: 'heading.vi', subtitle: 'formType' } },
})
```

- [ ] **Step 5b: Viết postListSection.ts**

Block này là thứ làm cho `/news` và `/our-announcement` có nội dung. Thiếu nó thì hai
trang đó chỉ có hero rồi hết.

```ts
// sanity/schemaTypes/sections/postListSection.ts
import { defineType, defineField } from 'sanity'

export const postListSection = defineType({
  name: 'postListSection',
  title: 'Danh sách bài viết',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Tiêu đề', type: 'localeString' }),
    defineField({
      name: 'category',
      title: 'Chuyên mục',
      type: 'string',
      options: {
        list: [
          { title: 'Tin tức & Báo chí', value: 'news' },
          { title: 'Thông báo', value: 'announcement' },
          { title: 'Tất cả', value: 'all' },
        ],
        layout: 'radio',
      },
      initialValue: 'news',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'limit',
      title: 'Số bài tối đa',
      type: 'number',
      initialValue: 12,
      validation: (r) => r.min(1).max(50),
    }),
  ],
  preview: {
    select: { title: 'heading.vi', subtitle: 'category' },
    prepare: ({ title, subtitle }) => ({ title: `Bài viết — ${title ?? ''}`, subtitle }),
  },
})
```

- [ ] **Step 6: Viết sections/index.ts gom 15 block**

```ts
import { heroSection } from './heroSection'
import { richTextSection } from './richTextSection'
import { imageTextSection } from './imageTextSection'
import { cardGridSection } from './cardGridSection'
import { galleryCarouselSection } from './galleryCarouselSection'
import { venueListSection } from './venueListSection'
import { hallListSection } from './hallListSection'
import { roomListSection } from './roomListSection'
import { ctaBandSection } from './ctaBandSection'
import { mapSection } from './mapSection'
import { tableSection } from './tableSection'
import { bookingWidgetSection } from './bookingWidgetSection'
import { leadFormSection } from './leadFormSection'
import { faqSection } from './faqSection'
import { postListSection } from './postListSection'

export const sectionTypes = [
  heroSection,
  richTextSection,
  imageTextSection,
  cardGridSection,
  galleryCarouselSection,
  venueListSection,
  hallListSection,
  roomListSection,
  ctaBandSection,
  mapSection,
  tableSection,
  bookingWidgetSection,
  leadFormSection,
  faqSection,
  postListSection,
]

/** Tên 15 block, dùng cho field `of` của page.sections và homePage. */
export const SECTION_TYPE_NAMES = sectionTypes.map((s) => s.name)
```

- [ ] **Step 7: Viết documents/page.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'
import { SECTION_TYPE_NAMES } from '../sections'

export const page = defineType({
  name: 'page',
  title: 'Trang',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Đường dẫn', type: 'localeSlug', validation: (r) => r.required() }),
    defineField({
      name: 'sections',
      title: 'Các khối nội dung',
      type: 'array',
      of: SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { select: { title: 'title.vi', subtitle: 'slug.vi.current' } },
})
```

- [ ] **Step 8: Đăng ký vào index**

Thêm vào `sanity/schemaTypes/index.ts`:

```ts
import { sectionTypes } from './sections'
import { page } from './documents/page'
```

và nối vào mảng: `...sectionTypes, page,`

- [ ] **Step 9: Mở Studio kiểm chứng**

Run: `pnpm dev`, mở `http://localhost:3000/studio`
Tạo thử một document `Trang`, bấm thêm khối — kỳ vọng menu hiện đủ **14** loại khối.
Tạo thử một `tableSection` với 2 cột 2 hàng để chắc chắn cấu trúc lồng nhau dùng được.

- [ ] **Step 10: Commit**

```bash
git add sanity/schemaTypes
git commit -m "feat(a6): 15 section block + document page

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Singleton (siteSettings, navigation, homePage) + khoá tạo trùng

**Files:**
- Create: `sanity/schemaTypes/documents/siteSettings.ts`, `navigation.ts`, `homePage.ts`
- Modify: `sanity/schemaTypes/index.ts`, `sanity.config.ts`

**Interfaces:**
- Consumes: Task 4, 5, 6
- Produces: type name `siteSettings`, `navigation`, `homePage` — mỗi cái đúng một
  document có `_id` cố định trùng tên type.

- [ ] **Step 1: Viết siteSettings.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Cấu hình site',
  type: 'document',
  groups: [
    { name: 'brand', title: 'Thương hiệu' },
    { name: 'contact', title: 'Liên hệ' },
    { name: 'legal', title: 'Pháp lý' },
    { name: 'booking', title: 'Đặt phòng' },
  ],
  fields: [
    defineField({ name: 'brandName', title: 'Tên thương hiệu', type: 'localeString', group: 'brand', validation: (r) => r.required() }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', group: 'brand' }),
    defineField({ name: 'logoLight', title: 'Logo nền tối', type: 'image', group: 'brand' }),

    defineField({ name: 'tel', title: 'Điện thoại bàn', type: 'string', group: 'contact' }),
    defineField({ name: 'mobile', title: 'Di động', type: 'string', group: 'contact' }),
    defineField({ name: 'hotline', title: 'Hotline', type: 'string', group: 'contact' }),
    defineField({
      name: 'emails',
      title: 'Email',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'contact',
    }),
    defineField({ name: 'addressShort', title: 'Địa chỉ ngắn', type: 'localeString', group: 'contact' }),
    defineField({ name: 'addressFull', title: 'Địa chỉ đầy đủ', type: 'localeText', group: 'contact' }),
    defineField({ name: 'lat', title: 'Vĩ độ', type: 'number', group: 'contact', initialValue: 20.9538 }),
    defineField({ name: 'lng', title: 'Kinh độ', type: 'number', group: 'contact', initialValue: 107.0435 }),
    defineField({ name: 'mapZoom', title: 'Mức phóng bản đồ', type: 'number', group: 'contact', initialValue: 15 }),
    defineField({
      name: 'socials',
      title: 'Mạng xã hội',
      type: 'array',
      group: 'contact',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'social',
          fields: [
            defineField({
              name: 'platform',
              title: 'Nền tảng',
              type: 'string',
              options: { list: ['facebook', 'instagram', 'tripadvisor', 'x', 'youtube'] },
            }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),

    defineField({ name: 'companyName', title: 'Tên công ty', type: 'localeString', group: 'legal' }),
    defineField({ name: 'businessLicense', title: 'GCN ĐKDN', type: 'string', group: 'legal' }),
    defineField({ name: 'licenseIssuer', title: 'Nơi cấp', type: 'localeString', group: 'legal' }),
    defineField({ name: 'licenseDate', title: 'Ngày cấp', type: 'date', group: 'legal' }),
    defineField({ name: 'motBadge', title: 'Badge Bộ Công Thương', type: 'image', group: 'legal' }),
    defineField({ name: 'motBadgeUrl', title: 'Link xác thực badge', type: 'url', group: 'legal' }),
    defineField({ name: 'copyright', title: 'Dòng bản quyền', type: 'localeString', group: 'legal' }),

    defineField({
      name: 'secureBookingsWidgetId',
      title: 'ID widget SecureBookings',
      type: 'string',
      group: 'booking',
      description: 'Lấy từ URL widgetCustomize?...&id=<đây>',
    }),
  ],
  preview: { prepare: () => ({ title: 'Cấu hình site' }) },
})
```

Toạ độ mặc định 20.9538 / 107.0435 là Bãi Cháy, Hạ Long — đặt sẵn để bản đồ không
trỏ ra giữa biển khi chưa ai nhập.

- [ ] **Step 2: Viết navigation.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'

const navItem = defineArrayMember({
  type: 'object',
  name: 'navItem',
  fields: [
    defineField({ name: 'label', title: 'Nhãn', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'link', title: 'Liên kết', type: 'link' }),
    defineField({
      name: 'children',
      title: 'Mục con',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navChild',
          fields: [
            defineField({ name: 'label', title: 'Nhãn', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'link', title: 'Liên kết', type: 'link' }),
          ],
          preview: { select: { title: 'label.vi' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'label.vi' } },
})

export const navigation = defineType({
  name: 'navigation',
  title: 'Menu điều hướng',
  type: 'document',
  fields: [
    defineField({
      name: 'header',
      title: 'Menu đầu trang',
      type: 'array',
      of: [navItem],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Cột chân trang',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({ name: 'title', title: 'Tiêu đề cột', type: 'localeString' }),
            defineField({
              name: 'links',
              title: 'Liên kết',
              type: 'array',
              of: [defineArrayMember({ type: 'link' })],
            }),
          ],
          preview: { select: { title: 'title.vi' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Menu điều hướng' }) },
})
```

- [ ] **Step 3: Viết homePage.ts**

```ts
import { defineType, defineField, defineArrayMember } from 'sanity'
import { SECTION_TYPE_NAMES } from '../sections'

export const homePage = defineType({
  name: 'homePage',
  title: 'Trang chủ',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'localeString', validation: (r) => r.required() }),
    defineField({
      name: 'sections',
      title: 'Các khối nội dung',
      type: 'array',
      of: SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
    }),
    defineField({
      name: 'testimonials',
      title: 'Cảm nhận khách hàng',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Trang chủ' }) },
})
```

Trang chủ dùng chung 14 block với `page` thay vì có field riêng cho từng khối —
ít schema hơn, và biên tập viên sắp xếp lại thứ tự được.

- [ ] **Step 4: Đăng ký vào index**

Thêm vào `sanity/schemaTypes/index.ts`:

```ts
import { siteSettings } from './documents/siteSettings'
import { navigation } from './documents/navigation'
import { homePage } from './documents/homePage'
```

nối vào mảng: `siteSettings, navigation, homePage,`

- [ ] **Step 5: Chặn tạo trùng singleton trong sanity.config.ts**

Thêm `document.actions` và `document.newDocumentOptions` vào `defineConfig`:

```ts
const SINGLETON_TYPES = new Set(['siteSettings', 'navigation', 'homePage'])

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  document: {
    // Không cho tạo singleton mới từ nút "Create"
    newDocumentOptions: (prev) =>
      prev.filter((item) => !SINGLETON_TYPES.has(item.templateId)),
    // Không cho xoá hay nhân bản singleton
    actions: (prev, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? prev.filter(({ action }) => action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
```

Giữ nguyên các import đã có ở Task 3, chỉ thêm hằng `SINGLETON_TYPES` và khối `document`.

- [ ] **Step 6: Kiểm chứng trong Studio**

Run: `pnpm dev`, mở `/studio`.
Kỳ vọng:
- 3 mục singleton ở đầu sidebar mở được, sửa và lưu được.
- Nút "Create" **không** liệt kê Cấu hình site / Menu điều hướng / Trang chủ.
- Mở Cấu hình site → menu ⋮ **không** có "Delete" và "Duplicate".
- Các type còn lại (Loại phòng, Bài viết, …) vẫn tạo/xoá bình thường.

- [ ] **Step 7: Nhập tay một bản ghi thật để kiểm chứng end-to-end**

Trong Studio, tạo một `Loại phòng`:
- Tên phòng (vi): `PHÒNG DELUXE`
- Đường dẫn (vi): `deluxe`
- Nhóm: Phòng khách sạn
- Diện tích: `39`
- Ảnh đại diện: upload bất kỳ ảnh nào từ `wp-content/uploads/2023/04/`
- Thêm 2 tiện nghi với nhãn `Diện tích: 39 m2` và `Wifi`

Lưu. Kỳ vọng lưu thành công, không lỗi validation. Đây là bằng chứng schema dùng được
trước khi plan B tự động hoá.

- [ ] **Step 8: Chạy toàn bộ test và build**

Run: `pnpm test && pnpm build`
Expected: test PASS (7 test của Task 2), build thành công.

- [ ] **Step 9: Commit**

```bash
git add sanity sanity.config.ts
git commit -m "feat(a7): singleton siteSettings/navigation/homePage + khoá tạo trùng

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Hoàn thành Plan A

Sau task 7:
- `pnpm dev` → `/studio` chạy, đăng nhập được, schema đầy đủ 11 document type + 15 block.
- Biên tập viên nhập tay được toàn bộ nội dung nếu muốn.
- `pnpm build` và `pnpm test` xanh.
- Trang public duy nhất là `/` (trang kiểm chứng token của Task 1) — plan C thay nó.

**Tiếp theo:** Plan B (`2026-09-14-b-import-noi-dung.md`) đổ 22 trang + 213 ảnh vào Sanity.
Plan B **phải chạy xong trước lần build đầu tiên của plan C**, vì `cacheComponents: true`
bắt `generateStaticParams` trả ít nhất một param.
