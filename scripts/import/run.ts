import { readFile } from 'node:fs/promises'
import { OUT_DIR } from './paths'

const BATCH_SIZE = 50

/**
 * `--only=<type[,type...]>`: chỉ ghi document thuộc các _type được nêu.
 *
 * Cần thiết vì `createOrReplace` ghi đè TOÀN BỘ document: một lần chạy lại
 * đầy đủ sẽ xoá mọi chỉnh sửa hậu-import trên dataset sống (ví dụ đợt gỡ link
 * trỏ về domain cũ) và đưa nội dung về đúng trạng thái của bản clone.
 */
export function parseOnlyFilter(argv: string[]): Set<string> | undefined {
  const flag = argv.find((a) => a.startsWith('--only='))
  if (!flag) return undefined
  const types = flag
    .slice('--only='.length)
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t !== '')
  if (types.length === 0) {
    throw new Error('--only= rỗng: nêu ít nhất một _type, ví dụ --only=navigation,siteSettings')
  }
  return new Set(types)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const only = parseOnlyFilter(process.argv)
  const raw = await readFile(`${OUT_DIR}/documents.ndjson`, 'utf-8')
  const all = raw
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line))
  const documents = only ? all.filter((d) => only.has(d._type)) : all

  if (only) {
    if (documents.length === 0) {
      throw new Error(
        `--only=${[...only].join(',')} không khớp document nào trong ${all.length} document đã dựng.`,
      )
    }
    console.log(`Lọc --only=${[...only].join(',')}: ${documents.length}/${all.length} document.`)
  }
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

  // Nạp `sanityClient` ĐỘNG, chỉ khi thật sự sắp ghi. `sanityClient.ts` throw
  // ngay lúc nạp module nếu thiếu `SANITY_API_WRITE_TOKEN` — với import TĨNH ở
  // đầu file (như trước sửa này), `--dry-run` (không cần token, không ghi gì)
  // vẫn chết ngay từ dòng import, trước khi kịp in bảng thống kê ở trên.
  const { writeClient } = await import('./sanityClient')

  // In rõ đích ghi TRƯỚC khi ghi — đây là pha DUY NHẤT trong 4 pha thật sự đổi
  // dữ liệu trên dataset SỐNG, người vận hành cần thấy đang ghi vào project/
  // dataset nào trước khi 45 document được `createOrReplace`.
  const cfg = writeClient.config()
  console.log(`Ghi vào Sanity — projectId=${cfg.projectId} dataset=${cfg.dataset}`)

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    const tx = writeClient.transaction()
    for (const doc of batch) tx.createOrReplace(doc)
    await tx.commit()
    console.log(`  đã ghi ${Math.min(i + BATCH_SIZE, documents.length)}/${documents.length}`)
  }

  console.log('Xong.')
}

// Chỉ chạy main khi gọi trực tiếp, không chạy khi bị import (cùng pattern bảo
// vệ đã dùng ở assets.ts/parse.ts/transform.ts) — run.ts là pha DUY NHẤT thật
// sự ghi vào dataset sống, thiếu guard này một `import … from '@/scripts/import/run'`
// trong test tương lai sẽ âm thầm ghi 45 document lúc `pnpm test`.
if (process.argv[1]?.endsWith('run.ts')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
