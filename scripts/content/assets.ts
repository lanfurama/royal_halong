/**
 * Tra cứu ảnh đã nằm sẵn trong Sanity.
 *
 * 216 ảnh gốc của site cũ đã được `pnpm import:assets` tải lên và ghi bản đồ
 * `đường-dẫn-tuyệt-đối -> assetId` vào `scripts/import/out/assets.json`.
 * KHÔNG upload lại ảnh: mọi ảnh cần dùng đều đã có ở đó. Module này chỉ dịch
 * từ TÊN FILE (thứ con người đọc được trong HTML bản clone) sang `assetId`.
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { OUT_DIR } from '../import/paths'
import { join } from 'node:path'

const raw: Record<string, string> = JSON.parse(
  readFileSync(join(OUT_DIR, 'assets.json'), 'utf8'),
)

/** basename (kể cả biến thể `-1024x683`) -> assetId */
const byName = new Map<string, string>()
for (const [abs, id] of Object.entries(raw)) {
  byName.set(basename(abs), id)
  // Bản clone hay trỏ vào biến thể srcset (`X-1024x683.jpg`) trong khi bản đồ
  // chỉ có ảnh gốc (`X.jpg`) — đăng ký thêm khoá đã cắt hậu tố để cả hai dạng
  // cùng tra được.
  byName.set(basename(abs).replace(/\.(jpe?g|png|webp|gif|svg)$/i, ''), id)
}

export function assetIdFor(fileName: string): string | undefined {
  const base = basename(fileName)
  return (
    byName.get(base) ??
    byName.get(base.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1')) ??
    byName.get(base.replace(/-\d+x\d+$/, '').replace(/\.(jpe?g|png|webp|gif|svg)$/i, '')) ??
    byName.get(base.replace(/\.(jpe?g|png|webp|gif|svg)$/i, ''))
  )
}

/** Mọi tên file đã biết — dùng để tìm ảnh theo từ khoá. */
export function allNames(): string[] {
  return Array.from(new Set(Object.keys(raw).map((p) => basename(p)))).sort()
}

/** Tìm ảnh theo từ khoá không phân biệt hoa thường, ví dụ `search('wedding')`. */
export function search(...terms: string[]): string[] {
  return allNames().filter((n) => terms.every((t) => n.toLowerCase().includes(t.toLowerCase())))
}
