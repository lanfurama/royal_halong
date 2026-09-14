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
