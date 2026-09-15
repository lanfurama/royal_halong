import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { parse, evaluate } from 'groq-js'
import { DOC_BY_SLUG_QUERY } from '@/sanity/lib/queries'

/**
 * `tests/unit/queries.test.ts` chỉ so khớp CHUỖI của câu GROQ — nó không chạy
 * query thật, nên không bắt được một projection sai cú pháp mà vẫn là chuỗi
 * hợp lệ (ví dụ: quên `[]` sau `select(...)`, khiến `resolved` luôn là
 * `null` dù chuỗi query chứa đủ mọi từ khoá test kia mong đợi).
 *
 * File này chạy THẬT các câu query xuất ra từ `sanity/lib/queries.ts` bằng
 * `groq-js` — bộ thực thi GROQ tham chiếu mà chính tooling của Sanity dùng —
 * trên một fixture tĩnh trích nguyên văn từ dữ liệu thật đã import
 * (`scripts/import/out/documents.ndjson`, bị `.gitignore` vì sinh lại được).
 * Snapshot 19 document liên quan (4 trang mục tiêu + toàn bộ room/hall/venue
 * mà các nhánh `select()` quét qua) nằm ở
 * `tests/fixtures/groq-projection.ndjson`, cam kết vào git.
 *
 * Không dùng dữ liệu Sanity thật qua mạng ở đây: cần token + mạng, chậm và
 * không hermetic cho một bộ test đặt tên "unit" — nếu cần kiểm chứng lại với
 * dataset thật, chạy tay câu query qua Vision hoặc một script riêng ngoài
 * bộ test. Muốn làm mới fixture: lọc lại 4 `_id` trang bên dưới cộng mọi
 * document `_type in ["room","hall","venue"]` từ
 * `scripts/import/out/documents.ndjson` sau khi chạy `pnpm run import:all`.
 */

const fixturePath = fileURLToPath(new URL('../fixtures/groq-projection.ndjson', import.meta.url))
const dataset = readFileSync(fixturePath, 'utf8')
  .split('\n')
  .filter((line) => line.trim() !== '')
  .map((line) => JSON.parse(line))

interface SectionWithResolved {
  _type: string
  resolved?: unknown
}

async function resolvedFor(slug: string): Promise<unknown> {
  const tree = parse(DOC_BY_SLUG_QUERY)
  const value = await evaluate(tree, { dataset, params: { slug } })
  const doc = (await value.get()) as { sections?: SectionWithResolved[] } | null
  const section = doc?.sections?.find((s) => 'resolved' in s)
  return section?.resolved
}

describe('DOC_BY_SLUG_QUERY — "resolved" chạy thật bằng groq-js (không string-match)', () => {
  it('roomListSection.resolved: mảng 4 phòng, không phải null (page.luu-tru-phong-khach-san-villas)', async () => {
    const resolved = await resolvedFor('luu-tru-phong-khach-san-villas')
    expect(Array.isArray(resolved)).toBe(true)
    expect((resolved as unknown[]).length).toBe(4)
  })

  it('venueListSection.resolved lọc filterKind="dining": mảng 4 venue, không phải null (page.culinary)', async () => {
    const resolved = await resolvedFor('culinary')
    expect(Array.isArray(resolved)).toBe(true)
    expect((resolved as unknown[]).length).toBe(4)
  })

  it('venueListSection.resolved lọc filterKind="facility": mảng 4 venue, không phải null (page.experiences)', async () => {
    const resolved = await resolvedFor('experiences')
    expect(Array.isArray(resolved)).toBe(true)
    expect((resolved as unknown[]).length).toBe(4)
  })

  it('hallListSection.resolved: mảng 3 phòng hội nghị có field description, không phải null (page.royal-international-convention-palace)', async () => {
    const resolved = await resolvedFor('royal-international-convention-palace')
    expect(Array.isArray(resolved)).toBe(true)
    const halls = resolved as Array<Record<string, unknown>>
    expect(halls.length).toBe(3)
    expect(halls[0].description).toBeDefined()
  })
})
