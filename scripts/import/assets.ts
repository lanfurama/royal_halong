import { readdir, stat } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { createReadStream } from 'node:fs'
import { readFile as readFileAsync, writeFile, mkdir } from 'node:fs/promises'
import { OUT_DIR, UPLOADS_DIR } from './paths'

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
