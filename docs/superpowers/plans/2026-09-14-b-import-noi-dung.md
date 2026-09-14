# Plan B — Script import 22 trang + 213 ảnh vào Sanity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổ toàn bộ nội dung của bản clone HTML vào Sanity một cách tự động và chạy lại được, để plan C có dữ liệu thật mà render.

**Architecture:** Pipeline 4 pha chạy bằng `tsx`: `parse` (HTML → JSON trung gian) → `assets` (gom + upload ảnh, có cache) → `transform` (JSON + asset map → document Sanity) → `run` (ghi bằng `createOrReplace`). Mỗi pha xuất file ra `scripts/import/out/` nên xem được kết quả từng bước và chạy lại từ giữa.

**Tech Stack:** tsx, cheerio 1.2.0, jsdom, `@portabletext/block-tools` 6.0.0, `@sanity/schema`, `@sanity/client` (qua `next-sanity`), Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-14-nextjs-sanity-migration-design.md`

## Global Constraints

- Plan A phải xong trước (schema Sanity đã tồn tại).
- **Chỉ đọc, không sửa** `index.html`, `*/index.html`, `wp-content/`, `wp-includes/`, `assets/`.
- `scripts/import/out/` đã có trong `.gitignore` — **không commit** file sinh ra.
- Script dùng `SANITY_API_WRITE_TOKEN`. Token này **không bao giờ** đặt trên Vercel.
- **Idempotent:** chạy lại lần 2 phải cho kết quả y hệt, không tạo document trùng,
  không upload lại ảnh đã upload.
- Mọi field `vi` được đổ đầy; mọi field `en` để **trống** (không tự dịch).
- 22 route nguồn: gốc `index.html` + 21 thư mục con, tên thư mục là slug.
- Ảnh gốc nhận diện bằng cách loại hậu tố srcset `-<w>x<h>` trước phần mở rộng.

---

### Task 1: Dựng khung script + gom ảnh gốc

Pha `assets` bước một: quét `wp-content/uploads`, khử biến thể srcset, ra danh sách
ảnh gốc. Logic khử trùng là thứ dễ sai nhất nên viết test trước.

**Files:**
- Create: `scripts/import/paths.ts`
- Create: `scripts/import/assets.ts`
- Test: `tests/unit/import-assets.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: (không)
- Produces:
  - `paths.ts` → `ROOT: string`, `UPLOADS_DIR: string`, `OUT_DIR: string`, `ROUTES: string[]`
  - `assets.ts` → `stripSizeSuffix(filePath: string): string`,
    `collectOriginalImages(dir: string): Promise<string[]>` (đường dẫn tuyệt đối, đã sắp xếp)

- [ ] **Step 1: Cài dependency**

```bash
pnpm add -D tsx@4 cheerio@1.2.0 jsdom@26 @types/jsdom@21 \
  @portabletext/block-tools@6.0.0 @sanity/schema@6.13.2 dotenv@17
```

- [ ] **Step 2: Thêm script vào package.json**

Thêm vào khối `"scripts"`:

```json
"import:parse": "tsx scripts/import/parse.ts",
"import:assets": "tsx scripts/import/assets.ts",
"import:transform": "tsx scripts/import/transform.ts",
"import:run": "tsx scripts/import/run.ts",
"import": "pnpm import:parse && pnpm import:assets && pnpm import:transform && pnpm import:run"
```

- [ ] **Step 3: Viết test thất bại**

```ts
// tests/unit/import-assets.test.ts
import { describe, it, expect } from 'vitest'
import { stripSizeSuffix } from '@/scripts/import/assets'

describe('stripSizeSuffix()', () => {
  it('bỏ hậu tố kích thước srcset của WordPress', () => {
    expect(stripSizeSuffix('/u/2023/04/bed-300x300.png')).toBe('/u/2023/04/bed.png')
    expect(stripSizeSuffix('/u/2023/04/room-1024x683.jpg')).toBe('/u/2023/04/room.jpg')
    expect(stripSizeSuffix('/u/2023/04/a-150x150.jpeg')).toBe('/u/2023/04/a.jpeg')
  })

  it('giữ nguyên tên file vốn đã là bản gốc', () => {
    expect(stripSizeSuffix('/u/2023/04/bed.png')).toBe('/u/2023/04/bed.png')
    expect(stripSizeSuffix('/u/2023/04/royal-halong.jpg')).toBe('/u/2023/04/royal-halong.jpg')
  })

  it('KHÔNG cắt nhầm tên file có chữ số nhưng không phải hậu tố kích thước', () => {
    expect(stripSizeSuffix('/u/2023/04/buffet-2-9.jpg')).toBe('/u/2023/04/buffet-2-9.jpg')
    expect(stripSizeSuffix('/u/2023/04/quy-2-2023.jpg')).toBe('/u/2023/04/quy-2-2023.jpg')
    expect(stripSizeSuffix('/u/2023/04/img2x3.jpg')).toBe('/u/2023/04/img2x3.jpg')
  })

  it('chỉ cắt ở ngay trước phần mở rộng', () => {
    expect(stripSizeSuffix('/u/a-300x300/b.jpg')).toBe('/u/a-300x300/b.jpg')
  })
})
```

Ca `img2x3.jpg` quan trọng: thiếu dấu `-` đứng trước thì không phải hậu tố srcset.
Ca `quy-2-2023.jpg` là tên thật có trong repo, dễ bị regex ẩu cắt mất.

- [ ] **Step 4: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-assets.test.ts`
Expected: FAIL — không resolve được `@/scripts/import/assets`.

- [ ] **Step 5: Viết scripts/import/paths.ts**

```ts
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/** Gốc repo — scripts/import/ nằm sâu 2 cấp. */
export const ROOT = resolve(here, '../..')
export const UPLOADS_DIR = resolve(ROOT, 'wp-content/uploads')
export const OUT_DIR = resolve(ROOT, 'scripts/import/out')

/**
 * 22 route. Chuỗi rỗng là trang chủ (index.html ở gốc);
 * còn lại là tên thư mục, cũng chính là slug gốc cần giữ cho SEO.
 */
export const ROUTES = [
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
  'canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel',
  'quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh',
  'thong-cao-bao-chi-dhcd-ctcp-quoc-te-hoang-gia-khoi-sac-cung-du-lich-dia-phuong',
] as const

export function routeToHtmlPath(route: string): string {
  return route === '' ? resolve(ROOT, 'index.html') : resolve(ROOT, route, 'index.html')
}
```

- [ ] **Step 6: Viết scripts/import/assets.ts (phần gom, chưa upload)**

```ts
import { readdir, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'])

/**
 * Bỏ hậu tố kích thước mà WordPress gắn cho biến thể srcset:
 * `bed-300x300.png` -> `bed.png`.
 * Chỉ cắt khi mẫu `-<số>x<số>` nằm ngay trước phần mở rộng.
 */
export function stripSizeSuffix(filePath: string): string {
  return filePath.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1')
}

/** Quét đệ quy một thư mục, trả đường dẫn tuyệt đối mọi file ảnh. */
async function walkImages(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const found: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...(await walkImages(full)))
    } else if (IMAGE_EXT.has(extname(entry.name).toLowerCase())) {
      found.push(full)
    }
  }
  return found
}

/**
 * Trả danh sách ảnh GỐC: với mỗi nhóm biến thể srcset chỉ giữ một đường dẫn.
 * Ưu tiên file gốc thật nếu nó tồn tại trên đĩa; nếu chỉ có biến thể thì giữ
 * biến thể lớn nhất để không mất ảnh.
 */
export async function collectOriginalImages(dir: string): Promise<string[]> {
  const all = await walkImages(dir)
  const onDisk = new Set(all)
  const byOriginal = new Map<string, string>()

  for (const file of all) {
    const original = stripSizeSuffix(file)
    if (onDisk.has(original)) {
      byOriginal.set(original, original)
      continue
    }
    // Không có bản gốc: giữ biến thể to nhất theo kích thước file.
    const current = byOriginal.get(original)
    if (!current) {
      byOriginal.set(original, file)
    } else {
      const [a, b] = await Promise.all([stat(current), stat(file)])
      if (b.size > a.size) byOriginal.set(original, file)
    }
  }

  return [...byOriginal.values()].sort()
}
```

- [ ] **Step 7: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-assets.test.ts`
Expected: PASS, 4 test.

- [ ] **Step 8: Chạy thật để đối chiếu con số**

Tạo tạm một file và chạy:

```bash
pnpm tsx -e "
import { collectOriginalImages } from './scripts/import/assets.ts'
import { UPLOADS_DIR } from './scripts/import/paths.ts'
const list = await collectOriginalImages(UPLOADS_DIR)
console.log('ảnh gốc:', list.length)
"
```

Expected: in ra khoảng **213**. Nếu ra 1001 thì `stripSizeSuffix` không chạy;
nếu ra < 200 thì regex cắt quá tay — kiểm tra lại các ca test ở Step 3.

- [ ] **Step 9: Commit**

```bash
git add scripts/import/paths.ts scripts/import/assets.ts tests/unit/import-assets.test.ts package.json pnpm-lock.yaml
git commit -m "feat(b1): gom ảnh gốc, khử biến thể srcset của WordPress

1001 file -> ~213 ảnh gốc.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Chuyển HTML sang Portable Text

Mọi parser sau đều gọi hàm này. Phải dọn sạch wrapper của WPBakery/Salient trước
khi chuyển, nếu không Portable Text sẽ đầy block rỗng.

**Files:**
- Create: `scripts/import/html.ts`
- Test: `tests/unit/import-html.test.ts`

**Interfaces:**
- Consumes: (không)
- Produces:
  - `cleanHtml(html: string): string` — bỏ script/style/comment và wrapper rỗng
  - `toPortableText(html: string): PortableTextBlock[]`
  - `textOf(html: string): string` — văn bản thuần, đã gộp khoảng trắng

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/unit/import-html.test.ts
import { describe, it, expect } from 'vitest'
import { cleanHtml, toPortableText, textOf } from '@/scripts/import/html'

describe('cleanHtml()', () => {
  it('bỏ thẻ script và style cùng nội dung', () => {
    const out = cleanHtml('<p>Giữ</p><script>var a=1</script><style>p{color:red}</style>')
    expect(out).toContain('Giữ')
    expect(out).not.toContain('var a=1')
    expect(out).not.toContain('color:red')
  })

  it('bỏ comment HTML', () => {
    expect(cleanHtml('<p>A</p><!-- ghi chú -->')).not.toContain('ghi chú')
  })

  it('mở gói div rỗng của WPBakery nhưng giữ nội dung bên trong', () => {
    const html =
      '<div class="vc_column-inner"><div class="wpb_wrapper"><p>Nội dung</p></div></div>'
    const out = cleanHtml(html)
    expect(textOf(out)).toBe('Nội dung')
    expect(out).not.toContain('wpb_wrapper')
  })

  it('bỏ div trang trí không có chữ', () => {
    const out = cleanHtml('<div class="divider-border"></div><p>X</p>')
    expect(textOf(out)).toBe('X')
  })
})

describe('textOf()', () => {
  it('trả văn bản thuần và gộp khoảng trắng', () => {
    expect(textOf('<p>Phòng   Deluxe</p>\n<p>39 m2</p>')).toBe('Phòng Deluxe 39 m2')
  })

  it('giải mã HTML entity', () => {
    expect(textOf('<p>H&#7897;i ngh&#7883; &amp; Ti&#7879;c c&#432;&#7899;i</p>'))
      .toBe('Hội nghị & Tiệc cưới')
  })
})

describe('toPortableText()', () => {
  it('chuyển đoạn văn thành block kiểu normal', () => {
    const blocks = toPortableText('<p>Phòng Deluxe hướng biển.</p>')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]._type).toBe('block')
    expect(blocks[0].style).toBe('normal')
    expect(blocks[0].children[0].text).toBe('Phòng Deluxe hướng biển.')
  })

  it('giữ tiêu đề và danh sách', () => {
    const blocks = toPortableText('<h2>Luật chơi</h2><ul><li>Một</li><li>Hai</li></ul>')
    expect(blocks[0].style).toBe('h2')
    expect(blocks[1].listItem).toBe('bullet')
    expect(blocks).toHaveLength(3)
  })

  it('giữ chữ đậm thành decorator strong', () => {
    const blocks = toPortableText('<p>Giá <strong>500.000đ</strong></p>')
    const marked = blocks[0].children.find((c: any) => c.text === '500.000đ')
    expect(marked.marks).toContain('strong')
  })

  it('trả mảng rỗng khi HTML không có chữ', () => {
    expect(toPortableText('<div class="divider-border"></div>')).toEqual([])
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-html.test.ts`
Expected: FAIL — không resolve được module.

- [ ] **Step 3: Viết scripts/import/html.ts**

```ts
import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'
import { htmlToBlocks } from '@portabletext/block-tools'
import { Schema } from '@sanity/schema'
import type { PortableTextBlock } from 'sanity'

/** Class wrapper của WPBakery / Salient — mở gói, giữ con bên trong. */
const UNWRAP_CLASS = /(^|\s)(vc_|wpb_|nectar-|row_col_wrap|col span_|column_container)/

/** Phần tử thuần trang trí — xoá hẳn. */
const DROP_SELECTOR = [
  'script',
  'style',
  'noscript',
  'svg',
  '.divider-wrap',
  '.divider-border',
  '.clear',
  '.row-bg-wrap',
  '.nectar-shape-divider-wrap',
].join(',')

export function cleanHtml(html: string): string {
  const $ = cheerio.load(html, null, false)

  $(DROP_SELECTOR).remove()
  $('*')
    .contents()
    .filter((_, node) => node.type === 'comment')
    .remove()

  // Mở gói lặp cho tới khi không còn wrapper nào — wrapper lồng wrapper rất sâu.
  let unwrapped = true
  let guard = 0
  while (unwrapped && guard < 20) {
    unwrapped = false
    guard += 1
    $('div, span').each((_, el) => {
      const $el = $(el)
      const cls = $el.attr('class') ?? ''
      if (UNWRAP_CLASS.test(cls)) {
        $el.replaceWith($el.contents())
        unwrapped = true
      }
    })
  }

  // Bỏ phần tử rỗng còn sót (không chữ, không ảnh).
  $('div, span, p').each((_, el) => {
    const $el = $(el)
    if ($el.text().trim() === '' && $el.find('img').length === 0) $el.remove()
  })

  return $.html()
}

export function textOf(html: string): string {
  return cheerio.load(html, null, false).text().replace(/\s+/g, ' ').trim()
}

/** Schema block tối thiểu, khớp với localeBlock ở sanity/schemaTypes/objects/localeBlock.ts */
const compiled = Schema.compile({
  name: 'import',
  types: [
    {
      type: 'object',
      name: 'wrapper',
      fields: [
        {
          name: 'content',
          type: 'array',
          of: [
            {
              type: 'block',
              styles: [
                { title: 'Thường', value: 'normal' },
                { title: 'H2', value: 'h2' },
                { title: 'H3', value: 'h3' },
                { title: 'H4', value: 'h4' },
                { title: 'Trích dẫn', value: 'blockquote' },
              ],
              lists: [
                { title: 'Bullet', value: 'bullet' },
                { title: 'Number', value: 'number' },
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
                    fields: [
                      { name: 'href', type: 'url' },
                      { name: 'blank', type: 'boolean' },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
})

const blockContentType = compiled
  .get('wrapper')
  .fields.find((f: { name: string }) => f.name === 'content')!.type

export function toPortableText(html: string): PortableTextBlock[] {
  const cleaned = cleanHtml(html)
  if (textOf(cleaned) === '') return []
  const blocks = htmlToBlocks(cleaned, blockContentType, {
    parseHtml: (h: string) => new JSDOM(h).window.document,
  })
  return blocks as PortableTextBlock[]
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-html.test.ts`
Expected: PASS, 10 test.

Nếu test "giữ tiêu đề và danh sách" fail vì `blocks` có 2 phần tử thay vì 3, kiểm tra
`lists` trong schema compile — `htmlToBlocks` tách mỗi `<li>` thành một block riêng
có `listItem: 'bullet'`, nên `<h2>` + 2 `<li>` = 3 block.

- [ ] **Step 5: Commit**

```bash
git add scripts/import/html.ts tests/unit/import-html.test.ts
git commit -m "feat(b2): HTML -> Portable Text, dọn wrapper WPBakery/Salient

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Parser loại phòng

4 trang phòng có cấu trúc y hệt nhau nên đây là parser dễ kiểm chứng nhất, làm trước
để chốt hình dạng dữ liệu trung gian.

**Files:**
- Create: `scripts/import/types.ts`
- Create: `scripts/import/parsers/room.ts`
- Test: `tests/unit/import-room.test.ts`

**Interfaces:**
- Consumes: Task 1 (`paths.ts`), Task 2 (`html.ts`)
- Produces:
  - `types.ts` → interface `ParsedRoom`, `ParsedImageRef`, `LocaleSeed<T>`
  - `parsers/room.ts` → `parseRoom(html: string, slug: string): ParsedRoom`

- [ ] **Step 1: Viết scripts/import/types.ts**

```ts
import type { PortableTextBlock } from 'sanity'

/** Hạt giống song ngữ: chỉ đổ vi, en để trống cho biên tập viên nhập sau. */
export interface LocaleSeed<T> {
  vi: T
}

/** Tham chiếu tới một file ảnh trên đĩa, sẽ được thay bằng asset id ở pha transform. */
export interface ParsedImageRef {
  /** Đường dẫn tuyệt đối tới ảnh GỐC (đã khử biến thể srcset). */
  filePath: string
  alt?: string
}

export interface ParsedRoomFeature {
  icon?: ParsedImageRef
  label: string
}

export interface ParsedRoom {
  kind: 'room'
  slug: string
  title: string
  category: 'hotel' | 'villa'
  areaSqm?: number
  capacity?: string
  view?: string
  bedType?: string
  summary?: string
  description: PortableTextBlock[]
  heroImage?: ParsedImageRef
  gallery: ParsedImageRef[]
  features: ParsedRoomFeature[]
  order: number
}
```

- [ ] **Step 2: Viết test thất bại (dùng file HTML thật, không dựng fixture giả)**

```ts
// tests/unit/import-room.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parseRoom } from '@/scripts/import/parsers/room'
import { routeToHtmlPath } from '@/scripts/import/paths'
import type { ParsedRoom } from '@/scripts/import/types'

let deluxe: ParsedRoom

beforeAll(async () => {
  const html = await readFile(routeToHtmlPath('deluxe'), 'utf-8')
  deluxe = parseRoom(html, 'deluxe')
})

describe('parseRoom() trên trang deluxe thật', () => {
  it('lấy đúng tên phòng', () => {
    expect(deluxe.title).toBe('PHÒNG DELUXE')
  })

  it('lấy đúng diện tích dạng số', () => {
    expect(deluxe.areaSqm).toBe(39)
  })

  it('lấy đúng sức chứa, hướng phòng, loại giường', () => {
    expect(deluxe.capacity).toContain('2 khách')
    expect(deluxe.view).toContain('Hướng biển')
    expect(deluxe.bedType).toContain('Giường đôi')
  })

  it('lấy đủ 16 tiện nghi', () => {
    expect(deluxe.features).toHaveLength(16)
  })

  it('mỗi tiện nghi có nhãn không rỗng', () => {
    for (const f of deluxe.features) {
      expect(f.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('tiện nghi có icon trỏ tới file ảnh gốc, không phải biến thể 300x300', () => {
    const withIcon = deluxe.features.filter((f) => f.icon)
    expect(withIcon.length).toBeGreaterThan(10)
    for (const f of withIcon) {
      expect(f.icon!.filePath).not.toMatch(/-\d+x\d+\.(png|jpg|jpeg)$/)
    }
  })

  it('phân loại đúng là phòng khách sạn', () => {
    expect(deluxe.category).toBe('hotel')
  })

  it('có mô tả dạng Portable Text không rỗng', () => {
    expect(deluxe.description.length).toBeGreaterThan(0)
    expect(deluxe.description[0]._type).toBe('block')
  })

  it('có ảnh đại diện', () => {
    expect(deluxe.heroImage?.filePath).toBeTruthy()
  })
})

describe('parseRoom() phân loại villa', () => {
  it('villas-suite và villas-deluxe là villa', async () => {
    for (const slug of ['villas-suite', 'villas-deluxe']) {
      const html = await readFile(routeToHtmlPath(slug), 'utf-8')
      expect(parseRoom(html, slug).category).toBe('villa')
    }
  })
})
```

Test chạy trên HTML thật trong repo nên không cần fixture riêng, và nếu ai đó lỡ sửa
file nguồn thì test đỏ ngay.

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-room.test.ts`
Expected: FAIL — không resolve được `@/scripts/import/parsers/room`.

- [ ] **Step 4: Viết scripts/import/parsers/room.ts**

```ts
import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { stripSizeSuffix } from '../assets'
import { toPortableText, textOf } from '../html'
import type { ParsedRoom, ParsedRoomFeature, ParsedImageRef } from '../types'

const ORDER: Record<string, number> = {
  deluxe: 1,
  premium: 2,
  'villas-suite': 3,
  'villas-deluxe': 4,
}

/**
 * `src` trong HTML là đường dẫn tương đối kiểu `../wp-content/uploads/...`.
 * Đổi thành đường dẫn tuyệt đối tới ảnh GỐC trên đĩa.
 */
function toImageRef(src: string | undefined, routeDir: string): ParsedImageRef | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('http')) return undefined
  const abs = resolve(routeDir, src)
  return { filePath: stripSizeSuffix(abs) }
}

/** Lấy phần sau dấu hai chấm: "Diện tích: 39 m2" -> "39 m2" */
function afterColon(label: string): string {
  const i = label.indexOf(':')
  return i === -1 ? label.trim() : label.slice(i + 1).trim()
}

export function parseRoom(html: string, slug: string): ParsedRoom {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, slug, 'index.html'))

  const title = textOf($('h3').first().html() ?? '')

  // Tiện nghi: mỗi mục là .iwithtext gồm .iwt-icon img + .iwt-text
  const features: ParsedRoomFeature[] = []
  $('.iwithtext').each((_, el) => {
    const label = textOf($(el).find('.iwt-text').html() ?? '')
    if (!label) return
    features.push({
      label,
      icon: toImageRef($(el).find('.iwt-icon img').attr('src'), routeDir),
    })
  })

  const findFeature = (prefix: string) =>
    features.find((f) => f.label.toLowerCase().startsWith(prefix.toLowerCase()))?.label

  const areaLabel = findFeature('Diện tích')
  const areaMatch = areaLabel?.match(/(\d+(?:[.,]\d+)?)/)

  // Mô tả: các <p> trong khối nội dung chính, trước phần "TÍNH NĂNG PHÒNG"
  const bodyHtml = $('.wpb_text_column').slice(0, 2).html() ?? ''

  const gallery: ParsedImageRef[] = []
  $('.wpb_gallery img, .nectar-flickity img').each((_, el) => {
    const ref = toImageRef($(el).attr('src'), routeDir)
    if (ref) gallery.push(ref)
  })

  const heroImage =
    toImageRef($('.page-header-bg-image img').attr('src'), routeDir) ??
    toImageRef($('img').first().attr('src'), routeDir)

  return {
    kind: 'room',
    slug,
    title,
    category: slug.startsWith('villas') ? 'villa' : 'hotel',
    areaSqm: areaMatch ? Number(areaMatch[1].replace(',', '.')) : undefined,
    capacity: findFeature('Sức chứa') ? afterColon(findFeature('Sức chứa')!) : undefined,
    view: findFeature('Hướng phòng') ? afterColon(findFeature('Hướng phòng')!) : undefined,
    bedType: findFeature('Loại giường') ? afterColon(findFeature('Loại giường')!) : undefined,
    summary: textOf(bodyHtml).slice(0, 300) || undefined,
    description: toPortableText(bodyHtml),
    heroImage,
    gallery,
    features,
    order: ORDER[slug] ?? 99,
  }
}
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-room.test.ts`
Expected: PASS, 10 test.

Nếu test diện tích fail, in thử `deluxe.features.map(f => f.label)` để xem nhãn thật
rồi chỉnh `findFeature`. Nhãn bản gốc là `Diện tích: 39 m2`.

- [ ] **Step 6: Commit**

```bash
git add scripts/import/types.ts scripts/import/parsers/room.ts tests/unit/import-room.test.ts
git commit -m "feat(b3): parser loại phòng — 16 tiện nghi, diện tích, hướng, giường

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Parser bài viết và ưu đãi

**Files:**
- Create: `scripts/import/parsers/post.ts`, `scripts/import/parsers/offer.ts`
- Modify: `scripts/import/types.ts`
- Test: `tests/unit/import-post.test.ts`

**Interfaces:**
- Consumes: Task 1, 2, 3
- Produces:
  - `types.ts` thêm `ParsedPost`, `ParsedOffer`
  - `parsePost(html, slug): ParsedPost`
  - `parseOffers(html, slug): ParsedOffer[]` — trang `offers` chứa nhiều ưu đãi trong một file

- [ ] **Step 1: Thêm interface vào types.ts**

```ts
export interface ParsedPost {
  kind: 'post'
  slug: string
  title: string
  category: 'news' | 'announcement'
  publishedAt: string // ISO 8601
  excerpt?: string
  coverImage?: ParsedImageRef
  body: PortableTextBlock[]
  author?: string
}

export interface ParsedOffer {
  kind: 'offer'
  slug: string
  title: string
  excerpt?: string
  image?: ParsedImageRef
  body: PortableTextBlock[]
  priceNote?: string
  order: number
}
```

- [ ] **Step 2: Viết test thất bại**

```ts
// tests/unit/import-post.test.ts
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parsePost } from '@/scripts/import/parsers/post'
import { routeToHtmlPath } from '@/scripts/import/paths'

const FB_WARNING = 'canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel'
const RIC_Q2 = 'quy-2-2023-ctcp-quoc-te-hoang-gia-ric-kien-tri-voi-muc-tieu-kinh-doanh-on-dinh'

describe('parsePost()', () => {
  it('lấy ngày đăng từ JSON-LD của Yoast', async () => {
    const html = await readFile(routeToHtmlPath(FB_WARNING), 'utf-8')
    const post = parsePost(html, FB_WARNING)
    expect(post.publishedAt.startsWith('2025-04-01')).toBe(true)
  })

  it('lấy ngày đúng cho bài quý 2/2023', async () => {
    const html = await readFile(routeToHtmlPath(RIC_Q2), 'utf-8')
    expect(parsePost(html, RIC_Q2).publishedAt.startsWith('2023-07-20')).toBe(true)
  })

  it('lấy tiêu đề không kèm hậu tố tên site', async () => {
    const html = await readFile(routeToHtmlPath(FB_WARNING), 'utf-8')
    const post = parsePost(html, FB_WARNING)
    expect(post.title.length).toBeGreaterThan(10)
    expect(post.title).not.toContain('Royal Halong Hotel -')
  })

  it('có nội dung Portable Text đáng kể', async () => {
    const html = await readFile(routeToHtmlPath(RIC_Q2), 'utf-8')
    const post = parsePost(html, RIC_Q2)
    expect(post.body.length).toBeGreaterThan(3)
  })

  it('mặc định xếp vào chuyên mục news', async () => {
    const html = await readFile(routeToHtmlPath(RIC_Q2), 'utf-8')
    expect(parsePost(html, RIC_Q2).category).toBe('news')
  })
})
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-post.test.ts`
Expected: FAIL — module chưa tồn tại.

- [ ] **Step 4: Viết scripts/import/parsers/post.ts**

```ts
import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { stripSizeSuffix } from '../assets'
import { toPortableText, textOf } from '../html'
import type { ParsedPost, ParsedImageRef } from '../types'

function toImageRef(src: string | undefined, routeDir: string): ParsedImageRef | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('http')) return undefined
  return { filePath: stripSizeSuffix(resolve(routeDir, src)) }
}

/** Yoast nhúng một graph JSON-LD; datePublished trong đó đáng tin hơn HTML hiển thị. */
function datePublishedFrom(html: string): string {
  const match = html.match(/"datePublished"\s*:\s*"([^"]+)"/)
  return match ? match[1] : new Date().toISOString()
}

export function parsePost(html: string, slug: string): ParsedPost {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, slug, 'index.html'))

  const title =
    textOf($('h1.entry-title').html() ?? '') ||
    textOf($('.page-header-content h1').html() ?? '') ||
    textOf($('h3').first().html() ?? '') ||
    ($('meta[property="og:title"]').attr('content') ?? '').replace(/\s*-\s*Royal.*$/i, '').trim()

  const bodyHtml =
    $('.post-content .content-inner').html() ??
    $('.entry-content').html() ??
    $('.post-area .content-inner').html() ??
    ''

  return {
    kind: 'post',
    slug,
    title,
    category: 'news',
    publishedAt: datePublishedFrom(html),
    excerpt: ($('meta[name="description"]').attr('content') ?? '').trim() || undefined,
    coverImage: toImageRef(
      $('meta[property="og:image"]').attr('content') ?? $('.post-featured-img img').attr('src'),
      routeDir,
    ),
    body: toPortableText(bodyHtml),
    author: textOf($('.meta-author a').html() ?? '') || undefined,
  }
}
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-post.test.ts`
Expected: PASS, 5 test.

- [ ] **Step 6: Viết scripts/import/parsers/offer.ts**

Trang `offers` chứa nhiều ưu đãi trong cùng một file, mỗi ưu đãi bắt đầu bằng một `h4`.

```ts
import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { stripSizeSuffix } from '../assets'
import { toPortableText, textOf } from '../html'
import type { ParsedOffer, ParsedImageRef } from '../types'

/** h4 không phải tiêu đề ưu đãi — là khối CTA/điều hướng lặp ở cuối mọi trang. */
const NOT_AN_OFFER = [
  'Thông tin liên lạc',
  'Tiệc cưới',
  'Chương trình ưu đãi',
  'Lưu trú',
  'Cung Hội Nghị',
]

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function toImageRef(src: string | undefined, routeDir: string): ParsedImageRef | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('http')) return undefined
  return { filePath: stripSizeSuffix(resolve(routeDir, src)) }
}

export function parseOffers(html: string, route = 'offers'): ParsedOffer[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, route, 'index.html'))
  const offers: ParsedOffer[] = []

  $('h4').each((index, el) => {
    const title = textOf($(el).html() ?? '')
    if (!title) return
    if (NOT_AN_OFFER.some((skip) => title.toLowerCase().includes(skip.toLowerCase()))) return

    // Nội dung ưu đãi = mọi phần tử anh em cho tới h4 kế tiếp.
    const chunk = $(el).nextUntil('h4')
    const bodyHtml = chunk.map((_, n) => $.html(n)).get().join('')

    const priceMatch = title.match(/(?:TỪ|CHỈ TỪ)\s+[\d.,]+\s*(?:VNĐ|VND|đ)[^|]*/i)

    offers.push({
      kind: 'offer',
      slug: slugify(title),
      title,
      excerpt: textOf(bodyHtml).slice(0, 200) || undefined,
      image: toImageRef(chunk.find('img').first().attr('src'), routeDir),
      body: toPortableText(bodyHtml),
      priceNote: priceMatch ? priceMatch[0].trim() : undefined,
      order: index,
    })
  })

  return offers
}
```

- [ ] **Step 7: Kiểm chứng parser ưu đãi trên dữ liệu thật**

```bash
pnpm tsx -e "
import { readFile } from 'node:fs/promises'
import { parseOffers } from './scripts/import/parsers/offer.ts'
import { routeToHtmlPath } from './scripts/import/paths.ts'
const html = await readFile(routeToHtmlPath('offers'), 'utf-8')
const offers = parseOffers(html)
console.log('số ưu đãi:', offers.length)
for (const o of offers) console.log(' -', o.slug, '|', o.priceNote ?? '(không giá)')
"
```

Expected: **3** ưu đãi — buffet 2/9, đám cưới cổ tích, bún bề bề. Nếu ra nhiều hơn
thì có `h4` điều hướng lọt qua; thêm vào `NOT_AN_OFFER`.

- [ ] **Step 8: Commit**

```bash
git add scripts/import/parsers scripts/import/types.ts tests/unit/import-post.test.ts
git commit -m "feat(b4): parser bài viết (ngày từ JSON-LD Yoast) và ưu đãi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Parser venue, hall, gallery, testimonial

**Files:**
- Create: `scripts/import/parsers/venue.ts`, `hall.ts`, `gallery.ts`, `testimonial.ts`
- Modify: `scripts/import/types.ts`
- Test: `tests/unit/import-misc.test.ts`

**Interfaces:**
- Consumes: Task 1–4
- Produces: `parseVenues(html, route): ParsedVenue[]`, `parseHalls(html): ParsedHall[]`,
  `parseGalleryAlbums(html): ParsedAlbum[]`, `parseTestimonials(html): ParsedTestimonial[]`

- [ ] **Step 1: Thêm interface vào types.ts**

```ts
export interface ParsedVenue {
  kind: 'venue'
  slug: string
  name: string
  venueKind: 'dining' | 'facility'
  location?: string
  capacity?: string
  hours?: string
  highlights: string[]
  description: PortableTextBlock[]
  image?: ParsedImageRef
  menuUrl?: string
  phone?: string
  order: number
}

export interface ParsedHall {
  kind: 'hall'
  slug: string
  name: string
  areaSqm?: number
  capacity?: string
  description: PortableTextBlock[]
  image?: ParsedImageRef
  order: number
}

export interface ParsedAlbum {
  kind: 'album'
  slug: string
  title: string
  images: ParsedImageRef[]
  order: number
}

export interface ParsedTestimonial {
  kind: 'testimonial'
  heading: string
  quote: string
  author: string
  source: string
  order: number
}
```

- [ ] **Step 2: Viết test thất bại**

```ts
// tests/unit/import-misc.test.ts
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { routeToHtmlPath } from '@/scripts/import/paths'
import { parseVenues } from '@/scripts/import/parsers/venue'
import { parseHalls } from '@/scripts/import/parsers/hall'
import { parseGalleryAlbums } from '@/scripts/import/parsers/gallery'
import { parseTestimonials } from '@/scripts/import/parsers/testimonial'

const read = (r: string) => readFile(routeToHtmlPath(r), 'utf-8')

describe('parseVenues()', () => {
  it('lấy 4 điểm ẩm thực từ trang culinary', async () => {
    const venues = parseVenues(await read('culinary'), 'culinary', 'dining')
    const names = venues.map((v) => v.name.toUpperCase())
    expect(names).toContain('PIANO BAR')
    expect(names).toContain('POOL BAR')
    expect(names).toContain('LA TERRASSE')
    expect(venues.every((v) => v.venueKind === 'dining')).toBe(true)
  })

  it('lấy tiện ích từ trang experiences', async () => {
    const venues = parseVenues(await read('experiences'), 'experiences', 'facility')
    const names = venues.map((v) => v.name.toUpperCase())
    expect(names).toContain('FITNESS CENTER')
    expect(names).toContain('RENATA SPA')
    expect(venues.every((v) => v.venueKind === 'facility')).toBe(true)
  })
})

describe('parseHalls()', () => {
  it('lấy 3 phòng của cung hội nghị với diện tích', async () => {
    const halls = parseHalls(await read('royal-international-convention-palace'))
    expect(halls).toHaveLength(3)
    const halong = halls.find((h) => h.name.toUpperCase().includes('HA LONG'))
    expect(halong?.areaSqm).toBe(762)
  })
})

describe('parseGalleryAlbums()', () => {
  it('lấy 5 album, mỗi album có ảnh và không lẫn ảnh trùng', async () => {
    const albums = parseGalleryAlbums(await read('our-gallery'))
    expect(albums).toHaveLength(5)
    for (const album of albums) {
      expect(album.images.length).toBeGreaterThan(0)
      const paths = album.images.map((i) => i.filePath)
      expect(new Set(paths).size).toBe(paths.length)
    }
  })
})

describe('parseTestimonials()', () => {
  it('lấy 4 cảm nhận từ trang chủ', async () => {
    const items = parseTestimonials(await read(''))
    expect(items).toHaveLength(4)
    expect(items.every((t) => t.quote.length > 20)).toBe(true)
    expect(items.every((t) => t.author.length > 0)).toBe(true)
  })
})
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-misc.test.ts`
Expected: FAIL — 4 module chưa tồn tại.

- [ ] **Step 4: Viết scripts/import/parsers/shared.ts (tiện ích dùng chung)**

```ts
import { resolve } from 'node:path'
import { stripSizeSuffix } from '../assets'
import type { ParsedImageRef } from '../types'

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function toImageRef(
  src: string | undefined,
  routeDir: string,
): ParsedImageRef | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('http')) return undefined
  return { filePath: stripSizeSuffix(resolve(routeDir, src)) }
}
```

Sau khi tạo file này, sửa `parsers/room.ts`, `parsers/post.ts`, `parsers/offer.ts`
để import `slugify`/`toImageRef` từ đây thay vì định nghĩa riêng — chạy lại test của
Task 3 và 4 để chắc không vỡ.

- [ ] **Step 5: Viết parsers/venue.ts**

```ts
import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef } from './shared'
import type { ParsedVenue } from '../types'

const NOT_A_VENUE = ['Tiệc cưới', 'Chương trình ưu đãi', 'Lưu trú', 'Cung Hội Nghị']

/** Nhặt giá trị đứng ngay sau một nhãn h5, ví dụ "SỨC CHỨA" -> "250 khách". */
function valueAfterLabel($: cheerio.CheerioAPI, scope: cheerio.Cheerio<any>, label: string) {
  let found: string | undefined
  scope.find('h5').each((_, el) => {
    if (textOf($(el).html() ?? '').toUpperCase().includes(label.toUpperCase())) {
      const next = $(el).next('h5')
      if (next.length) found = textOf(next.html() ?? '')
    }
  })
  return found
}

export function parseVenues(
  html: string,
  route: string,
  venueKind: 'dining' | 'facility',
): ParsedVenue[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, route, 'index.html'))
  const venues: ParsedVenue[] = []

  // Nhà hàng chính nằm ở h5, các outlet còn lại ở h4.
  $('h4, h5').each((index, el) => {
    const name = textOf($(el).html() ?? '')
    if (!name || name.length > 60) return
    if (NOT_A_VENUE.some((s) => name.toLowerCase().includes(s.toLowerCase()))) return
    // Chỉ nhận tên viết hoa — quy ước của bản gốc cho tên outlet.
    if (name !== name.toUpperCase()) return
    if (venues.some((v) => v.name === name)) return

    const chunk = $(el).nextUntil('h4')
    const bodyHtml = chunk.map((_, n) => $.html(n)).get().join('')

    venues.push({
      kind: 'venue',
      slug: slugify(name),
      name,
      venueKind,
      location: valueAfterLabel($, chunk, 'ĐỊA ĐIỂM'),
      capacity: valueAfterLabel($, chunk, 'SỨC CHỨA'),
      hours: valueAfterLabel($, chunk, 'MỞ CỬA'),
      highlights: chunk
        .find('li')
        .map((_, li) => textOf($(li).html() ?? ''))
        .get()
        .filter(Boolean),
      description: toPortableText(bodyHtml),
      image: toImageRef(chunk.find('img').first().attr('src'), routeDir),
      menuUrl: chunk.find('a[href*="drive.google.com"]').first().attr('href'),
      phone: (textOf(bodyHtml).match(/0\d[\d\s.]{7,}/) ?? [])[0]?.trim(),
      order: index,
    })
  })

  return venues
}
```

- [ ] **Step 6: Viết parsers/hall.ts**

```ts
import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { slugify, toImageRef } from './shared'
import type { ParsedHall } from '../types'

const ROUTE = 'royal-international-convention-palace'
const NOT_A_HALL = ['Lưu trú', 'Chương trình ưu đãi', 'Tiệc cưới']

export function parseHalls(html: string): ParsedHall[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, ROUTE, 'index.html'))
  const halls: ParsedHall[] = []

  $('h4').each((index, el) => {
    const name = textOf($(el).html() ?? '')
    if (!name) return
    if (NOT_A_HALL.some((s) => name.toLowerCase().includes(s.toLowerCase()))) return

    // h5 ngay sau h4 chứa "DIỆN TÍCH: 762 M2 | SỨC CHỨA: 1.000"
    const meta = textOf($(el).next('h5').html() ?? '')
    const areaMatch = meta.match(/DIỆN TÍCH:\s*([\d.,]+)/i)
    const capMatch = meta.match(/SỨC CHỨA:\s*([\d.,]+)/i)

    const chunk = $(el).nextUntil('h4')
    halls.push({
      kind: 'hall',
      slug: slugify(name),
      name,
      areaSqm: areaMatch ? Number(areaMatch[1].replace(/[.,]/g, '')) : undefined,
      capacity: capMatch ? capMatch[1] : undefined,
      description: toPortableText(chunk.map((_, n) => $.html(n)).get().join('')),
      image: toImageRef(chunk.find('img').first().attr('src'), routeDir),
      order: index,
    })
  })

  return halls
}
```

- [ ] **Step 7: Viết parsers/gallery.ts**

```ts
import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { textOf } from '../html'
import { slugify, toImageRef } from './shared'
import type { ParsedAlbum, ParsedImageRef } from '../types'

const ROUTE = 'our-gallery'

export function parseGalleryAlbums(html: string): ParsedAlbum[] {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, ROUTE, 'index.html'))
  const albums: ParsedAlbum[] = []

  $('.wpb_gallery').each((index, el) => {
    // Tiêu đề album là h5 gần nhất phía trước khối gallery.
    const title = textOf($(el).prevAll('h5').first().html() ?? '') || `Album ${index + 1}`

    // Flickity nhân bản slide -> khử trùng theo đường dẫn ảnh gốc.
    const seen = new Set<string>()
    const images: ParsedImageRef[] = []
    $(el)
      .find('img')
      .each((_, img) => {
        const ref = toImageRef($(img).attr('src'), routeDir)
        if (!ref || seen.has(ref.filePath)) return
        seen.add(ref.filePath)
        images.push({ ...ref, alt: $(img).attr('alt') || undefined })
      })

    if (images.length === 0) return
    albums.push({ kind: 'album', slug: slugify(title), title, images, order: index })
  })

  return albums
}
```

- [ ] **Step 8: Viết parsers/testimonial.ts**

```ts
import * as cheerio from 'cheerio'
import { textOf } from '../html'
import type { ParsedTestimonial } from '../types'

export function parseTestimonials(html: string): ParsedTestimonial[] {
  const $ = cheerio.load(html)
  const items: ParsedTestimonial[] = []

  // Bản gốc để mỗi review trong một khối có dấu ngoặc kép cong và chữ Tripadvisor.
  $('h4').each((index, el) => {
    const heading = textOf($(el).html() ?? '')
    const chunk = $(el).nextUntil('h4')
    const raw = textOf(chunk.map((_, n) => $.html(n)).get().join(''))
    if (!raw.includes('“') || !/tripadvisor/i.test(raw)) return

    const quoteMatch = raw.match(/“([^”]+)”/)
    if (!quoteMatch) return

    // Phần sau dấu đóng ngoặc: "<Tác giả> Tripadvisor"
    const after = raw.slice(raw.indexOf('”') + 1).trim()
    const author = after.replace(/tripadvisor/i, '').trim()

    items.push({
      kind: 'testimonial',
      heading,
      quote: quoteMatch[1].trim(),
      author: author || 'Khách lưu trú',
      source: 'TripAdvisor',
      order: index,
    })
  })

  return items
}
```

- [ ] **Step 9: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-misc.test.ts`
Expected: PASS, 5 test.

Nếu `parseVenues` trả thừa mục, in `venues.map(v => v.name)` và bổ sung `NOT_A_VENUE`.
Nếu `parseGalleryAlbums` trả khác 5, đếm `$('.wpb_gallery').length` — phải là 5.

- [ ] **Step 10: Chạy lại toàn bộ test đảm bảo shared.ts không làm vỡ Task 3–4**

Run: `pnpm test`
Expected: tất cả PASS.

- [ ] **Step 11: Commit**

```bash
git add scripts/import/parsers scripts/import/types.ts tests/unit/import-misc.test.ts
git commit -m "feat(b5): parser venue/hall/gallery/testimonial + tiện ích dùng chung

Gallery khử trùng slide nhân bản của Flickity theo đường dẫn ảnh gốc.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Parser trang chung → mảng section

Các trang còn lại (casino, wedding, lưu trú, pháp lý, reservation, payment-methods…)
đổ vào `page.sections[]`.

**Files:**
- Create: `scripts/import/parsers/page.ts`
- Create: `scripts/import/parse.ts` (điều phối toàn bộ pha 1)
- Modify: `scripts/import/types.ts`
- Test: `tests/unit/import-page.test.ts`

**Interfaces:**
- Consumes: Task 1–5
- Produces:
  - `types.ts` thêm `ParsedPage`, `ParsedSection`, `ParsedDataset`
  - `parsers/page.ts` → `parsePage(html, slug): ParsedPage`
  - `parse.ts` → chạy được bằng `pnpm import:parse`, ghi `out/parsed.json`

- [ ] **Step 1: Thêm interface vào types.ts**

```ts
export type ParsedSection =
  | { _type: 'heroSection'; heading: string; subheading?: string; background?: ParsedImageRef }
  | { _type: 'richTextSection'; heading?: string; content: PortableTextBlock[]; background: 'white' | 'cream' | 'ink' }
  | { _type: 'tableSection'; heading?: string; headers: string[]; rows: string[][] }
  | { _type: 'bookingWidgetSection' }
  | { _type: 'galleryCarouselSection'; heading?: string; albumSlug: string }
  | { _type: 'postListSection'; heading?: string; category: 'news' | 'announcement'; limit: number }

export interface ParsedPage {
  kind: 'page'
  slug: string
  title: string
  sections: ParsedSection[]
  metaDescription?: string
}

export interface ParsedDataset {
  rooms: ParsedRoom[]
  posts: ParsedPost[]
  offers: ParsedOffer[]
  venues: ParsedVenue[]
  halls: ParsedHall[]
  albums: ParsedAlbum[]
  testimonials: ParsedTestimonial[]
  pages: ParsedPage[]
}
```

- [ ] **Step 2: Viết test thất bại**

```ts
// tests/unit/import-page.test.ts
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parsePage } from '@/scripts/import/parsers/page'
import { routeToHtmlPath } from '@/scripts/import/paths'

const read = (r: string) => readFile(routeToHtmlPath(r), 'utf-8')

describe('parsePage()', () => {
  it('trang casino có hero và ít nhất một bảng luật Baccarat', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    expect(page.sections[0]._type).toBe('heroSection')
    const tables = page.sections.filter((s) => s._type === 'tableSection')
    expect(tables.length).toBeGreaterThanOrEqual(1)
  })

  it('bảng Baccarat có hàng tiêu đề và các hàng dữ liệu', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    const table = page.sections.find((s) => s._type === 'tableSection') as any
    expect(table.headers.length).toBeGreaterThan(0)
    expect(table.rows.length).toBeGreaterThan(0)
    // mọi hàng có cùng số ô với hàng tiêu đề
    for (const row of table.rows) {
      expect(row.length).toBe(table.headers.length)
    }
  })

  it('trang reservation có khối widget đặt phòng', async () => {
    const page = await read('reservation').then((h) => parsePage(h, 'reservation'))
    expect(page.sections.some((s) => s._type === 'bookingWidgetSection')).toBe(true)
  })

  it('trang news và our-announcement có khối danh sách bài viết', async () => {
    for (const [slug, category] of [
      ['news', 'news'],
      ['our-announcement', 'announcement'],
    ] as const) {
      const page = await read(slug).then((h) => parsePage(h, slug))
      const list = page.sections.find((sec) => sec._type === 'postListSection') as any
      expect(list, `${slug} phải có postListSection`).toBeTruthy()
      expect(list.category).toBe(category)
    }
  })

  it('trang thường KHÔNG có khối danh sách bài viết', async () => {
    const page = await read('casino').then((h) => parsePage(h, 'casino'))
    expect(page.sections.some((sec) => sec._type === 'postListSection')).toBe(false)
  })

  it('trang chính sách bảo mật có nội dung văn bản dài', async () => {
    const page = await read('privacy-policy').then((h) => parsePage(h, 'privacy-policy'))
    const rich = page.sections.filter((s) => s._type === 'richTextSection') as any[]
    const total = rich.reduce((n, s) => n + s.content.length, 0)
    expect(total).toBeGreaterThan(10)
  })

  it('lấy được tiêu đề trang', async () => {
    const page = await read('wedding').then((h) => parsePage(h, 'wedding'))
    expect(page.title.length).toBeGreaterThan(0)
  })
})

describe('slug giữ nguyên để không mất SEO', () => {
  it('không đổi tên slug gốc', async () => {
    const page = await read('luu-tru-phong-khach-san-villas').then((h) =>
      parsePage(h, 'luu-tru-phong-khach-san-villas'),
    )
    expect(page.slug).toBe('luu-tru-phong-khach-san-villas')
  })
})
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-page.test.ts`
Expected: FAIL.

- [ ] **Step 4: Viết parsers/page.ts**

```ts
import * as cheerio from 'cheerio'
import { resolve, dirname } from 'node:path'
import { ROOT } from '../paths'
import { toPortableText, textOf } from '../html'
import { toImageRef } from './shared'
import type { ParsedPage, ParsedSection } from '../types'

export function parsePage(html: string, slug: string): ParsedPage {
  const $ = cheerio.load(html)
  const routeDir = dirname(resolve(ROOT, slug === '' ? '.' : slug, 'index.html'))
  const sections: ParsedSection[] = []

  const heading =
    textOf($('.page-header-content h1').html() ?? '') ||
    textOf($('h3').first().html() ?? '') ||
    textOf($('h1').first().html() ?? '')

  const subheading = textOf($('.page-header-content h5').first().html() ?? '') || undefined

  sections.push({
    _type: 'heroSection',
    heading: heading || slug,
    subheading,
    background:
      toImageRef($('.page-header-bg-image img').attr('src'), routeDir) ??
      toImageRef($('img').first().attr('src'), routeDir),
  })

  // Bảng: mỗi <table> thành một tableSection.
  $('table').each((_, el) => {
    const headers = $(el)
      .find('tr')
      .first()
      .find('th, td')
      .map((_, c) => textOf($(c).html() ?? ''))
      .get()
    if (headers.length === 0) return

    const rows: string[][] = []
    $(el)
      .find('tr')
      .slice(1)
      .each((_, tr) => {
        const cells = $(tr)
          .find('td, th')
          .map((_, c) => textOf($(c).html() ?? ''))
          .get()
        if (cells.length === 0) return
        // Chuẩn hoá độ dài hàng bằng hàng tiêu đề để render không lệch cột.
        while (cells.length < headers.length) cells.push('')
        rows.push(cells.slice(0, headers.length))
      })

    if (rows.length > 0) sections.push({ _type: 'tableSection', headers, rows })
  })

  // Widget đặt phòng của SecureBookings.
  if (html.includes('securebookings.net')) {
    sections.push({ _type: 'bookingWidgetSection' })
  }

  // Hai trang danh sách bài viết. Không có khối này thì /news và /our-announcement
  // chỉ còn hero — bài viết không hiện ở đâu cả.
  if (slug === 'news' || slug === 'our-announcement') {
    sections.push({
      _type: 'postListSection',
      category: slug === 'news' ? 'news' : 'announcement',
      limit: 12,
    })
  }

  // Phần văn bản: mỗi .wpb_text_column thành một richTextSection.
  $('.wpb_text_column').each((index, el) => {
    const content = toPortableText($(el).html() ?? '')
    if (content.length === 0) return
    sections.push({
      _type: 'richTextSection',
      content,
      background: index % 2 === 1 ? 'cream' : 'white',
    })
  })

  return {
    kind: 'page',
    slug,
    title: heading || slug,
    sections,
    metaDescription: ($('meta[name="description"]').attr('content') ?? '').trim() || undefined,
  }
}
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-page.test.ts`
Expected: PASS, 6 test.

Nếu test bảng Baccarat fail vì `tables.length === 0`, kiểm tra bản gốc có dùng `<table>`
thật hay dựng bảng bằng div — chạy
`grep -c '<table' casino/index.html`. Nếu là 0 thì bảng dựng bằng div lưới `h5`, khi đó
đổi selector sang `.row .col` và cập nhật test cho khớp thực tế.

- [ ] **Step 6: Viết scripts/import/parse.ts điều phối pha 1**

```ts
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { OUT_DIR, ROUTES, routeToHtmlPath } from './paths'
import { parseRoom } from './parsers/room'
import { parsePost } from './parsers/post'
import { parseOffers } from './parsers/offer'
import { parseVenues } from './parsers/venue'
import { parseHalls } from './parsers/hall'
import { parseGalleryAlbums } from './parsers/gallery'
import { parseTestimonials } from './parsers/testimonial'
import { parsePage } from './parsers/page'
import type { ParsedDataset } from './types'

const ROOM_SLUGS = ['deluxe', 'premium', 'villas-deluxe', 'villas-suite']
const POST_SLUGS = ROUTES.filter((r) => r.length > 40)

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const read = (r: string) => readFile(routeToHtmlPath(r), 'utf-8')

  const dataset: ParsedDataset = {
    rooms: [],
    posts: [],
    offers: [],
    venues: [],
    halls: [],
    albums: [],
    testimonials: [],
    pages: [],
  }

  for (const slug of ROOM_SLUGS) {
    dataset.rooms.push(parseRoom(await read(slug), slug))
  }
  for (const slug of POST_SLUGS) {
    dataset.posts.push(parsePost(await read(slug), slug))
  }

  dataset.offers = parseOffers(await read('offers'))
  dataset.venues = [
    ...parseVenues(await read('culinary'), 'culinary', 'dining'),
    ...parseVenues(await read('experiences'), 'experiences', 'facility'),
  ]
  dataset.halls = parseHalls(await read('royal-international-convention-palace'))
  dataset.albums = parseGalleryAlbums(await read('our-gallery'))
  dataset.testimonials = parseTestimonials(await read(''))

  // Mọi route còn lại thành `page`.
  const handled = new Set([...ROOM_SLUGS, ...POST_SLUGS])
  for (const route of ROUTES) {
    if (handled.has(route)) continue
    dataset.pages.push(parsePage(await read(route), route))
  }

  const outFile = `${OUT_DIR}/parsed.json`
  await writeFile(outFile, JSON.stringify(dataset, null, 2), 'utf-8')

  console.log('Đã ghi', outFile)
  console.table({
    rooms: dataset.rooms.length,
    posts: dataset.posts.length,
    offers: dataset.offers.length,
    venues: dataset.venues.length,
    halls: dataset.halls.length,
    albums: dataset.albums.length,
    testimonials: dataset.testimonials.length,
    pages: dataset.pages.length,
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

Trang chủ (`route === ''`) cũng đi vào `pages` với slug rỗng; pha transform sẽ nhận ra
và biến nó thành document `homePage` thay vì `page`.

- [ ] **Step 7: Chạy pha parse thật**

Run: `pnpm import:parse`
Expected: in bảng với `rooms: 4`, `posts: 3`, `offers: 3`, `halls: 3`, `albums: 5`,
`testimonials: 4`, `venues: >= 7`, `pages: 12`. Tổng route xử lý phải là 22.

Mở `scripts/import/out/parsed.json` đọc lướt: kiểm tra vài `description` có block thật,
vài `filePath` trỏ tới file tồn tại.

- [ ] **Step 8: Commit**

```bash
git add scripts/import/parsers/page.ts scripts/import/parse.ts scripts/import/types.ts tests/unit/import-page.test.ts
git commit -m "feat(b6): parser trang chung -> section, điều phối pha parse

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Upload ảnh lên Sanity, có cache

**Files:**
- Create: `scripts/import/sanityClient.ts`
- Modify: `scripts/import/assets.ts` (thêm phần upload + `main()`)
- Test: `tests/unit/import-asset-cache.test.ts`

**Interfaces:**
- Consumes: Task 1, Task 6 (`out/parsed.json`)
- Produces:
  - `sanityClient.ts` → `writeClient` (SanityClient có token ghi)
  - `assets.ts` thêm `uploadAll(filePaths: string[], cache: AssetCache): Promise<AssetCache>`
    và `type AssetCache = Record<string, string>` (filePath → assetId)
  - Ghi `out/assets.json`

- [ ] **Step 1: Viết test thất bại cho logic cache (không gọi mạng)**

```ts
// tests/unit/import-asset-cache.test.ts
import { describe, it, expect, vi } from 'vitest'
import { uploadAll } from '@/scripts/import/assets'

describe('uploadAll()', () => {
  it('chỉ upload file chưa có trong cache', async () => {
    const upload = vi.fn(async (p: string) => `image-${p.split('/').pop()}`)
    const cache = { '/a/one.jpg': 'image-one.jpg' }

    const next = await uploadAll(['/a/one.jpg', '/a/two.jpg'], cache, upload)

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload).toHaveBeenCalledWith('/a/two.jpg')
    expect(next['/a/one.jpg']).toBe('image-one.jpg')
    expect(next['/a/two.jpg']).toBe('image-two.jpg')
  })

  it('không làm mất mục cũ trong cache', async () => {
    const upload = vi.fn(async () => 'image-new')
    const cache = { '/a/old.jpg': 'image-old' }
    const next = await uploadAll(['/a/new.jpg'], cache, upload)
    expect(next['/a/old.jpg']).toBe('image-old')
  })

  it('chạy lại với cùng đầu vào không upload thêm lần nào', async () => {
    const upload = vi.fn(async (p: string) => `image-${p}`)
    const first = await uploadAll(['/a/x.jpg'], {}, upload)
    upload.mockClear()
    const second = await uploadAll(['/a/x.jpg'], first, upload)
    expect(upload).not.toHaveBeenCalled()
    expect(second).toEqual(first)
  })
})
```

Hàm upload được tiêm vào để test không chạm mạng — đây là lý do `uploadAll` nhận
tham số thứ ba.

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-asset-cache.test.ts`
Expected: FAIL — `uploadAll` chưa tồn tại.

- [ ] **Step 3: Viết scripts/import/sanityClient.ts**

```ts
import { createClient } from '@sanity/client'
import 'dotenv/config'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset) throw new Error('Thiếu NEXT_PUBLIC_SANITY_PROJECT_ID/DATASET')
if (!token) throw new Error('Thiếu SANITY_API_WRITE_TOKEN — xem .env.example')

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-09-14',
  token,
  useCdn: false,
})
```

`dotenv/config` để script đọc `.env.local`. Nếu không nạp, chạy bằng
`pnpm tsx --env-file=.env.local`.

- [ ] **Step 4: Thêm phần upload vào scripts/import/assets.ts**

Nối vào cuối file:

```ts
import { basename } from 'node:path'
import { createReadStream } from 'node:fs'
import { readFile as readFileAsync, writeFile, mkdir } from 'node:fs/promises'
import { OUT_DIR, UPLOADS_DIR } from './paths'

export type AssetCache = Record<string, string>

export type UploadFn = (filePath: string) => Promise<string>

/**
 * Upload các file chưa có trong cache. Trả cache mới (không sửa cache cũ tại chỗ).
 * `upload` được tiêm vào để test không chạm mạng.
 */
export async function uploadAll(
  filePaths: string[],
  cache: AssetCache,
  upload: UploadFn,
): Promise<AssetCache> {
  const next: AssetCache = { ...cache }
  for (const filePath of filePaths) {
    if (next[filePath]) continue
    next[filePath] = await upload(filePath)
  }
  return next
}

/** Upload thật lên Sanity. Chỉ dùng khi chạy script, không dùng trong test. */
async function uploadToSanity(filePath: string): Promise<string> {
  const { writeClient } = await import('./sanityClient')
  const asset = await writeClient.assets.upload('image', createReadStream(filePath), {
    filename: basename(filePath),
  })
  return asset._id
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const cacheFile = `${OUT_DIR}/assets.json`

  let cache: AssetCache = {}
  try {
    cache = JSON.parse(await readFileAsync(cacheFile, 'utf-8'))
  } catch {
    // chưa có cache — lần chạy đầu
  }

  const images = await collectOriginalImages(UPLOADS_DIR)
  console.log(`Ảnh gốc: ${images.length}, đã có trong cache: ${Object.keys(cache).length}`)

  let done = 0
  const next = await uploadAll(images, cache, async (filePath) => {
    const id = await uploadToSanity(filePath)
    done += 1
    if (done % 10 === 0) console.log(`  đã upload ${done}...`)
    return id
  })

  await writeFile(cacheFile, JSON.stringify(next, null, 2), 'utf-8')
  console.log(`Xong. Upload mới: ${done}. Tổng trong cache: ${Object.keys(next).length}`)
}

// Chỉ chạy main khi gọi trực tiếp, không chạy khi bị test import.
if (process.argv[1]?.endsWith('assets.ts')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-asset-cache.test.ts`
Expected: PASS, 3 test. Không có request mạng nào.

- [ ] **Step 6: Chạy upload thật**

Run: `pnpm import:assets`
Expected: upload ~213 ảnh, in tiến trình, ghi `out/assets.json`.
Mất vài phút. Mở Sanity Studio → Media để xác nhận ảnh đã lên.

- [ ] **Step 7: Chạy lại để chứng minh idempotent**

Run: `pnpm import:assets`
Expected: `Upload mới: 0`. Nếu upload lại từ đầu thì cache không được đọc — kiểm tra
đường dẫn `out/assets.json`.

- [ ] **Step 8: Commit**

```bash
git add scripts/import/assets.ts scripts/import/sanityClient.ts tests/unit/import-asset-cache.test.ts
git commit -m "feat(b7): upload ảnh lên Sanity với cache, chạy lại không upload trùng

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Transform sang document Sanity với _id tất định

**Files:**
- Create: `scripts/import/transform.ts`
- Test: `tests/unit/import-transform.test.ts`

**Interfaces:**
- Consumes: Task 6 (`out/parsed.json`), Task 7 (`out/assets.json`)
- Produces:
  - `docId(kind: string, slug: string): string`
  - `imageValue(ref, cache): SanityImage | undefined`
  - `localeValue<T>(vi): { vi: T } | undefined`
  - `buildDocuments(dataset, cache): SanityDocument[]`
  - Ghi `out/documents.ndjson`

- [ ] **Step 1: Viết test thất bại**

```ts
// tests/unit/import-transform.test.ts
import { describe, it, expect } from 'vitest'
import { docId, imageValue, localeValue, buildDocuments } from '@/scripts/import/transform'
import type { ParsedDataset } from '@/scripts/import/types'

const emptyDataset: ParsedDataset = {
  rooms: [], posts: [], offers: [], venues: [],
  halls: [], albums: [], testimonials: [], pages: [],
}

describe('docId()', () => {
  it('tất định và an toàn cho Sanity', () => {
    expect(docId('room', 'deluxe')).toBe('room.deluxe')
    expect(docId('room', 'deluxe')).toBe(docId('room', 'deluxe'))
  })

  it('thay ký tự Sanity không cho phép trong _id', () => {
    expect(docId('page', 'a/b')).toBe('page.a-b')
    expect(docId('page', 'a b')).toBe('page.a-b')
  })

  it('slug rỗng (trang chủ) vẫn ra id hợp lệ', () => {
    expect(docId('homePage', '')).toBe('homePage')
  })
})

describe('localeValue()', () => {
  it('bọc giá trị vi và KHÔNG tạo field en', () => {
    expect(localeValue('Xin chào')).toEqual({ vi: 'Xin chào' })
    expect(localeValue('Xin chào')).not.toHaveProperty('en')
  })

  it('trả undefined khi giá trị rỗng', () => {
    expect(localeValue('')).toBeUndefined()
    expect(localeValue(undefined)).toBeUndefined()
  })
})

describe('imageValue()', () => {
  const cache = { '/u/bed.png': 'image-abc123-100x100-png' }

  it('dựng tham chiếu ảnh Sanity từ cache', () => {
    expect(imageValue({ filePath: '/u/bed.png' }, cache)).toEqual({
      _type: 'figure',
      asset: { _type: 'reference', _ref: 'image-abc123-100x100-png' },
    })
  })

  it('trả undefined khi ảnh không có trong cache', () => {
    expect(imageValue({ filePath: '/u/thieu.png' }, cache)).toBeUndefined()
  })

  it('gắn alt khi có', () => {
    const value = imageValue({ filePath: '/u/bed.png', alt: 'Giường đôi' }, cache) as any
    expect(value.alt).toEqual({ vi: 'Giường đôi' })
  })
})

describe('buildDocuments()', () => {
  it('dựng document phòng với _id tất định và field vi', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      rooms: [{
        kind: 'room', slug: 'deluxe', title: 'PHÒNG DELUXE', category: 'hotel',
        areaSqm: 39, capacity: '2 khách', view: 'Hướng biển', bedType: 'Giường đôi',
        description: [], gallery: [], features: [{ label: 'Wifi' }], order: 1,
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc._id).toBe('room.deluxe')
    expect(doc._type).toBe('room')
    expect(doc.title).toEqual({ vi: 'PHÒNG DELUXE' })
    expect(doc.slug.vi.current).toBe('deluxe')
    expect(doc.areaSqm).toBe(39)
    expect(doc.features[0].label).toEqual({ vi: 'Wifi' })
  })

  it('chạy 2 lần cho kết quả y hệt (idempotent)', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      testimonials: [{ kind: 'testimonial', heading: 'Tốt', quote: 'Rất tốt', author: 'A', source: 'TripAdvisor', order: 0 }],
    }
    expect(buildDocuments(dataset, {})).toEqual(buildDocuments(dataset, {}))
  })

  it('giữ nguyên khối danh sách bài viết khi transform', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      pages: [{
        kind: 'page', slug: 'news', title: 'Tin tức',
        sections: [{ _type: 'postListSection', category: 'news', limit: 12 }],
      }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc.sections[0]._type).toBe('postListSection')
    expect(doc.sections[0].category).toBe('news')
  })

  it('trang có slug rỗng thành homePage chứ không phải page', () => {
    const dataset: ParsedDataset = {
      ...emptyDataset,
      pages: [{ kind: 'page', slug: '', title: 'Trang chủ', sections: [] }],
    }
    const [doc] = buildDocuments(dataset, {}) as any[]
    expect(doc._type).toBe('homePage')
    expect(doc._id).toBe('homePage')
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test tests/unit/import-transform.test.ts`
Expected: FAIL.

- [ ] **Step 3: Viết scripts/import/transform.ts**

```ts
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { OUT_DIR } from './paths'
import type {
  ParsedDataset, ParsedImageRef, ParsedRoom, ParsedPost, ParsedOffer,
  ParsedVenue, ParsedHall, ParsedAlbum, ParsedTestimonial, ParsedPage,
} from './types'
import type { AssetCache } from './assets'

/** _id tất định: chạy lại script không tạo document trùng. */
export function docId(kind: string, slug: string): string {
  const safe = slug.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return safe ? `${kind}.${safe}` : kind
}

export function localeValue<T>(vi: T | undefined | null): { vi: T } | undefined {
  if (vi === undefined || vi === null) return undefined
  if (typeof vi === 'string' && vi.trim() === '') return undefined
  if (Array.isArray(vi) && vi.length === 0) return undefined
  return { vi }
}

export function imageValue(ref: ParsedImageRef | undefined, cache: AssetCache) {
  if (!ref) return undefined
  const assetId = cache[ref.filePath]
  if (!assetId) return undefined
  return {
    _type: 'figure' as const,
    asset: { _type: 'reference' as const, _ref: assetId },
    ...(ref.alt ? { alt: { vi: ref.alt } } : {}),
  }
}

function slugValue(slug: string) {
  return { vi: { _type: 'slug', current: slug } }
}

function roomDoc(room: ParsedRoom, cache: AssetCache) {
  return {
    _id: docId('room', room.slug),
    _type: 'room',
    title: localeValue(room.title),
    slug: slugValue(room.slug),
    category: room.category,
    areaSqm: room.areaSqm,
    capacity: localeValue(room.capacity),
    view: localeValue(room.view),
    bedType: localeValue(room.bedType),
    summary: localeValue(room.summary),
    description: localeValue(room.description),
    heroImage: imageValue(room.heroImage, cache),
    gallery: room.gallery.map((g) => imageValue(g, cache)).filter(Boolean),
    features: room.features.map((f, i) => ({
      _key: `feature-${i}`,
      label: localeValue(f.label),
      ...(f.icon && cache[f.icon.filePath]
        ? { icon: { _type: 'image', asset: { _type: 'reference', _ref: cache[f.icon.filePath] } } }
        : {}),
    })),
    order: room.order,
  }
}

function postDoc(post: ParsedPost, cache: AssetCache) {
  return {
    _id: docId('post', post.slug),
    _type: 'post',
    title: localeValue(post.title),
    slug: slugValue(post.slug),
    category: post.category,
    publishedAt: post.publishedAt,
    excerpt: localeValue(post.excerpt),
    coverImage: imageValue(post.coverImage, cache),
    body: localeValue(post.body),
    author: post.author,
  }
}

function offerDoc(offer: ParsedOffer, cache: AssetCache) {
  return {
    _id: docId('offer', offer.slug),
    _type: 'offer',
    title: localeValue(offer.title),
    slug: slugValue(offer.slug),
    excerpt: localeValue(offer.excerpt),
    image: imageValue(offer.image, cache),
    body: localeValue(offer.body),
    priceNote: localeValue(offer.priceNote),
    order: offer.order,
  }
}

function venueDoc(venue: ParsedVenue, cache: AssetCache) {
  return {
    _id: docId('venue', venue.slug),
    _type: 'venue',
    name: localeValue(venue.name),
    slug: slugValue(venue.slug),
    kind: venue.venueKind,
    location: localeValue(venue.location),
    capacity: localeValue(venue.capacity),
    hours: localeValue(venue.hours),
    highlights: venue.highlights.map((h, i) => ({ _key: `h-${i}`, vi: h })),
    description: localeValue(venue.description),
    image: imageValue(venue.image, cache),
    menuUrl: venue.menuUrl,
    phone: venue.phone,
    order: venue.order,
  }
}

function hallDoc(hall: ParsedHall, cache: AssetCache) {
  return {
    _id: docId('hall', hall.slug),
    _type: 'hall',
    name: localeValue(hall.name),
    slug: slugValue(hall.slug),
    areaSqm: hall.areaSqm,
    capacity: localeValue(hall.capacity),
    description: localeValue(hall.description),
    image: imageValue(hall.image, cache),
    order: hall.order,
  }
}

function albumDoc(album: ParsedAlbum, cache: AssetCache) {
  return {
    _id: docId('galleryAlbum', album.slug),
    _type: 'galleryAlbum',
    title: localeValue(album.title),
    slug: slugValue(album.slug),
    images: album.images
      .map((img, i) => {
        const value = imageValue(img, cache)
        return value ? { _key: `img-${i}`, ...value } : undefined
      })
      .filter(Boolean),
    order: album.order,
  }
}

function testimonialDoc(item: ParsedTestimonial, index: number) {
  return {
    _id: docId('testimonial', `${index}`),
    _type: 'testimonial',
    heading: localeValue(item.heading),
    quote: localeValue(item.quote),
    author: item.author,
    source: item.source,
    order: item.order,
  }
}

function sectionValue(section: ParsedPage['sections'][number], index: number, cache: AssetCache) {
  const key = `sec-${index}`
  switch (section._type) {
    case 'heroSection':
      return {
        _key: key, _type: 'heroSection',
        heading: localeValue(section.heading),
        subheading: localeValue(section.subheading),
        background: imageValue(section.background, cache),
      }
    case 'richTextSection':
      return {
        _key: key, _type: 'richTextSection',
        heading: localeValue(section.heading),
        content: localeValue(section.content),
        background: section.background,
      }
    case 'tableSection':
      return {
        _key: key, _type: 'tableSection',
        heading: localeValue(section.heading),
        headers: section.headers.map((h, i) => ({ _key: `th-${i}`, vi: h })),
        rows: section.rows.map((row, r) => ({
          _key: `tr-${r}`,
          cells: row.map((cell, c) => ({ _key: `td-${c}`, vi: cell })),
        })),
      }
    case 'bookingWidgetSection':
      return { _key: key, _type: 'bookingWidgetSection' }
    case 'postListSection':
      return {
        _key: key, _type: 'postListSection',
        heading: localeValue(section.heading),
        category: section.category,
        limit: section.limit,
      }
    case 'galleryCarouselSection':
      return {
        _key: key, _type: 'galleryCarouselSection',
        heading: localeValue(section.heading),
        album: { _type: 'reference', _ref: docId('galleryAlbum', section.albumSlug) },
      }
  }
}

function pageDoc(page: ParsedPage, cache: AssetCache) {
  const isHome = page.slug === ''
  const sections = page.sections
    .map((s, i) => sectionValue(s, i, cache))
    .filter(Boolean)

  if (isHome) {
    return {
      _id: 'homePage',
      _type: 'homePage',
      title: localeValue(page.title),
      sections,
    }
  }
  return {
    _id: docId('page', page.slug),
    _type: 'page',
    title: localeValue(page.title),
    slug: slugValue(page.slug),
    sections,
    ...(page.metaDescription
      ? { seo: { _type: 'seo', metaDescription: localeValue(page.metaDescription) } }
      : {}),
  }
}

export function buildDocuments(dataset: ParsedDataset, cache: AssetCache): unknown[] {
  return [
    ...dataset.rooms.map((r) => roomDoc(r, cache)),
    ...dataset.posts.map((p) => postDoc(p, cache)),
    ...dataset.offers.map((o) => offerDoc(o, cache)),
    ...dataset.venues.map((v) => venueDoc(v, cache)),
    ...dataset.halls.map((h) => hallDoc(h, cache)),
    ...dataset.albums.map((a) => albumDoc(a, cache)),
    ...dataset.testimonials.map(testimonialDoc),
    ...dataset.pages.map((p) => pageDoc(p, cache)),
  ]
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const dataset: ParsedDataset = JSON.parse(await readFile(`${OUT_DIR}/parsed.json`, 'utf-8'))

  let cache: AssetCache = {}
  try {
    cache = JSON.parse(await readFile(`${OUT_DIR}/assets.json`, 'utf-8'))
  } catch {
    console.warn('Chưa có out/assets.json — document sẽ không có ảnh. Chạy pnpm import:assets trước.')
  }

  const documents = buildDocuments(dataset, cache)
  const ndjson = documents.map((d) => JSON.stringify(d)).join('\n')
  await writeFile(`${OUT_DIR}/documents.ndjson`, ndjson, 'utf-8')
  console.log(`Đã dựng ${documents.length} document -> out/documents.ndjson`)
}

if (process.argv[1]?.endsWith('transform.ts')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test tests/unit/import-transform.test.ts`
Expected: PASS, 11 test.

- [ ] **Step 5: Chạy transform thật**

Run: `pnpm import:transform`
Expected: in `Đã dựng <n> document`. `n` phải bằng 4 + 3 + 3 + venues + 3 + 5 + 4 + 12.

Kiểm tra nhanh không có document nào thiếu `_id`:

```bash
grep -c '"_id"' scripts/import/out/documents.ndjson
```

- [ ] **Step 6: Commit**

```bash
git add scripts/import/transform.ts tests/unit/import-transform.test.ts
git commit -m "feat(b8): transform sang document Sanity, _id tất định, chỉ đổ field vi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Ghi vào Sanity và kiểm chứng end-to-end

**Files:**
- Create: `scripts/import/run.ts`
- Create: `docs/import.md`

**Interfaces:**
- Consumes: Task 8 (`out/documents.ndjson`), Task 7 (`sanityClient.ts`)
- Produces: lệnh `pnpm import:run` và `pnpm import`

- [ ] **Step 1: Viết scripts/import/run.ts**

```ts
import { readFile } from 'node:fs/promises'
import { OUT_DIR } from './paths'
import { writeClient } from './sanityClient'

const BATCH_SIZE = 50

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const raw = await readFile(`${OUT_DIR}/documents.ndjson`, 'utf-8')
  const documents = raw
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line))

  console.log(`${documents.length} document sẵn sàng.`)
  if (dryRun) {
    console.log('--dry-run: không ghi gì. Loại document:')
    const byType = new Map<string, number>()
    for (const doc of documents) {
      byType.set(doc._type, (byType.get(doc._type) ?? 0) + 1)
    }
    console.table(Object.fromEntries(byType))
    return
  }

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    const tx = writeClient.transaction()
    for (const doc of batch) tx.createOrReplace(doc)
    await tx.commit()
    console.log(`  đã ghi ${Math.min(i + BATCH_SIZE, documents.length)}/${documents.length}`)
  }

  console.log('Xong.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 2: Chạy dry-run trước**

Run: `pnpm import:run --dry-run`
Expected: in bảng số document theo `_type`. Kỳ vọng thấy `room: 4`, `post: 3`,
`offer: 3`, `hall: 3`, `galleryAlbum: 5`, `testimonial: 4`, `homePage: 1`, `page: 11`,
`venue: >= 7`. Không ghi gì lên Sanity.

- [ ] **Step 3: Ghi thật**

Run: `pnpm import:run`
Expected: in tiến trình theo lô, kết thúc "Xong."

- [ ] **Step 4: Kiểm chứng trong Studio**

Mở `http://localhost:3000/studio`. Kiểm:
- `Loại phòng` có 4 bản ghi, mở Deluxe thấy 16 tiện nghi và ảnh hiện đúng.
- `Album ảnh` có 5 album, ảnh hiển thị.
- `Trang chủ` có sections.
- `Bài viết` có 3 bài, ngày đăng đúng (2025-04-01, 2023-07-20, 2023-04-28).
- Field `en` ở mọi document đều trống — đúng như chủ ý.

- [ ] **Step 5: Chạy lại toàn bộ pipeline để chứng minh idempotent**

Run: `pnpm import`
Expected: `Upload mới: 0` ở pha assets; số document không đổi trong Studio; không có
document trùng nào xuất hiện.

- [ ] **Step 6: Viết docs/import.md**

```markdown
# Import nội dung từ bản clone HTML

Đổ 22 trang và ~213 ảnh của bản clone WordPress vào Sanity.

## Chạy

```bash
cp .env.example .env.local   # điền project id + SANITY_API_WRITE_TOKEN
pnpm import                  # chạy cả 4 pha
```

Từng pha chạy riêng được:

| Lệnh | Việc | Ra file |
|---|---|---|
| `pnpm import:parse` | Đọc 22 HTML, bóc nội dung | `out/parsed.json` |
| `pnpm import:assets` | Upload ảnh gốc, có cache | `out/assets.json` |
| `pnpm import:transform` | Dựng document Sanity | `out/documents.ndjson` |
| `pnpm import:run` | Ghi vào Sanity | — |

`pnpm import:run --dry-run` in thống kê mà không ghi.

## Chạy lại được

Cả 4 pha đều idempotent. `_id` tất định (`room.deluxe`, `page.casino`) nên
`createOrReplace` ghi đè đúng document cũ. Ảnh đã upload được nhớ trong
`out/assets.json` nên không upload lại.

**Cảnh báo:** `import:run` ghi đè nội dung đã sửa tay trong Studio. Sau khi biên tập
viên bắt đầu làm việc thật thì đừng chạy lại toàn bộ.

## Không làm gì

- Không dịch sang tiếng Anh. Mọi field `en` để trống, frontend fallback về `vi`.
- Không đụng vào file nguồn trong `wp-content/`, `assets/`, `*/index.html`.
```

- [ ] **Step 7: Chạy toàn bộ test**

Run: `pnpm test`
Expected: tất cả PASS (i18n 7 + assets 4 + html 10 + room 10 + post 5 + misc 5 +
page 8 + asset-cache 3 + transform 11 = 63 test).

- [ ] **Step 8: Commit**

```bash
git add scripts/import/run.ts docs/import.md
git commit -m "feat(b9): ghi document vào Sanity theo lô + tài liệu import

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Hoàn thành Plan B

- Sanity có đủ nội dung 22 trang và ~213 ảnh, mọi field `vi` đầy, `en` trống.
- `pnpm import` chạy lại được bất cứ lúc nào.
- 63 unit test xanh.

**Tiếp theo:** Plan C dựng frontend. Điều kiện tiên quyết đã thoả — Sanity có dữ liệu
nên `generateStaticParams` sẽ không trả mảng rỗng.
