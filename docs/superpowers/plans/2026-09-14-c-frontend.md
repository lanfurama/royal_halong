# Plan C — Frontend: routing, layout, section, SEO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng toàn bộ trang public song ngữ từ dữ liệu Sanity, giữ nguyên 22 URL gốc, đạt tiêu chí a11y và performance trong spec.

**Architecture:** Một catch-all `app/[lang]/[slug]/page.tsx` resolve slug → document → dispatch theo `_type`. Trang chủ riêng ở `app/[lang]/page.tsx`. Mọi khối nội dung render qua `SectionRenderer` ánh xạ `_type` → component.

**Tech Stack:** Next.js 16.3.5, React 19.3.0, Tailwind 4.3.3, next-sanity 13.3.4, embla-carousel-react 8.6.0, yet-another-react-lightbox 3.32.2, react-leaflet 5.0.0, Playwright 1.63.0.

**Spec:** `docs/superpowers/specs/2026-09-14-nextjs-sanity-migration-design.md`

## Global Constraints

- Plan A và **Plan B phải chạy xong** — `cacheComponents: true` bắt `generateStaticParams`
  trả ≥ 1 param, nên Sanity phải có dữ liệu trước lần build đầu.
- **Giữ nguyên 22 slug gốc.** Không "dọn" slug cho đẹp — đó là URL đang được Google index.
- `params` là Promise, phải `await`. Dùng `PageProps<'/[lang]/[slug]'>`, không tự khai type.
- **Không thêm `'use cache'`** ở chỗ gọi — `cachedSanity` trong `sanity/lib/live.ts` đã là
  ranh giới duy nhất.
- Quy tắc màu chữ (đo thật, xem spec mục 7):
  - chữ nhỏ vàng trên nền sáng → `text-gold-text`
  - heading ≥ 24px trên nền sáng → `text-gold-deep`
  - `gold` / `gold-hi` / `sky` / `peach` **chỉ** làm nền, viền, icon, hoặc chữ trên nền tối
  - nút nền `bg-gold` → chữ `text-ink`, **không** dùng `text-white`
- Mọi `<img>` phải có `alt` lấy từ `figure.alt`; ảnh trang trí thuần thì `alt=""`.
- Component mặc định là Server Component. Chỉ thêm `'use client'` khi thật cần
  (carousel, lightbox, menu mobile, bản đồ, form).

---

### Task 1: Query GROQ + hàm đọc dữ liệu

**Files:**
- Create: `sanity/lib/queries.ts`, `sanity/lib/fetchers.ts`
- Test: `tests/unit/queries.test.ts`

**Interfaces:**
- Consumes: Plan A Task 3 (`cachedSanity`, `cachedSanityStaticParams`)
- Produces:
  - `queries.ts` → `ALL_ROUTES_QUERY`, `DOC_BY_SLUG_QUERY`, `HOME_QUERY`,
    `SITE_SETTINGS_QUERY`, `NAVIGATION_QUERY`, `POSTS_BY_CATEGORY_QUERY`,
    `ROOMS_QUERY`, `VENUES_BY_KIND_QUERY`, `HALLS_QUERY`
  - `fetchers.ts` → `getAllRoutes()`, `getDocBySlug(slug)`, `getHome()`,
    `getSiteSettings()`, `getNavigation()`

- [ ] **Step 1: Viết test thất bại cho hình dạng query**

Test này giữ cho GROQ không âm thầm rơi field khi ai đó sửa.

```ts
// tests/unit/queries.test.ts
import { describe, it, expect } from 'vitest'
import {
  ALL_ROUTES_QUERY,
  DOC_BY_SLUG_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries'

describe('ALL_ROUTES_QUERY', () => {
  it('gom slug của cả 4 loại document có URL riêng', () => {
    for (const type of ['page', 'room', 'post', 'offer']) {
      expect(ALL_ROUTES_QUERY).toContain(`_type == "${type}"`)
    }
  })

  it('lấy slug cả hai ngôn ngữ', () => {
    expect(ALL_ROUTES_QUERY).toContain('slug.vi.current')
    expect(ALL_ROUTES_QUERY).toContain('slug.en.current')
  })
})

describe('DOC_BY_SLUG_QUERY', () => {
  it('khớp slug theo cả vi và en', () => {
    expect(DOC_BY_SLUG_QUERY).toContain('slug.vi.current == $slug')
    expect(DOC_BY_SLUG_QUERY).toContain('slug.en.current == $slug')
  })

  it('mở tham chiếu album trong galleryCarouselSection', () => {
    expect(DOC_BY_SLUG_QUERY).toContain('_type == "galleryCarouselSection"')
    expect(DOC_BY_SLUG_QUERY).toContain('album->')
  })

  it('resolve bài viết cho postListSection — nếu thiếu thì /news rỗng', () => {
    expect(DOC_BY_SLUG_QUERY).toContain('_type == "postListSection"')
    expect(DOC_BY_SLUG_QUERY).toContain('publishedAt desc')
  })
})

describe('SITE_SETTINGS_QUERY', () => {
  it('đọc singleton theo _id cố định', () => {
    expect(SITE_SETTINGS_QUERY).toContain('_id == "siteSettings"')
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/queries.test.ts`
Expected: FAIL — module chưa tồn tại.

- [ ] **Step 3: Viết sanity/lib/queries.ts**

```ts
import { defineQuery } from 'next-sanity'

const IMAGE = `{ ..., asset->{ _id, url, metadata { dimensions, lqip } } }`

const LINK = `{
  kind,
  label,
  blank,
  href,
  "internalSlug": reference->slug
}`

/** Mở đủ tham chiếu cho 14 loại section. */
// `background` CHỈ là ảnh (heroSection, ctaBandSection). Nền màu của
// richTextSection/imageTextSection là field riêng tên `tone` (chuỗi enum) —
// hai thứ này từng trùng tên, và projection ảnh bên dưới sẽ phá giá trị chuỗi
// nếu ai đó đặt lại tên cho trùng.
const SECTIONS = `sections[]{
  ...,
  background ${IMAGE},
  image ${IMAGE},
  cta ${LINK},
  cards[]{ ..., image ${IMAGE}, cta ${LINK} },
  _type == "galleryCarouselSection" => { album-> { _id, title, images[] ${IMAGE} } },
  _type == "roomListSection" => {
    "resolved": select(
      count(rooms) > 0 => rooms[]->,
      *[_type == "room"] | order(order asc)
    ){ _id, title, slug, summary, areaSqm, capacity, view, heroImage ${IMAGE} }
  },
  _type == "hallListSection" => {
    "resolved": select(
      count(halls) > 0 => halls[]->,
      *[_type == "hall"] | order(order asc)
    ){ _id, name, slug, areaSqm, capacity, image ${IMAGE} }
  },
  _type == "postListSection" => {
    "resolved": *[
      _type == "post" && (^.category == "all" || category == ^.category)
    ] | order(publishedAt desc) [0...50]{
      _id, title, slug, excerpt, publishedAt, coverImage ${IMAGE}
    }
  },
  _type == "venueListSection" => {
    "resolved": select(
      filterKind == "manual" => venues[]->,
      *[_type == "venue" && kind == ^.filterKind] | order(order asc)
    ){ _id, name, slug, location, capacity, hours, highlights, menuUrl, phone, description, image ${IMAGE} }
  }
}`

// Ghi chú: `postListSection` lấy cận trên cố định 50 rồi để component cắt theo
// `limit`. Cố nhét `coalesce(^.limit, 12)` vào slice GROQ là chỗ dễ vỡ — slice
// nhận biểu thức tham chiếu scope cha không đáng tin, và 50 bài là thừa sức cho
// một site khách sạn.

export const ALL_ROUTES_QUERY = defineQuery(`
*[
  (_type == "page" || _type == "room" || _type == "post" || _type == "offer")
  && defined(slug.vi.current)
]{
  _type,
  "vi": slug.vi.current,
  "en": slug.en.current
}
`)

export const DOC_BY_SLUG_QUERY = defineQuery(`
*[
  (_type == "page" || _type == "room" || _type == "post" || _type == "offer")
  && (slug.vi.current == $slug || slug.en.current == $slug)
][0]{
  ...,
  heroImage ${IMAGE},
  coverImage ${IMAGE},
  image ${IMAGE},
  gallery[] ${IMAGE},
  features[]{ ..., icon ${IMAGE} },
  seo{ ..., ogImage ${IMAGE} },
  ${SECTIONS}
}
`)

export const HOME_QUERY = defineQuery(`
*[_id == "homePage"][0]{
  ...,
  seo{ ..., ogImage ${IMAGE} },
  testimonials[]->,
  ${SECTIONS}
}
`)

export const SITE_SETTINGS_QUERY = defineQuery(`
*[_id == "siteSettings"][0]{
  ...,
  logo ${IMAGE},
  logoLight ${IMAGE},
  motBadge ${IMAGE}
}
`)

export const NAVIGATION_QUERY = defineQuery(`
*[_id == "navigation"][0]{
  header[]{ label, link ${LINK}, children[]{ label, link ${LINK} } },
  footerColumns[]{ title, links[] ${LINK} }
}
`)

export const POSTS_BY_CATEGORY_QUERY = defineQuery(`
*[_type == "post" && category == $category] | order(publishedAt desc){
  _id, title, slug, excerpt, publishedAt, coverImage ${IMAGE}
}
`)

export const ROOMS_QUERY = defineQuery(`
*[_type == "room"] | order(order asc){
  _id, title, slug, summary, areaSqm, capacity, view, heroImage ${IMAGE}
}
`)

export const VENUES_BY_KIND_QUERY = defineQuery(`
*[_type == "venue" && kind == $kind] | order(order asc){
  _id, name, slug, location, capacity, hours, highlights, menuUrl, phone, image ${IMAGE}
}
`)

export const HALLS_QUERY = defineQuery(`
*[_type == "hall"] | order(order asc){
  _id, name, slug, areaSqm, capacity, description, image ${IMAGE}
}
`)
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/queries.test.ts`
Expected: PASS, 6 test.

- [ ] **Step 5: Viết sanity/lib/fetchers.ts**

```ts
import { cachedSanity, cachedSanityStaticParams } from './live'
import {
  ALL_ROUTES_QUERY,
  DOC_BY_SLUG_QUERY,
  HOME_QUERY,
  SITE_SETTINGS_QUERY,
  NAVIGATION_QUERY,
} from './queries'

export async function getAllRoutes() {
  const { data } = await cachedSanityStaticParams({ query: ALL_ROUTES_QUERY })
  return data ?? []
}

/**
 * `defineLive({ strict: true })` bắt MỌI lời gọi `cachedSanity` phải khai
 * `perspective` và `stega`. Thiếu là hỏng typecheck, và hỏng cả lúc chạy.
 * Gói lại một chỗ để không chỗ gọi nào quên.
 */
const PUBLISHED = { perspective: 'published', stega: false } as const

export async function getDocBySlug(slug: string) {
  const { data } = await cachedSanity({
    query: DOC_BY_SLUG_QUERY,
    params: { slug },
    ...PUBLISHED,
  })
  return data
}

export async function getHome() {
  const { data } = await cachedSanity({ query: HOME_QUERY, ...PUBLISHED })
  return data
}

export async function getSiteSettings() {
  const { data } = await cachedSanity({ query: SITE_SETTINGS_QUERY, ...PUBLISHED })
  return data
}

export async function getNavigation() {
  const { data } = await cachedSanity({ query: NAVIGATION_QUERY, ...PUBLISHED })
  return data
}
```

- [ ] **Step 6: Commit**

```bash
git add sanity/lib/queries.ts sanity/lib/fetchers.ts tests/unit/queries.test.ts
git commit -m "feat(c1): query GROQ + fetcher, mở tham chiếu cho 14 section

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Middleware locale + routing khung

**Files:**
- Create: `middleware.ts`, `lib/routes.ts`
- Create: `app/[lang]/layout.tsx`, `app/[lang]/page.tsx`, `app/[lang]/not-found.tsx`
- Create: `app/[lang]/[slug]/page.tsx`
- Delete: `app/page.tsx` (trang kiểm chứng token của Plan A Task 1)
- Test: `tests/unit/routes.test.ts`

**Interfaces:**
- Consumes: Task 1 (fetchers), Plan A Task 2 (`lib/i18n.ts`)
- Produces:
  - `lib/routes.ts` → `hrefFor(lang, slugField): string`, `resolveSlug(doc, lang): string`
  - Route `/vi`, `/en`, `/vi/[slug]`, `/en/[slug]` chạy được

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/unit/routes.test.ts
import { describe, it, expect } from 'vitest'
import { hrefFor, resolveSlug } from '@/lib/routes'

describe('resolveSlug()', () => {
  it('dùng slug của locale khi có', () => {
    expect(resolveSlug({ vi: { current: 'luu-tru' }, en: { current: 'stay' } }, 'en')).toBe('stay')
  })

  it('fallback về slug vi khi locale chưa có slug riêng', () => {
    expect(resolveSlug({ vi: { current: 'casino' } }, 'en')).toBe('casino')
    expect(resolveSlug({ vi: { current: 'casino' }, en: { current: '' } }, 'en')).toBe('casino')
  })

  it('trả undefined khi không có slug nào', () => {
    expect(resolveSlug(undefined, 'vi')).toBeUndefined()
  })
})

describe('hrefFor()', () => {
  it('ghép đường dẫn có prefix locale', () => {
    expect(hrefFor('vi', { vi: { current: 'casino' } })).toBe('/vi/casino')
    expect(hrefFor('en', { vi: { current: 'casino' } })).toBe('/en/casino')
  })

  it('slug rỗng ra trang chủ của locale', () => {
    expect(hrefFor('vi', undefined)).toBe('/vi')
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/routes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Viết lib/routes.ts**

```ts
import { DEFAULT_LOCALE, type Locale } from './i18n'

export interface SlugField {
  vi?: { current?: string | null } | null
  en?: { current?: string | null } | null
}

export function resolveSlug(
  slug: SlugField | null | undefined,
  locale: Locale,
): string | undefined {
  if (!slug) return undefined
  const own = slug[locale]?.current
  if (own && own.trim() !== '') return own
  const fallback = slug[DEFAULT_LOCALE]?.current
  return fallback && fallback.trim() !== '' ? fallback : undefined
}

export function hrefFor(locale: Locale, slug: SlugField | null | undefined): string {
  const resolved = resolveSlug(slug, locale)
  return resolved ? `/${locale}/${resolved}` : `/${locale}`
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/routes.test.ts`
Expected: PASS, 5 test.

- [ ] **Step 5: Viết middleware.ts**

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { LOCALES, DEFAULT_LOCALE } from './lib/i18n'

const SKIP = /^\/(?:studio|api|_next|favicon\.ico|robots\.txt|sitemap\.xml)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (SKIP.test(pathname)) return NextResponse.next()

  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  )
  if (hasLocale) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
```

Redirect chứ không rewrite: URL cũ không có prefix (`/casino`) sẽ 308 sang `/vi/casino`,
giữ được link cũ mà vẫn có một URL chuẩn duy nhất cho SEO.

- [ ] **Step 6: Xoá trang kiểm chứng token và viết app/[lang]/layout.tsx**

```bash
rm app/page.tsx
```

```tsx
// app/[lang]/layout.tsx
import { notFound } from 'next/navigation'
import { isLocale, LOCALES } from '@/lib/i18n'
import { getNavigation, getSiteSettings } from '@/sanity/lib/fetchers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export default async function LangLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()])

  return (
    <>
      <Header lang={lang} navigation={navigation} settings={settings} />
      <main id="main">{children}</main>
      <Footer lang={lang} navigation={navigation} settings={settings} />
    </>
  )
}
```

`<html lang>` vẫn ở root layout — cập nhật ở Task 7 khi làm SEO.

- [ ] **Step 7: Viết app/[lang]/[slug]/page.tsx**

```tsx
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { getAllRoutes, getDocBySlug } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { RoomPage } from '@/components/pages/RoomPage'
import { PostPage } from '@/components/pages/PostPage'
import { OfferPage } from '@/components/pages/OfferPage'

export async function generateStaticParams() {
  const routes = await getAllRoutes()
  const params: { lang: string; slug: string }[] = []
  for (const route of routes) {
    if (route.vi) params.push({ lang: 'vi', slug: route.vi })
    params.push({ lang: 'en', slug: route.en || route.vi })
  }
  // cacheComponents bắt buộc trả ít nhất một param.
  if (params.length === 0) {
    throw new Error(
      'Sanity chưa có document nào có slug. Chạy `pnpm run import:all` (Plan B) trước khi build.',
    )
  }
  return params
}

export default async function DynamicPage({ params }: PageProps<'/[lang]/[slug]'>) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()

  const doc = await getDocBySlug(slug)
  if (!doc) notFound()

  switch (doc._type) {
    case 'room':
      return <RoomPage doc={doc} lang={lang} />
    case 'post':
      return <PostPage doc={doc} lang={lang} />
    case 'offer':
      return <OfferPage doc={doc} lang={lang} />
    default:
      return <SectionRenderer sections={doc.sections ?? []} lang={lang} />
  }
}
```

- [ ] **Step 8: Viết app/[lang]/page.tsx và not-found.tsx**

```tsx
// app/[lang]/page.tsx
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'
import { getHome } from '@/sanity/lib/fetchers'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const home = await getHome()
  if (!home) notFound()

  return <SectionRenderer sections={home.sections ?? []} lang={lang} />
}
```

```tsx
// app/[lang]/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <h1 className="font-display text-gold-deep text-4xl">Không tìm thấy trang</h1>
      <p className="mt-4">Trang bạn tìm không tồn tại hoặc đã được chuyển đi.</p>
      <Link href="/vi" className="bg-gold text-ink mt-8 inline-block px-6 py-3 font-medium">
        Về trang chủ
      </Link>
    </div>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add middleware.ts lib/routes.ts app tests/unit/routes.test.ts
git rm --cached app/page.tsx 2>/dev/null || true
git commit -m "feat(c2): middleware locale + catch-all [lang]/[slug] giữ nguyên URL gốc

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Nguyên liệu UI dùng chung

**Files:**
- Create: `components/ui/SanityImage.tsx`, `PortableText.tsx`, `Reveal.tsx`,
  `Container.tsx`, `Button.tsx`, `SmartLink.tsx`

**Interfaces:**
- Consumes: Plan A (`lib/i18n.ts`, `sanity/lib/image.ts`), Task 2 (`lib/routes.ts`)
- Produces:
  - `<SanityImage image lang sizes priority className />`
  - `<RichText value lang />`
  - `<Reveal>` — bọc con, hiện dần khi cuộn tới
  - `<Container size="default" | "narrow" | "wide">`
  - `<Button href variant="solid" | "outline" | "ghost">`
  - `<SmartLink link lang>` — nhận object `link` của Sanity

- [ ] **Step 1: Viết components/ui/SanityImage.tsx**

```tsx
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { t, type Locale } from '@/lib/i18n'

interface Props {
  image: any
  lang: Locale
  sizes: string
  priority?: boolean
  className?: string
  /** Ảnh thuần trang trí — alt rỗng để screen reader bỏ qua. */
  decorative?: boolean
}

export function SanityImage({ image, lang, sizes, priority, className, decorative }: Props) {
  if (!image?.asset) return null

  const dimensions = image.asset.metadata?.dimensions
  const alt = decorative ? '' : (t(image.alt, lang) ?? '')

  return (
    <Image
      src={urlFor(image).url()}
      alt={alt}
      width={dimensions?.width ?? 1600}
      height={dimensions?.height ?? 1067}
      sizes={sizes}
      priority={priority}
      placeholder={image.asset.metadata?.lqip ? 'blur' : undefined}
      blurDataURL={image.asset.metadata?.lqip}
      className={className}
    />
  )
}
```

`width`/`height` thật từ `metadata.dimensions` là thứ giữ CLS ≈ 0 — không bỏ.

- [ ] **Step 2: Cài và viết components/ui/PortableText.tsx**

```bash
pnpm add @portabletext/react@8.0.1
```

```tsx
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    h2: ({ children }) => (
      <h2 className="font-display text-gold-deep mt-10 mb-4 text-3xl">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display text-gold-deep mt-8 mb-3 text-2xl">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-ink mt-6 mb-2 text-lg font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-gold my-6 border-l-4 pl-5 italic">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>,
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href ?? '#'
      const external = /^https?:\/\//.test(href)
      return external ? (
        <a
          href={href}
          target={value?.blank ? '_blank' : undefined}
          rel={value?.blank ? 'noopener noreferrer' : undefined}
          className="text-gold-text underline underline-offset-2"
        >
          {children}
        </a>
      ) : (
        <Link href={href} className="text-gold-text underline underline-offset-2">
          {children}
        </Link>
      )
    },
  },
}

export function RichText({ value, lang }: { value: any; lang: Locale }) {
  const blocks = t<any[]>(value, lang)
  if (!blocks || blocks.length === 0) return null
  return <PortableText value={blocks} components={components} />
}
```

Link trong bài dùng `text-gold-text` (5.32:1) chứ không `text-gold` — chữ nhỏ trên nền sáng.

- [ ] **Step 3: Viết components/ui/Container.tsx và Button.tsx**

```tsx
// components/ui/Container.tsx
const SIZES = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
} as const

export function Container({
  size = 'default',
  className = '',
  children,
}: {
  size?: keyof typeof SIZES
  className?: string
  children: React.ReactNode
}) {
  return <div className={`mx-auto px-6 ${SIZES[size]} ${className}`}>{children}</div>
}
```

```tsx
// components/ui/Button.tsx
import Link from 'next/link'

const VARIANTS = {
  // nền gold + chữ ink = 6.66:1. KHÔNG đổi sang chữ trắng (chỉ 2.97:1).
  // Vòng focus phải khác nhau theo variant: `outline-gold-deep` trên nền gold
  // chỉ đạt 1.30:1, trượt WCAG 2.2 SC 1.4.11 (cần 3:1 cho chỉ báo focus).
  // Trên nền gold dùng `outline-ink` (6.66:1).
  solid: 'bg-gold text-ink hover:bg-gold-hi focus-visible:outline-ink',
  outline: 'border border-gold-deep text-gold-text hover:bg-cream focus-visible:outline-gold-deep',
  ghost: 'text-gold-text hover:underline focus-visible:outline-gold-deep',
} as const

export function Button({
  href,
  variant = 'solid',
  children,
  className = '',
}: {
  href: string
  variant?: keyof typeof VARIANTS
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`inline-block px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
```

- [ ] **Step 4: Viết components/ui/SmartLink.tsx**

```tsx
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { hrefFor } from '@/lib/routes'

export function SmartLink({
  link,
  lang,
  className,
  children,
}: {
  link: any
  lang: Locale
  className?: string
  children?: React.ReactNode
}) {
  if (!link) return null
  const label = children ?? t(link.label, lang) ?? ''

  if (link.kind === 'external' && link.href) {
    return (
      <a
        href={link.href}
        target={link.blank ? '_blank' : undefined}
        rel={link.blank ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {label}
      </a>
    )
  }

  return (
    <Link href={hrefFor(lang, link.internalSlug)} className={className}>
      {label}
    </Link>
  )
}
```

- [ ] **Step 5: Viết components/ui/Reveal.tsx**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Hiện dần khi cuộn tới. Thay cho anime.js + waypoints của bản gốc.
 * Tôn trọng prefers-reduced-motion: người dùng tắt chuyển động thì hiện ngay.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShown(true)
      return
    }
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui package.json pnpm-lock.yaml
git commit -m "feat(c3): nguyên liệu UI — SanityImage, RichText, Reveal, Button, SmartLink

Button dùng chữ ink trên nền gold (6.66:1), link dùng gold-text (5.32:1).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Header, Footer, chuyển ngôn ngữ, menu mobile

**Files:**
- Create: `components/layout/Header.tsx`, `Footer.tsx`, `MobileMenu.tsx`, `LangSwitcher.tsx`

**Interfaces:**
- Consumes: Task 1 (navigation/settings), Task 3 (UI)
- Produces: `<Header lang navigation settings />`, `<Footer lang navigation settings />`

- [ ] **Step 1: Viết components/layout/LangSwitcher.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n'

export function LangSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 text-xs tracking-wider uppercase">
      {LOCALES.map((locale) => {
        const href = pathname.replace(new RegExp(`^/${lang}`), `/${locale}`)
        const active = locale === lang
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={active ? 'true' : undefined}
            className={active ? 'text-gold-hi font-semibold' : 'text-white/70 hover:text-white'}
          >
            {locale.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}
```

Chỉ đổi prefix locale, giữ nguyên slug. Slug EN riêng (nếu có) sẽ được xử lý ở Task 7
khi sinh `hreflang` — ở đây giữ đơn giản vì đa số trang dùng chung slug.

- [ ] **Step 2: Viết components/layout/MobileMenu.tsx**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { SmartLink } from '@/components/ui/SmartLink'
import { t, type Locale } from '@/lib/i18n'

export function MobileMenu({ lang, items }: { lang: Locale; items: any[] }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Đóng bằng Escape và khoá cuộn nền khi mở.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  // Giữ focus trong panel khi đang mở.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const focusables = panel.querySelectorAll<HTMLElement>('a, button')
    focusables[0]?.focus()

    const onTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener('keydown', onTab)
    return () => panel.removeEventListener('keydown', onTab)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="p-2 text-white lg:hidden"
      >
        <span className="sr-only">Mở menu</span>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="bg-ink fixed inset-0 z-50 overflow-y-auto p-6"
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            buttonRef.current?.focus()
          }}
          className="mb-8 ml-auto block p-2 text-white"
        >
          <span className="sr-only">Đóng menu</span>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <nav aria-label="Menu chính">
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={index}>
                <SmartLink
                  link={item.link}
                  lang={lang}
                  className="text-gold-hi block py-3 text-lg tracking-wide uppercase"
                >
                  {t(item.label, lang)}
                </SmartLink>
                {item.children?.length > 0 && (
                  <ul className="mb-2 ml-4 space-y-1">
                    {item.children.map((child: any, childIndex: number) => (
                      <li key={childIndex}>
                        <SmartLink
                          link={child.link}
                          lang={lang}
                          className="block py-2 text-sm text-white/80"
                        >
                          {t(child.label, lang)}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
```

Dùng `hidden` chứ không `style.display` — root reset của artifact/Next đặt
`[hidden]{display:none}` và `hidden` cũng ẩn khỏi cây accessibility.

- [ ] **Step 3: Viết components/layout/Header.tsx**

```tsx
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { Container } from '@/components/ui/Container'
import { MobileMenu } from './MobileMenu'
import { LangSwitcher } from './LangSwitcher'

export function Header({
  lang,
  navigation,
  settings,
}: {
  lang: Locale
  navigation: any
  settings: any
}) {
  const items: any[] = navigation?.header ?? []

  return (
    <header className="bg-ink sticky top-0 z-40 text-white">
      <a
        href="#main"
        className="focus:bg-gold focus:text-ink sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
      >
        Bỏ qua điều hướng
      </a>

      <Container size="wide" className="flex items-center justify-between py-4">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          {settings?.logoLight ? (
            <SanityImage
              image={settings.logoLight}
              lang={lang}
              sizes="120px"
              priority
              className="h-10 w-auto"
            />
          ) : (
            <span className="font-display text-gold-hi text-lg">
              {t(settings?.brandName, lang)}
            </span>
          )}
        </Link>

        <nav aria-label="Menu chính" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {items.map((item, index) => (
              <li key={index} className="group relative">
                <SmartLink
                  link={item.link}
                  lang={lang}
                  className="hover:text-gold-hi py-2 text-xs tracking-widest uppercase transition-colors"
                >
                  {t(item.label, lang)}
                </SmartLink>
                {item.children?.length > 0 && (
                  <ul className="bg-ink invisible absolute top-full left-0 min-w-56 py-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {item.children.map((child: any, childIndex: number) => (
                      <li key={childIndex}>
                        <SmartLink
                          link={child.link}
                          lang={lang}
                          className="hover:text-gold-hi block px-4 py-2 text-xs tracking-wide uppercase"
                        >
                          {t(child.label, lang)}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <LangSwitcher lang={lang} />
          <MobileMenu lang={lang} items={items} />
        </div>
      </Container>
    </header>
  )
}
```

`group-focus-within` bên cạnh `group-hover` để menu con mở được bằng bàn phím.

- [ ] **Step 4: Viết components/layout/Footer.tsx**

```tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'
import { SanityImage } from '@/components/ui/SanityImage'

export function Footer({
  lang,
  navigation,
  settings,
}: {
  lang: Locale
  navigation: any
  settings: any
}) {
  const columns: any[] = navigation?.footerColumns ?? []

  return (
    <footer className="bg-gold text-ink mt-20">
      <Container size="wide" className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="font-display mb-4 text-xl">{t(settings?.companyName, lang)}</h2>
            <address className="space-y-1 text-sm not-italic">
              <p>{t(settings?.addressShort, lang)}</p>
              {settings?.tel && (
                <p>
                  Tel: <a href={`tel:${settings.tel.replace(/\s/g, '')}`}>{settings.tel}</a>
                </p>
              )}
              {settings?.mobile && (
                <p>
                  Mobile:{' '}
                  <a href={`tel:${settings.mobile.replace(/\s/g, '')}`}>{settings.mobile}</a>
                </p>
              )}
              {settings?.emails?.map((email: string) => (
                <p key={email}>
                  <a href={`mailto:${email}`} className="underline underline-offset-2">
                    {email}
                  </a>
                </p>
              ))}
            </address>
          </div>

          {columns.map((column, index) => (
            <nav key={index} aria-label={t(column.title, lang) ?? undefined}>
              <h2 className="mb-4 text-xs font-semibold tracking-widest uppercase">
                {t(column.title, lang)}
              </h2>
              <ul className="space-y-2 text-sm">
                {column.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <SmartLink link={link} lang={lang} className="hover:underline" />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-ink/20 mt-12 border-t pt-8 text-xs leading-relaxed">
          <p className="font-semibold">{t(settings?.brandName, lang)}</p>
          <p>{t(settings?.addressFull, lang)}</p>
          {settings?.businessLicense && (
            <p>
              GCN ĐKDN: {settings.businessLicense}
              {settings.licenseIssuer ? ` — ${t(settings.licenseIssuer, lang)}` : ''}
            </p>
          )}
          {settings?.hotline && <p>Hotline: {settings.hotline}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {settings?.motBadge && settings?.motBadgeUrl && (
              <a href={settings.motBadgeUrl} target="_blank" rel="noopener noreferrer">
                <SanityImage
                  image={settings.motBadge}
                  lang={lang}
                  sizes="120px"
                  className="h-10 w-auto"
                />
              </a>
            )}
            {settings?.socials?.map((social: any) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs uppercase underline underline-offset-2"
              >
                {social.platform}
              </a>
            ))}
          </div>

          <p className="mt-6">{t(settings?.copyright, lang)}</p>
        </div>
      </Container>
    </footer>
  )
}
```

Chân trang nền `gold` chữ `ink` = 6.66:1, đạt AA cho cả chữ nhỏ.

- [ ] **Step 5: Commit**

```bash
git add components/layout
git commit -m "feat(c4): Header/Footer/MobileMenu/LangSwitcher, có skip link và focus trap

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: SectionRenderer + 15 component khối

**Files:**
- Create: `components/sections/SectionRenderer.tsx`
- Create: `components/sections/` — 15 file component
- Test: `tests/unit/section-renderer.test.tsx`

**Interfaces:**
- Consumes: Task 3, Task 4
- Produces: `<SectionRenderer sections lang />` — không nổ khi gặp `_type` lạ

- [ ] **Step 1: Cài dependency cho carousel, lightbox, bản đồ**

```bash
pnpm add embla-carousel-react@8.6.0 yet-another-react-lightbox@3.32.2 \
  react-leaflet@5.0.0 leaflet@1.9.4
pnpm add -D @types/leaflet@1.9 @testing-library/react@16 jsdom@26
```

- [ ] **Step 2: Viết test thất bại cho SectionRenderer**

```tsx
// tests/unit/section-renderer.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

describe('SectionRenderer', () => {
  it('bỏ qua khối có _type không nhận diện được thay vì nổ', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      render(<SectionRenderer sections={[{ _key: 'a', _type: 'khongTonTai' }]} lang="vi" />),
    ).not.toThrow()
    warn.mockRestore()
  })

  it('render khối văn bản', () => {
    render(
      <SectionRenderer
        lang="vi"
        sections={[
          {
            _key: 'a',
            _type: 'richTextSection',
            background: 'white',
            content: {
              vi: [
                {
                  _type: 'block',
                  _key: 'b',
                  style: 'normal',
                  children: [{ _type: 'span', _key: 'c', text: 'Xin chào', marks: [] }],
                },
              ],
            },
          },
        ]}
      />,
    )
    expect(screen.getByText('Xin chào')).toBeDefined()
  })

  it('render mảng rỗng mà không lỗi', () => {
    expect(() => render(<SectionRenderer sections={[]} lang="vi" />)).not.toThrow()
  })
})
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/section-renderer.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Viết components/sections/SectionRenderer.tsx**

```tsx
import type { Locale } from '@/lib/i18n'
import { HeroSection } from './HeroSection'
import { RichTextSection } from './RichTextSection'
import { ImageTextSection } from './ImageTextSection'
import { CardGridSection } from './CardGridSection'
import { GalleryCarouselSection } from './GalleryCarouselSection'
import { VenueListSection } from './VenueListSection'
import { HallListSection } from './HallListSection'
import { RoomListSection } from './RoomListSection'
import { CtaBandSection } from './CtaBandSection'
import { MapSection } from './MapSection'
import { TableSection } from './TableSection'
import { BookingWidgetSection } from './BookingWidgetSection'
import { LeadFormSection } from './LeadFormSection'
import { FaqSection } from './FaqSection'
import { PostListSection } from './PostListSection'

const REGISTRY: Record<string, React.ComponentType<any>> = {
  heroSection: HeroSection,
  richTextSection: RichTextSection,
  imageTextSection: ImageTextSection,
  cardGridSection: CardGridSection,
  galleryCarouselSection: GalleryCarouselSection,
  venueListSection: VenueListSection,
  hallListSection: HallListSection,
  roomListSection: RoomListSection,
  ctaBandSection: CtaBandSection,
  mapSection: MapSection,
  tableSection: TableSection,
  bookingWidgetSection: BookingWidgetSection,
  leadFormSection: LeadFormSection,
  faqSection: FaqSection,
  postListSection: PostListSection,
}

export function SectionRenderer({ sections, lang }: { sections: any[]; lang: Locale }) {
  return (
    <>
      {(sections ?? []).map((section, index) => {
        const Component = REGISTRY[section._type]
        if (!Component) {
          // Biên tập viên có thể thêm block mới trước khi component tồn tại —
          // bỏ qua thay vì làm sập cả trang.
          console.warn(`SectionRenderer: chưa có component cho _type "${section._type}"`)
          return null
        }
        return (
          <Component
            key={section._key ?? index}
            {...section}
            lang={lang}
            isFirst={index === 0}
          />
        )
      })}
    </>
  )
}
```

`isFirst` truyền xuống để khối đầu tiên đặt `priority` cho ảnh — đây là ảnh LCP.

- [ ] **Step 5: Viết HeroSection, RichTextSection, ImageTextSection**

```tsx
// components/sections/HeroSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'
import { SmartLink } from '@/components/ui/SmartLink'

const HEIGHTS = {
  full: 'min-h-[85vh]',
  medium: 'min-h-[55vh]',
  short: 'min-h-[35vh]',
} as const

export function HeroSection({
  heading, subheading, background, cta, height = 'medium', lang, isFirst,
}: any & { lang: Locale; isFirst?: boolean }) {
  return (
    <section className={`relative flex items-center ${HEIGHTS[height as keyof typeof HEIGHTS] ?? HEIGHTS.medium}`}>
      {background && (
        <div className="absolute inset-0 -z-10">
          <SanityImage
            image={background}
            lang={lang}
            sizes="100vw"
            priority={isFirst}
            decorative
            className="h-full w-full object-cover"
          />
          {/* Lớp phủ để chữ trắng đạt tương phản trên mọi ảnh nền. */}
          <div className="absolute inset-0 bg-black/45" />
        </div>
      )}
      <Container className="relative py-20 text-center text-white">
        <h1 className="font-display text-3xl tracking-wide md:text-5xl">{t(heading, lang)}</h1>
        {subheading && (
          <p className="mx-auto mt-4 max-w-2xl text-sm tracking-widest uppercase md:text-base">
            {t(subheading, lang)}
          </p>
        )}
        {cta && (
          <SmartLink
            link={cta}
            lang={lang}
            className="bg-gold text-ink hover:bg-gold-hi mt-8 inline-block px-8 py-3 text-sm font-semibold tracking-wide uppercase"
          />
        )}
      </Container>
    </section>
  )
}
```

Lớp phủ `bg-black/45` không phải trang trí — nó là thứ bảo đảm chữ trắng đạt AA bất kể
ảnh nền sáng tối thế nào. Không bỏ.

```tsx
// components/sections/RichTextSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'

const BG = {
  white: 'bg-white text-body',
  cream: 'bg-cream text-body',
  ink: 'bg-ink text-white',
} as const

export function RichTextSection({
  heading, content, tone = 'white', narrow = true, lang,
}: any & { lang: Locale }) {
  return (
    <section className={`py-16 ${BG[tone as keyof typeof BG] ?? BG.white}`}>
      <Container size={narrow ? 'narrow' : 'default'}>
        {heading && (
          <h2
            className={`font-display mb-6 text-3xl ${
              tone === 'ink' ? 'text-gold-hi' : 'text-gold-deep'
            }`}
          >
            {t(heading, lang)}
          </h2>
        )}
        <RichText value={content} lang={lang} />
      </Container>
    </section>
  )
}
```

Tiêu đề đổi màu theo nền: nền tối dùng `gold-hi` (8.21:1), nền sáng dùng `gold-deep`.

```tsx
// components/sections/ImageTextSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'
import { Reveal } from '@/components/ui/Reveal'

const BG = {
  white: 'bg-white text-body',
  cream: 'bg-cream text-body',
  ink: 'bg-ink text-white',
} as const

export function ImageTextSection({
  heading, eyebrow, content, image, imageSide = 'left', tone = 'white', cta, lang,
}: any & { lang: Locale }) {
  return (
    <section className={`py-16 ${BG[tone as keyof typeof BG] ?? BG.white}`}>
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal className={imageSide === 'right' ? 'md:order-2' : ''}>
            <SanityImage
              image={image}
              lang={lang}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-auto w-full object-cover"
            />
          </Reveal>
          <Reveal delay={120}>
            {eyebrow && (
              <p
                className={`mb-3 text-xs tracking-[0.18em] uppercase ${
                  tone === 'ink' ? 'text-gold-hi' : 'text-gold-text'
                }`}
              >
                {t(eyebrow, lang)}
              </p>
            )}
            {heading && (
              <h2
                className={`font-display mb-4 text-3xl ${
                  tone === 'ink' ? 'text-gold-hi' : 'text-gold-deep'
                }`}
              >
                {t(heading, lang)}
              </h2>
            )}
            <RichText value={content} lang={lang} />
            {cta && (
              <SmartLink
                link={cta}
                lang={lang}
                className="text-gold-text mt-4 inline-block text-sm font-semibold tracking-wide uppercase underline underline-offset-4"
              />
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
```

`eyebrow` là chữ nhỏ nên trên nền sáng dùng `gold-text`, không dùng `gold`.

- [ ] **Step 6: Viết CardGridSection, CtaBandSection, TableSection, FaqSection**

```tsx
// components/sections/CardGridSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'
import { Reveal } from '@/components/ui/Reveal'

const COLS = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' }

export function CardGridSection({ heading, subheading, cards = [], columns = 3, lang }: any & { lang: Locale }) {
  return (
    <section className="bg-cream py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-2 text-center text-3xl">
            {t(heading, lang)}
          </h2>
        )}
        {subheading && (
          <p className="mb-10 text-center text-sm tracking-widest uppercase">
            {t(subheading, lang)}
          </p>
        )}
        <div className={`grid gap-8 ${COLS[columns as 2 | 3 | 4] ?? COLS[3]}`}>
          {cards.map((card: any, index: number) => (
            <Reveal key={card._key ?? index} delay={index * 90}>
              <article className="h-full bg-white">
                {card.image && (
                  <SanityImage
                    image={card.image}
                    lang={lang}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="font-display text-gold-text mb-2 text-xl">
                    {t(card.title, lang)}
                  </h3>
                  {card.description && (
                    <p className="text-sm leading-relaxed">{t(card.description, lang)}</p>
                  )}
                  {card.cta && (
                    <SmartLink
                      link={card.cta}
                      lang={lang}
                      className="text-gold-text mt-4 inline-block text-xs font-semibold tracking-wide uppercase underline underline-offset-4"
                    />
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

```tsx
// components/sections/CtaBandSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { SmartLink } from '@/components/ui/SmartLink'

export function CtaBandSection({ heading, description, background, cta, lang }: any & { lang: Locale }) {
  return (
    <section className="relative py-24">
      {background && (
        <div className="absolute inset-0 -z-10">
          <SanityImage image={background} lang={lang} sizes="100vw" decorative className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
      <Container className="relative text-center text-white">
        <h2 className="font-display text-3xl">{t(heading, lang)}</h2>
        {description && <p className="mx-auto mt-3 max-w-xl">{t(description, lang)}</p>}
        {cta && (
          <SmartLink
            link={cta}
            lang={lang}
            className="bg-gold text-ink hover:bg-gold-hi mt-8 inline-block px-8 py-3 text-sm font-semibold tracking-wide uppercase"
          />
        )}
      </Container>
    </section>
  )
}
```

```tsx
// components/sections/TableSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'

export function TableSection({ heading, caption, headers = [], rows = [], lang }: any & { lang: Locale }) {
  return (
    <section className="py-12">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-4 text-2xl">{t(heading, lang)}</h2>
        )}
        {/* Bảng luật Baccarat rộng hơn màn hình điện thoại -> cuộn ngang riêng,
            không để cả trang cuộn ngang. */}
        <div className="overflow-x-auto">
          <table className="border-line w-full min-w-[480px] border-collapse border text-sm">
            {caption && <caption className="mb-2 text-left text-xs">{t(caption, lang)}</caption>}
            <thead>
              <tr className="bg-cream">
                {headers.map((cell: any, index: number) => (
                  <th key={cell._key ?? index} scope="col" className="border-line border px-3 py-2 text-left font-semibold">
                    {t(cell, lang)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, rowIndex: number) => (
                <tr key={row._key ?? rowIndex} className={rowIndex % 2 ? 'bg-cream/40' : ''}>
                  {(row.cells ?? []).map((cell: any, cellIndex: number) => (
                    <td key={cell._key ?? cellIndex} className="border-line border px-3 py-2">
                      {t(cell, lang)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  )
}
```

```tsx
// components/sections/FaqSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { RichText } from '@/components/ui/PortableText'

export function FaqSection({ heading, items = [], lang }: any & { lang: Locale }) {
  return (
    <section className="py-16">
      <Container size="narrow">
        {heading && (
          <h2 className="font-display text-gold-deep mb-8 text-3xl">{t(heading, lang)}</h2>
        )}
        <dl className="divide-line divide-y">
          {items.map((item: any, index: number) => (
            <details key={item._key ?? index} className="group py-4">
              <summary className="marker:content-none cursor-pointer list-none font-semibold">
                <dt className="flex items-center justify-between">
                  {t(item.question, lang)}
                  <span aria-hidden="true" className="text-gold-deep ml-4 transition-transform group-open:rotate-45">
                    +
                  </span>
                </dt>
              </summary>
              <dd className="mt-3 text-sm">
                <RichText value={item.answer} lang={lang} />
              </dd>
            </details>
          ))}
        </dl>
      </Container>
    </section>
  )
}
```

`<details>`/`<summary>` gốc — mở được bằng bàn phím, không cần JS.

- [ ] **Step 7: Viết 3 component danh sách (Room/Hall/Venue)**

```tsx
// components/sections/RoomListSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { Button } from '@/components/ui/Button'
import { hrefFor } from '@/lib/routes'
import { Reveal } from '@/components/ui/Reveal'

export function RoomListSection({ heading, resolved = [], lang }: any & { lang: Locale }) {
  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-10 text-center text-3xl">
            {t(heading, lang)}
          </h2>
        )}
        <div className="grid gap-8 md:grid-cols-2">
          {resolved.map((room: any, index: number) => (
            <Reveal key={room._id} delay={index * 90}>
              <article className="bg-cream h-full">
                {room.heroImage && (
                  <SanityImage
                    image={room.heroImage}
                    lang={lang}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="aspect-[3/2] w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="font-display text-gold-text text-xl">{t(room.title, lang)}</h3>
                  <p className="text-gold-text mt-1 text-xs tracking-widest uppercase">
                    {[
                      room.areaSqm ? `${room.areaSqm} m²` : null,
                      t(room.view, lang),
                      t(room.capacity, lang),
                    ]
                      .filter(Boolean)
                      .join(' | ')}
                  </p>
                  {room.summary && <p className="mt-3 text-sm">{t(room.summary, lang)}</p>}
                  <Button href={hrefFor(lang, room.slug)} variant="ghost" className="mt-4 px-0">
                    Xem chi tiết
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

```tsx
// components/sections/HallListSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'

export function HallListSection({ heading, resolved = [], lang }: any & { lang: Locale }) {
  return (
    <section className="bg-cream py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-10 text-center text-3xl">
            {t(heading, lang)}
          </h2>
        )}
        <div className="space-y-12">
          {resolved.map((hall: any, index: number) => (
            <article key={hall._id} className="grid items-center gap-8 md:grid-cols-2">
              <div className={index % 2 ? 'md:order-2' : ''}>
                {hall.image && (
                  <SanityImage
                    image={hall.image}
                    lang={lang}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-auto w-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-display text-gold-deep text-2xl">{t(hall.name, lang)}</h3>
                <p className="text-gold-text mt-1 text-xs tracking-widest uppercase">
                  {[
                    hall.areaSqm ? `Diện tích: ${hall.areaSqm} m²` : null,
                    t(hall.capacity, lang) ? `Sức chứa: ${t(hall.capacity, lang)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                </p>
                <div className="mt-3 text-sm">
                  <RichText value={hall.description} lang={lang} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

```tsx
// components/sections/VenueListSection.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <dt className="text-gold-text min-w-28 text-xs tracking-widest uppercase">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function VenueListSection({ heading, resolved = [], lang }: any & { lang: Locale }) {
  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-10 text-center text-3xl">
            {t(heading, lang)}
          </h2>
        )}
        <div className="space-y-16">
          {resolved.map((venue: any, index: number) => (
            <article key={venue._id} className="grid items-start gap-8 md:grid-cols-2">
              <div className={index % 2 ? 'md:order-2' : ''}>
                {venue.image && (
                  <SanityImage
                    image={venue.image}
                    lang={lang}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-auto w-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-display text-gold-deep text-2xl">{t(venue.name, lang)}</h3>
                <div className="mt-3 text-sm">
                  <RichText value={venue.description} lang={lang} />
                </div>
                <dl className="mt-4 space-y-2">
                  <MetaRow label="Địa điểm" value={t(venue.location, lang)} />
                  <MetaRow label="Sức chứa" value={t(venue.capacity, lang)} />
                  <MetaRow label="Mở cửa" value={t(venue.hours, lang)} />
                  <MetaRow label="Điện thoại" value={venue.phone} />
                </dl>
                {venue.highlights?.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {venue.highlights.map((item: any, i: number) => (
                      <li key={i} className="bg-cream px-3 py-1 text-xs">
                        {t(item, lang)}
                      </li>
                    ))}
                  </ul>
                )}
                {venue.menuUrl && (
                  <a
                    href={venue.menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-text mt-4 inline-block text-xs font-semibold tracking-wide uppercase underline underline-offset-4"
                  >
                    Xem menu
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 7b: Viết PostListSection.tsx**

Đây là thứ làm `/vi/news` và `/vi/our-announcement` có nội dung. E2E của Task 8 chỉ
kiểm "có một h1, không lỗi console" nên sẽ **không** bắt được nếu thiếu component này —
phải tự mắt xác nhận hai trang đó liệt kê đủ bài.

```tsx
// components/sections/PostListSection.tsx
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { Reveal } from '@/components/ui/Reveal'
import { hrefFor } from '@/lib/routes'

export function PostListSection({
  heading,
  resolved = [],
  limit = 12,
  lang,
}: any & { lang: Locale }) {
  const posts = resolved.slice(0, limit)

  if (posts.length === 0) {
    return (
      <section className="py-16">
        <Container>
          <p className="text-center text-sm">
            {lang === 'vi' ? 'Chưa có bài viết nào.' : 'No articles yet.'}
          </p>
        </Container>
      </section>
    )
  }

  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-10 text-center text-3xl">
            {t(heading, lang)}
          </h2>
        )}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any, index: number) => {
            const published = post.publishedAt ? new Date(post.publishedAt) : null
            return (
              <Reveal key={post._id} delay={index * 80}>
                <article className="h-full">
                  <Link href={hrefFor(lang, post.slug)} className="group block">
                    {post.coverImage && (
                      <SanityImage
                        image={post.coverImage}
                        lang={lang}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="aspect-[3/2] w-full object-cover"
                      />
                    )}
                    {published && (
                      <time
                        dateTime={published.toISOString()}
                        className="text-gold-text mt-4 block text-xs tracking-widest uppercase"
                      >
                        {published.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                    <h3 className="font-display text-gold-text mt-2 text-lg group-hover:underline">
                      {t(post.title, lang)}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm">{t(post.excerpt, lang)}</p>
                    )}
                  </Link>
                </article>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 8: Viết GalleryCarouselSection (client) và MapSection (client)**

```tsx
// components/sections/GalleryCarouselSection.tsx
'use client'

import { useCallback, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { t, type Locale } from '@/lib/i18n'
import { urlFor } from '@/sanity/lib/image'
import { SanityImage } from '@/components/ui/SanityImage'
import { Container } from '@/components/ui/Container'

export function GalleryCarouselSection({ heading, album, lang }: any & { lang: Locale }) {
  const images: any[] = album?.images ?? []
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [openAt, setOpenAt] = useState<number | null>(null)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (images.length === 0) return null

  return (
    <section className="py-16">
      <Container size="wide">
        {(heading || album?.title) && (
          <h2 className="font-display text-gold-deep mb-8 text-center text-3xl">
            {t(heading, lang) ?? t(album.title, lang)}
          </h2>
        )}

        <div
          className="overflow-hidden"
          ref={emblaRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={t(album?.title, lang) ?? 'Thư viện ảnh'}
          // Mũi tên trái/phải điều khiển carousel khi nó đang được focus.
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') scrollPrev()
            if (event.key === 'ArrowRight') scrollNext()
          }}
        >
          <div className="flex gap-3">
            {images.map((image, index) => (
              <button
                key={image._key ?? index}
                type="button"
                onClick={() => setOpenAt(index)}
                className="focus-visible:outline-gold-deep min-w-0 shrink-0 basis-4/5 focus-visible:outline-2 md:basis-1/3 lg:basis-1/4"
              >
                <span className="sr-only">Phóng to ảnh {index + 1}</span>
                <SanityImage
                  image={image}
                  lang={lang}
                  sizes="(max-width: 768px) 80vw, 25vw"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button type="button" onClick={scrollPrev} className="border-line border px-4 py-2 text-sm">
            <span className="sr-only">Ảnh trước</span>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" onClick={scrollNext} className="border-line border px-4 py-2 text-sm">
            <span className="sr-only">Ảnh sau</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <Lightbox
          open={openAt !== null}
          index={openAt ?? 0}
          close={() => setOpenAt(null)}
          slides={images.map((image) => ({
            src: urlFor(image).width(1800).url(),
            alt: t(image.alt, lang) ?? '',
          }))}
        />
      </Container>
    </section>
  )
}
```

```tsx
// components/sections/MapSection.tsx
'use client'

import dynamic from 'next/dynamic'
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'

// Leaflet đụng `window` khi import -> bắt buộc tắt SSR.
const LeafletMap = dynamic(() => import('@/components/ui/LeafletMap').then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => <div className="bg-cream h-96 w-full" aria-hidden="true" />,
})

export function MapSection({ heading, lat, lng, zoom = 15, lang }: any & { lang: Locale }) {
  // Toạ độ Bãi Cháy làm mặc định nếu Cấu hình site chưa có.
  const latitude = typeof lat === 'number' ? lat : 20.9538
  const longitude = typeof lng === 'number' ? lng : 107.0435

  return (
    <section className="py-16">
      <Container>
        {heading && (
          <h2 className="font-display text-gold-deep mb-6 text-center text-3xl">
            {t(heading, lang)}
          </h2>
        )}
        <LeafletMap lat={latitude} lng={longitude} zoom={zoom} />
      </Container>
    </section>
  )
}
```

```tsx
// components/ui/LeafletMap.tsx
'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet mặc định trỏ icon marker ra CDN; trỏ về asset cục bộ để không phụ thuộc mạng ngoài.
const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export function LeafletMap({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className="h-96 w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  )
}
```

Copy icon marker vào `public/leaflet/`:

```bash
mkdir -p public/leaflet
cp node_modules/leaflet/dist/images/marker-icon.png public/leaflet/
cp node_modules/leaflet/dist/images/marker-icon-2x.png public/leaflet/
```

- [ ] **Step 9: Viết BookingWidgetSection và LeadFormSection tạm**

```tsx
// components/sections/BookingWidgetSection.tsx
'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { Container } from '@/components/ui/Container'

export function BookingWidgetSection({ widgetId, lang }: { widgetId?: string; lang: string }) {
  useEffect(() => {
    if (!widgetId) {
      console.warn('BookingWidgetSection: chưa có secureBookingsWidgetId trong Cấu hình site.')
    }
  }, [widgetId])

  if (!widgetId) return null

  return (
    <section className="py-12">
      <Container>
        <link rel="stylesheet" href="https://book.securebookings.net/css/app.css" />
        <div className="hbe-bws">
          <section id="hbe-bws-page">
            <div id="hbe-bws-wrapper" />
          </section>
        </div>
        <Script src="https://book.securebookings.net/js/widget.all.js" strategy="afterInteractive" />
        <Script
          src={`https://book.securebookings.net/widgetCustomize?lang=${lang}&widgetType=Widget&id=${widgetId}&ajax=true`}
          strategy="afterInteractive"
        />
      </Container>
    </section>
  )
}
```

```tsx
// components/sections/LeadFormSection.tsx
// Bản tạm — Plan D thay bằng form thật nối vào Neon.
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'

export function LeadFormSection({ heading, description, lang }: any & { lang: Locale }) {
  return (
    <section className="bg-cream py-16">
      <Container size="narrow">
        <h2 className="font-display text-gold-deep mb-3 text-3xl">{t(heading, lang)}</h2>
        {description && <p className="mb-6 text-sm">{t(description, lang)}</p>}
        <p className="text-sm italic">Form sẽ hoạt động sau khi hoàn tất Plan D.</p>
      </Container>
    </section>
  )
}
```

`BookingWidgetSection` cần `widgetId` từ `siteSettings` — truyền xuống ở Task 6 bằng
cách bơm thêm prop trong `SectionRenderer`.

- [ ] **Step 10: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/section-renderer.test.tsx`
Expected: PASS, 3 test.

- [ ] **Step 11: Commit**

```bash
git add components public/leaflet package.json pnpm-lock.yaml tests/unit/section-renderer.test.tsx
git commit -m "feat(c5): SectionRenderer + 15 component khối

Bỏ Flickity/fancyBox/anime.js: dùng Embla, yarl, IntersectionObserver.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Trang phòng, bài viết, ưu đãi

**Files:**
- Create: `components/pages/RoomPage.tsx`, `PostPage.tsx`, `OfferPage.tsx`
- Modify: `components/sections/SectionRenderer.tsx` (bơm `widgetId`)
- Modify: `app/[lang]/[slug]/page.tsx`

**Interfaces:**
- Consumes: Task 3, 5
- Produces: `<RoomPage doc lang />`, `<PostPage doc lang />`, `<OfferPage doc lang />`

- [ ] **Step 1: Bơm widgetId vào SectionRenderer**

Sửa chữ ký và chỗ render trong `components/sections/SectionRenderer.tsx`:

```tsx
export function SectionRenderer({
  sections,
  lang,
  widgetId,
}: {
  sections: any[]
  lang: Locale
  widgetId?: string
}) {
  return (
    <>
      {(sections ?? []).map((section, index) => {
        const Component = REGISTRY[section._type]
        if (!Component) {
          console.warn(`SectionRenderer: chưa có component cho _type "${section._type}"`)
          return null
        }
        return (
          <Component
            key={section._key ?? index}
            {...section}
            lang={lang}
            isFirst={index === 0}
            {...(section._type === 'bookingWidgetSection' ? { widgetId } : {})}
          />
        )
      })}
    </>
  )
}
```

Rồi ở `app/[lang]/[slug]/page.tsx` và `app/[lang]/page.tsx`, đọc `getSiteSettings()`
và truyền `widgetId={settings?.secureBookingsWidgetId}`.

- [ ] **Step 2: Viết components/pages/RoomPage.tsx**

```tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

export function RoomPage({ doc, lang }: { doc: any; lang: Locale }) {
  return (
    <>
      <section className="relative flex min-h-[55vh] items-center">
        {doc.heroImage && (
          <div className="absolute inset-0 -z-10">
            <SanityImage
              image={doc.heroImage}
              lang={lang}
              sizes="100vw"
              priority
              decorative
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>
        )}
        <Container className="relative py-20 text-center text-white">
          <h1 className="font-display text-3xl tracking-wide md:text-5xl">
            {t(doc.title, lang)}
          </h1>
          <p className="mt-3 text-xs tracking-[0.2em] uppercase">
            {[doc.areaSqm ? `${doc.areaSqm} m²` : null, t(doc.view, lang), t(doc.capacity, lang)]
              .filter(Boolean)
              .join(' | ')}
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
            <div>
              <RichText value={doc.description} lang={lang} />
              <Button href={`/${lang}/reservation`} className="mt-6">
                Đặt phòng
              </Button>
            </div>

            {doc.features?.length > 0 && (
              <div className="bg-cream p-6">
                <h2 className="font-display text-gold-text mb-4 text-xl">Tiện nghi phòng</h2>
                <ul className="space-y-3">
                  {doc.features.map((feature: any, index: number) => (
                    <li key={feature._key ?? index} className="flex items-center gap-3 text-sm">
                      {feature.icon && (
                        <SanityImage
                          image={feature.icon}
                          lang={lang}
                          sizes="24px"
                          decorative
                          className="h-6 w-6 shrink-0 object-contain"
                        />
                      )}
                      <span>{t(feature.label, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Container>
      </section>

      {doc.gallery?.length > 0 && (
        <section className="bg-cream py-16">
          <Container size="wide">
            <h2 className="font-display text-gold-deep mb-8 text-center text-3xl">Hình ảnh phòng</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {doc.gallery.map((image: any, index: number) => (
                <Reveal key={image._key ?? index} delay={index * 60}>
                  <SanityImage
                    image={image}
                    lang={lang}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
```

- [ ] **Step 3: Viết components/pages/PostPage.tsx và OfferPage.tsx**

```tsx
// components/pages/PostPage.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'

export function PostPage({ doc, lang }: { doc: any; lang: Locale }) {
  const published = doc.publishedAt ? new Date(doc.publishedAt) : null

  return (
    <article className="py-16">
      <Container size="narrow">
        <h1 className="font-display text-gold-deep text-3xl md:text-4xl">{t(doc.title, lang)}</h1>
        {published && (
          <p className="mt-3 text-xs tracking-widest uppercase">
            <time dateTime={published.toISOString()}>
              {published.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </time>
            {doc.author ? ` — ${doc.author}` : ''}
          </p>
        )}
        {doc.coverImage && (
          <SanityImage
            image={doc.coverImage}
            lang={lang}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            className="mt-8 h-auto w-full object-cover"
          />
        )}
        <div className="mt-8">
          <RichText value={doc.body} lang={lang} />
        </div>
      </Container>
    </article>
  )
}
```

```tsx
// components/pages/OfferPage.tsx
import { t, type Locale } from '@/lib/i18n'
import { Container } from '@/components/ui/Container'
import { SanityImage } from '@/components/ui/SanityImage'
import { RichText } from '@/components/ui/PortableText'
import { SmartLink } from '@/components/ui/SmartLink'

export function OfferPage({ doc, lang }: { doc: any; lang: Locale }) {
  return (
    <article className="py-16">
      <Container size="narrow">
        <h1 className="font-display text-gold-deep text-3xl md:text-4xl">{t(doc.title, lang)}</h1>
        {doc.priceNote && (
          <p className="text-gold-text mt-2 text-sm font-semibold tracking-widest uppercase">
            {t(doc.priceNote, lang)}
          </p>
        )}
        {doc.image && (
          <SanityImage
            image={doc.image}
            lang={lang}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            className="mt-8 h-auto w-full object-cover"
          />
        )}
        <div className="mt-8">
          <RichText value={doc.body} lang={lang} />
        </div>
        {doc.cta && (
          <SmartLink
            link={doc.cta}
            lang={lang}
            className="bg-gold text-ink hover:bg-gold-hi mt-8 inline-block px-8 py-3 text-sm font-semibold tracking-wide uppercase"
          />
        )}
      </Container>
    </article>
  )
}
```

- [ ] **Step 4: Chạy dev và đi qua toàn bộ 22 route bằng mắt**

Run: `pnpm dev`, mở lần lượt:
`/vi` · `/vi/deluxe` · `/vi/casino` · `/vi/our-gallery` · `/vi/culinary` ·
`/vi/royal-international-convention-palace` · `/vi/news` · `/vi/reservation` ·
`/vi/privacy-policy` và một bài viết dài.

Kỳ vọng: không trang nào trắng, không lỗi console, ảnh hiện, carousel kéo được,
lightbox mở được, bản đồ render tile.

- [ ] **Step 5: Commit**

```bash
git add components app
git commit -m "feat(c6): trang phòng / bài viết / ưu đãi + bơm widgetId đặt phòng

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: SEO — metadata, hreflang, sitemap, robots, JSON-LD

**Files:**
- Create: `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts`
- Create: `components/seo/JsonLd.tsx`
- Modify: `app/layout.tsx`, `app/[lang]/layout.tsx`, `app/[lang]/page.tsx`, `app/[lang]/[slug]/page.tsx`
- Test: `tests/unit/seo.test.ts`

**Interfaces:**
- Consumes: Task 1, 2
- Produces: `buildMetadata({doc, lang, slug, settings}): Metadata`, `<JsonLd data />`

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/unit/seo.test.ts
import { describe, it, expect } from 'vitest'
import { buildMetadata, absoluteUrl } from '@/lib/seo'

const settings = { brandName: { vi: 'Royal Hạ Long' } }

describe('absoluteUrl()', () => {
  it('ghép với NEXT_PUBLIC_SITE_URL và không tạo dấu / kép', () => {
    expect(absoluteUrl('/vi/casino', 'https://example.com')).toBe('https://example.com/vi/casino')
    expect(absoluteUrl('/vi/casino', 'https://example.com/')).toBe('https://example.com/vi/casino')
  })
})

describe('buildMetadata()', () => {
  const doc = {
    title: { vi: 'Casino' },
    slug: { vi: { current: 'casino' } },
    seo: { metaDescription: { vi: 'Câu lạc bộ quốc tế' } },
  }

  it('dùng metaTitle của SEO khi có, nếu không thì dùng tiêu đề trang', () => {
    expect(buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' }).title)
      .toContain('Casino')

    const withMeta = { ...doc, seo: { ...doc.seo, metaTitle: { vi: 'Casino Hoàng Gia' } } }
    expect(buildMetadata({ doc: withMeta, lang: 'vi', settings, siteUrl: 'https://e.com' }).title)
      .toContain('Casino Hoàng Gia')
  })

  it('sinh canonical trỏ domain mới, KHÔNG trỏ royalhalonghotel.com', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.alternates?.canonical).toBe('https://e.com/vi/casino')
    expect(JSON.stringify(meta)).not.toContain('royalhalonghotel.com')
  })

  it('sinh hreflang cho cả vi và en', () => {
    const meta = buildMetadata({ doc, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.alternates?.languages?.vi).toBe('https://e.com/vi/casino')
    expect(meta.alternates?.languages?.en).toBe('https://e.com/en/casino')
  })

  it('dùng slug EN riêng cho hreflang khi document có', () => {
    const bilingual = { ...doc, slug: { vi: { current: 'casino' }, en: { current: 'gaming-club' } } }
    const meta = buildMetadata({ doc: bilingual, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.alternates?.languages?.en).toBe('https://e.com/en/gaming-club')
  })

  it('tôn trọng noIndex', () => {
    const hidden = { ...doc, seo: { ...doc.seo, noIndex: true } }
    const meta = buildMetadata({ doc: hidden, lang: 'vi', settings, siteUrl: 'https://e.com' })
    expect(meta.robots).toMatchObject({ index: false })
  })
})
```

Test "không trỏ royalhalonghotel.com" là bảo hiểm trực tiếp cho một trong các mục
"phải thay trước khi deploy" của `NOTES.md`.

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/seo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Viết lib/seo.ts**

```ts
import type { Metadata } from 'next'
import { t, LOCALES, type Locale } from './i18n'
import { resolveSlug, type SlugField } from './routes'

export function absoluteUrl(path: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildMetadata({
  doc,
  lang,
  settings,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
}: {
  doc: { title?: any; slug?: SlugField; seo?: any } | null | undefined
  lang: Locale
  settings: any
  siteUrl?: string
}): Metadata {
  const brand = t(settings?.brandName, lang) ?? 'Royal Halong Hotel'
  const pageTitle = t(doc?.seo?.metaTitle, lang) ?? t(doc?.title, lang) ?? brand
  const description = t<string>(doc?.seo?.metaDescription, lang)

  const currentSlug = resolveSlug(doc?.slug, lang)
  const path = currentSlug ? `/${lang}/${currentSlug}` : `/${lang}`

  const languages: Record<string, string> = {}
  for (const locale of LOCALES) {
    const localeSlug = resolveSlug(doc?.slug, locale)
    languages[locale] = absoluteUrl(localeSlug ? `/${locale}/${localeSlug}` : `/${locale}`, siteUrl)
  }

  return {
    title: pageTitle === brand ? brand : `${pageTitle} — ${brand}`,
    description,
    alternates: {
      canonical: absoluteUrl(path, siteUrl),
      languages,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: absoluteUrl(path, siteUrl),
      siteName: brand,
      locale: lang === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
    },
    ...(doc?.seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/seo.test.ts`
Expected: PASS, 6 test.

- [ ] **Step 5: Gắn generateMetadata vào các route**

Thêm vào `app/[lang]/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { getSiteSettings } from '@/sanity/lib/fetchers'

export async function generateMetadata({ params }: PageProps<'/[lang]/[slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  const [doc, settings] = await Promise.all([getDocBySlug(slug), getSiteSettings()])
  return buildMetadata({ doc, lang, settings })
}
```

Tương tự cho `app/[lang]/page.tsx` với `getHome()`.

- [ ] **Step 6: Đặt lang động cho thẻ html**

Root layout không biết locale (locale nằm ở segment con). Chuyển `<html>` xuống
`app/[lang]/layout.tsx` không được — App Router bắt `<html>` ở root. Cách làm: root
layout đọc locale từ header do middleware gắn.

Sửa `middleware.ts`, thêm header trước khi `NextResponse.next()`:

```ts
  if (hasLocale) {
    const locale = pathname.split('/')[1]
    const response = NextResponse.next()
    response.headers.set('x-locale', locale)
    return response
  }
```

Sửa `app/layout.tsx`:

```tsx
import { headers } from 'next/headers'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n'

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const { isEnabled: isDraftMode } = await draftMode()
  const headerList = await headers()
  const raw = headerList.get('x-locale') ?? DEFAULT_LOCALE
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE
  const fontVars = [display, body, accent, alt].map((f) => f.variable).join(' ')

  return (
    <html lang={lang} className={fontVars}>
      <body>
        {children}
        <SanityLive includeDrafts={isDraftMode} />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Viết app/sitemap.ts và app/robots.ts**

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { getAllRoutes } from '@/sanity/lib/fetchers'
import { absoluteUrl } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const routes = await getAllRoutes()

  const entries: MetadataRoute.Sitemap = LOCALES.map((lang) => ({
    url: absoluteUrl(`/${lang}`, siteUrl),
    changeFrequency: 'weekly',
    priority: 1,
  }))

  for (const route of routes) {
    for (const lang of LOCALES) {
      const slug = lang === 'vi' ? route.vi : route.en || route.vi
      if (!slug) continue
      entries.push({
        url: absoluteUrl(`/${lang}/${slug}`, siteUrl),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return entries
}
```

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/studio', '/api'] }],
    sitemap: `${siteUrl.replace(/\/+$/, '')}/sitemap.xml`,
  }
}
```

- [ ] **Step 8: Viết components/seo/JsonLd.tsx và gắn Hotel schema**

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Dữ liệu do chính ta dựng từ Sanity, không phải chuỗi người dùng nhập tự do.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

Trong `app/[lang]/layout.tsx`, sau khi có `settings`, thêm:

```tsx
import { JsonLd } from '@/components/seo/JsonLd'
import { t } from '@/lib/i18n'

// ... trong return, trước <Header>:
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: t(settings?.brandName, lang),
    address: {
      '@type': 'PostalAddress',
      streetAddress: t(settings?.addressFull, lang),
      addressCountry: 'VN',
    },
    telephone: settings?.tel,
    email: settings?.emails?.[0],
    url: process.env.NEXT_PUBLIC_SITE_URL,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: settings?.lat,
      longitude: settings?.lng,
    },
  }}
/>
```

JSON-LD sinh từ Sanity nên `@id` và mọi URL trỏ domain mới — giải quyết mục "Yoast
JSON-LD còn nêu royalhalonghotel.com" trong `NOTES.md`.

- [ ] **Step 9: Kiểm chứng**

Run: `pnpm build && pnpm start`
Mở `/sitemap.xml` — kỳ vọng có 44+ URL, tất cả trỏ `NEXT_PUBLIC_SITE_URL`.
Mở `/robots.txt` — chặn `/studio` và `/api`.
Xem source `/vi/casino` — có `<link rel="canonical">`, hai `hreflang`, một khối JSON-LD,
và **không** chuỗi `royalhalonghotel.com` nào.

```bash
curl -s http://localhost:3000/vi/casino | grep -c 'royalhalonghotel.com'
```
Expected: `0`

- [ ] **Step 10: Commit**

```bash
git add lib/seo.ts app components/seo middleware.ts tests/unit/seo.test.ts
git commit -m "feat(c7): SEO — metadata, canonical, hreflang, sitemap, robots, JSON-LD Hotel

Canonical và JSON-LD trỏ domain mới, không còn royalhalonghotel.com.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Kiểm thử E2E và rà a11y/performance

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/routes.spec.ts`, `tests/e2e/a11y.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: toàn bộ Task 1–7
- Produces: `pnpm test:e2e`

- [ ] **Step 1: Cài Playwright và axe**

```bash
pnpm add -D @playwright/test@1.63.0 @axe-core/playwright@4
pnpm exec playwright install chromium
```

- [ ] **Step 2: Viết playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Chạy trên build production: dev server không phản ánh đúng caching và bundle.
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
```

- [ ] **Step 3: Thêm script vào package.json**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 4: Viết tests/e2e/routes.spec.ts**

```ts
import { test, expect } from '@playwright/test'

const ROUTES = [
  '', 'luu-tru-phong-khach-san-villas', 'deluxe', 'premium', 'villas-deluxe',
  'villas-suite', 'casino', 'culinary', 'experiences', 'wedding',
  'royal-international-convention-palace', 'our-gallery', 'offers', 'reservation',
  'news', 'our-announcement', 'payment-methods', 'privacy-policy',
  'terms-and-conditions',
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
```

- [ ] **Step 5: Viết tests/e2e/a11y.spec.ts**

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SAMPLE = ['', 'deluxe', 'casino', 'our-gallery', 'news']

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

test('menu mobile mở/đóng được bằng bàn phím', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vi')
  const toggle = page.getByRole('button', { name: 'Mở menu' })
  await toggle.click()
  await expect(page.locator('#mobile-menu')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#mobile-menu')).toBeHidden()
})

test('lightbox thư viện ảnh mở và đóng được', async ({ page }) => {
  await page.goto('/vi/our-gallery')
  await page.getByRole('button', { name: /Phóng to ảnh 1/ }).first().click()
  await expect(page.locator('.yarl__container')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.yarl__container')).toBeHidden()
})
```

- [ ] **Step 6: Chạy E2E và sửa cho tới khi xanh**

Run: `pnpm test:e2e`
Expected: tất cả PASS.

⚠️ **Bẫy đã biết — thiếu favicon làm hỏng cả 19 test route.** Test `routes.spec.ts` assert
`expect(errors).toEqual([])`, mà không có favicon thì mọi trang sinh
`Failed to load resource: 404 (Not Found) @ /favicon.ico` trong console → **fail toàn bộ**.
Đã xác nhận bằng trình duyệt thật ở Plan A Task 1. Sửa trước khi chạy: đặt một file
`app/icon.png` (hoặc `app/favicon.ico`) — Next tự phục vụ nó. Lấy tạm logo từ
`wp-content/uploads/`, sau này thay bằng `siteSettings.favicon` trong Sanity.

Vi phạm axe hay gặp và cách xử lý:
- `color-contrast` → gần như chắc chắn do dùng `text-gold` cho chữ nhỏ trên nền sáng.
  Đổi sang `text-gold-text`. Đây đúng là thứ bảng đo ở spec mục 7 cảnh báo.
- `image-alt` → `figure.alt` trống trong Sanity. Nhập alt trong Studio, hoặc đánh dấu
  `decorative` nếu ảnh thuần trang trí.
- `heading-order` → nhảy cấp tiêu đề, ví dụ h1 rồi h4. Sửa cấp trong component.
- `landmark-unique` → hai `<nav>` không có `aria-label` phân biệt.

- [ ] **Step 7: Đo performance thủ công**

Run: `pnpm build` rồi xem báo cáo bundle của Next.
Kỳ vọng First Load JS của route `[lang]/[slug]` dưới ~200 kB. Nếu vượt, kiểm tra
xem `yet-another-react-lightbox` hay `leaflet` có bị kéo vào server bundle không —
cả hai phải nằm trong component `'use client'` và Leaflet phải qua `next/dynamic`
với `ssr: false`.

Mở Chrome DevTools → Lighthouse trên `/vi`, chế độ Mobile:
- LCP < 1.5s, CLS < 0.1 (tiêu chí spec mục 7)
- Nếu CLS cao: có `<SanityImage>` nào thiếu `width`/`height` thật từ `metadata.dimensions`.
- Nếu LCP cao: ảnh hero chưa có `priority` — kiểm tra `isFirst` có tới được `HeroSection`.

- [ ] **Step 8: Chạy toàn bộ test**

Run: `pnpm test && pnpm test:e2e`
Expected: unit test và e2e đều xanh.

- [ ] **Step 9: Commit**

```bash
git add playwright.config.ts tests/e2e package.json pnpm-lock.yaml
git commit -m "test(c8): E2E 19 route + rà a11y bằng axe + kiểm tra không cuộn ngang

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Hoàn thành Plan C

- 22 URL gốc giữ nguyên, chạy song ngữ với fallback EN → VI.
- Không còn jQuery/Flickity/fancyBox/anime.js.
- SEO sạch: canonical, hreflang, sitemap, JSON-LD đều trỏ domain mới.
- E2E và axe xanh.

**Còn lại:** `LeadFormSection` vẫn là bản tạm. Plan D nối nó vào Neon.
