/**
 * Ghi nội dung đã dựng lên Sanity.
 *
 * Luôn dùng `patch` (merge từng field) chứ KHÔNG `createOrReplace`: mỗi trang
 * do một người/agent phụ trách, nhưng `siteSettings`/`navigation` và các
 * document dùng chung (`room`, `venue`, `hall`, `galleryAlbum`) bị nhiều
 * script chạm tới. `createOrReplace` sẽ xoá sạch field của người khác vừa ghi.
 */
import { writeClient } from '../import/sanityClient'

export { writeClient }

/** Ghi đè một số field của document, giữ nguyên phần còn lại. */
export async function patchDoc(id: string, fields: Record<string, unknown>) {
  const res = await writeClient.patch(id).set(fields).commit({ autoGenerateArrayKeys: false })
  console.log(`  patched ${id} (${Object.keys(fields).join(', ')})`)
  return res
}

/** Tạo mới nếu chưa có, rồi ghi đè field. Dùng cho document chưa tồn tại. */
export async function upsertDoc(id: string, type: string, fields: Record<string, unknown>) {
  await writeClient.createIfNotExists({ _id: id, _type: type } as any)
  return patchDoc(id, fields)
}

/** Đọc một document để kiểm tra trước/sau khi ghi. */
export async function getDoc(id: string) {
  return writeClient.fetch(`*[_id == $id][0]`, { id })
}

/**
 * Kiểm tra CHỐT trước khi coi là xong: đi khắp document, tìm mọi object đa
 * ngữ và báo cái nào chưa đủ sáu ngôn ngữ. In ra đường dẫn field để sửa.
 *
 * `slug` được bỏ qua — xem `IGNORED_PATHS` trong `audit.ts` để biết lý do
 * (localeSlug cố ý để trống ngoài `vi`, `resolveSlug()` tự rơi về đường dẫn
 * tiếng Việt). Hai chỗ phải dùng CÙNG quy tắc, nếu không thì script trang báo
 * xanh còn bản soi toàn dataset báo đỏ trên cùng một document.
 */
export async function assertFullyTranslated(id: string): Promise<number> {
  const LOC = ['vi', 'en', 'zh', 'ko', 'ja', 'th']
  const doc = await getDoc(id)
  if (!doc) throw new Error(`assertFullyTranslated: không có document ${id}`)
  const holes: string[] = []
  const walk = (node: any, path: string) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`))
    if (!node || typeof node !== 'object') return
    const keys = Object.keys(node).filter((k) => !k.startsWith('_'))
    const isLocale = keys.length > 0 && keys.every((k) => LOC.includes(k))
    if (isLocale) {
      if (/(^|\.)slug$/.test(path)) return
      const missing = LOC.filter((l) => {
        const v = node[l]
        return v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length)
      })
      if (missing.length) holes.push(`${path}  thiếu: ${missing.join(',')}`)
      return
    }
    for (const k of keys) walk(node[k], path ? `${path}.${k}` : k)
  }
  walk(doc, '')
  if (holes.length) {
    console.log(`✗ ${id} — ${holes.length} field chưa đủ 6 ngôn ngữ:`)
    holes.forEach((h) => console.log('   ' + h))
  } else {
    console.log(`✓ ${id} — đủ 6 ngôn ngữ ở mọi field`)
  }
  return holes.length
}
