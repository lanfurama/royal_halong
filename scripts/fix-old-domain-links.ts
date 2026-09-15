// Fix c9-4 (và phần mở rộng sau khi bung test rộng ra toàn site — xem
// `tests/e2e/routes.spec.ts`, test "không còn LIÊN KẾT... trỏ domain gốc"):
// nhiều document trong Sanity có anchor SỐNG trỏ về domain cũ đã chết
// (`royalhalonghotel.com`, có/không `www.`, có/không tracking param
// `fbclid`). Task gốc chỉ nêu 2 anchor trong `page.offers` — bung test rộng
// ra toàn bộ route (thay vì chỉ `/vi`, trang rỗng nhất site) lộ thêm 6 anchor
// sống nữa ở 4 document khác: đúng lớp lỗi mà cả đợt sửa này nói tới (sửa
// một instance, bỏ ngỏ cả lớp).
//
// Quyết định giống nhau cho MỌI anchor bên dưới: GỠ LINK, GIỮ NGUYÊN CHỮ.
// Không trỏ sang `/vi/reservation` — nhãn đứng trước hầu hết là "Website:"/
// "Trang Web", trỏ sang trang đặt phòng sẽ khiến chữ nói dối về đích đến.
// Domain cũ vẫn còn là CHỮ sau khi sửa (giống email hiển thị dạng text ở
// nơi khác trong site — nội dung hợp lệ), chỉ gỡ phần khiến nó thành một
// LIÊN KẾT thật dẫn khách ra khỏi site. Ngoại lệ: `mailto:` links (địa chỉ
// email) không đụng tới — không phải "link tới domain cũ", vẫn hoạt động
// độc lập với web hosting của domain đó.
//
// Idempotent: đọc lại `markDefs`/`marks` hiện tại trước khi patch mỗi
// document, bỏ qua an toàn nếu đã sạch hoặc cấu trúc không khớp kỳ vọng
// (đổi `_key`/href khác) — không patch nhầm dữ liệu đã đổi. Chạy lại bao
// nhiêu lần cũng an toàn.
import { writeClient } from './import/sanityClient'

interface Target {
  docId: string
  /** `page`/`homePage` dùng `sections[_key==X].content.vi[...]`;
   * `offer`/`post` dùng thẳng `body.vi[...]`. */
  field: 'sections' | 'body'
  sectionKey?: string
  blockKey: string
  /** `_key` của các markDef cần gỡ trong block này — mỗi key phải trỏ
   * `royalhalonghotel.com` (không phải `mailto:`) mới bị gỡ. */
  markDefKeys: string[]
}

const TARGETS: Target[] = [
  { docId: 'page.offers', field: 'sections', sectionKey: 'sec-1', blockKey: 'k7', markDefKeys: ['k0'] },
  { docId: 'page.offers', field: 'sections', sectionKey: 'sec-2', blockKey: 'kl', markDefKeys: ['k1'] },
  { docId: 'page.terms-and-conditions', field: 'sections', sectionKey: 'sec-4', blockKey: 'k1b', markDefKeys: ['k0'] },
  {
    docId: 'offer.buffet-mung-dai-le-2-9-hao-khi-viet-nam-tinh-hoa-hoi-tu-chi-tu-500-000vnd-khach',
    field: 'body',
    blockKey: 'k7',
    markDefKeys: ['k0'],
  },
  {
    docId: 'offer.dam-cuoi-co-tich-ben-vinh-di-san-tu-400-000-vnd-khach',
    field: 'body',
    blockKey: 'kl',
    markDefKeys: ['k1'],
  },
  {
    docId: 'post.canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel',
    field: 'body',
    blockKey: 'k3',
    // k0 (link Facebook) KHÔNG nằm trong danh sách — không phải domain cũ,
    // giữ nguyên. Chỉ gỡ k1/k2 (cả hai trỏ royalhalonghotel.com).
    markDefKeys: ['k1', 'k2'],
  },
]

function getBlocks(doc: any, target: Target): any[] | undefined {
  if (target.field === 'body') return doc.body?.vi
  const section = (doc.sections as any[] | undefined)?.find((s) => s._key === target.sectionKey)
  return section?.content?.vi
}

function basePath(target: Target): string {
  return target.field === 'body'
    ? `body.vi[_key=="${target.blockKey}"]`
    : `sections[_key=="${target.sectionKey}"].content.vi[_key=="${target.blockKey}"]`
}

async function processDoc(docId: string, targets: Target[]) {
  const doc = await writeClient.getDocument(docId)
  if (!doc) {
    console.log(`[fix-old-domain-links] ${docId}: không tìm thấy document — bỏ qua.`)
    return
  }

  const patch = writeClient.patch(docId)
  const patchData: Record<string, unknown> = {}
  let changed = false

  for (const target of targets) {
    const blocks = getBlocks(doc, target)
    const block = blocks?.find((b: any) => b._key === target.blockKey)
    if (!block) {
      console.log(`[fix-old-domain-links] ${docId}/${target.blockKey}: không tìm thấy block — bỏ qua an toàn.`)
      continue
    }

    const markDefsToRemove = (block.markDefs ?? []).filter(
      (m: any) =>
        target.markDefKeys.includes(m._key) &&
        typeof m.href === 'string' &&
        m.href.includes('royalhalonghotel.com') &&
        !m.href.startsWith('mailto:'),
    )

    if (markDefsToRemove.length === 0) {
      console.log(`[fix-old-domain-links] ${docId}/${target.blockKey}: đã sạch hoặc không khớp kỳ vọng — bỏ qua (idempotent).`)
      continue
    }

    const removeKeys = new Set(markDefsToRemove.map((m: any) => m._key))
    const base = basePath(target)

    for (const child of block.children ?? []) {
      const marks: string[] = child.marks ?? []
      if (marks.some((m) => removeKeys.has(m))) {
        patchData[`${base}.children[_key=="${child._key}"].marks`] = marks.filter((m) => !removeKeys.has(m))
      }
    }
    patchData[`${base}.markDefs`] = (block.markDefs ?? []).filter((m: any) => !removeKeys.has(m._key))
    changed = true

    for (const md of markDefsToRemove) {
      console.log(`[fix-old-domain-links] ${docId}/${target.blockKey}: gỡ link "${md.href}" (markDef ${md._key}), giữ nguyên chữ.`)
    }
  }

  if (!changed) {
    console.log(`[fix-old-domain-links] ${docId}: không có gì để patch.`)
    return
  }

  const result = await patch.set(patchData).commit()
  console.log(`[fix-old-domain-links] Đã patch ${docId}, _rev mới: ${result._rev}`)
}

async function main() {
  const byDoc = new Map<string, Target[]>()
  for (const target of TARGETS) {
    const list = byDoc.get(target.docId) ?? []
    list.push(target)
    byDoc.set(target.docId, list)
  }
  for (const [docId, targets] of byDoc) {
    await processDoc(docId, targets)
  }
}

main().catch((err) => {
  console.error('[fix-old-domain-links] Lỗi:', err)
  process.exitCode = 1
})
