import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { existsSync } from 'node:fs'


// `dotenv/config` mặc định CHỈ nạp `.env` — repo này không có file đó, biến môi
// trường thật nằm ở `.env.local` (Next.js tự nạp, drizzle-kit thì không). Nạp
// tường minh, cùng cách `scripts/import/sanityClient.ts` đang làm; thiếu dòng
// này thì `pnpm db:migrate` không thấy DATABASE_URL dù đã điền đúng chỗ.
//
// Dùng `process.cwd()` chứ KHÔNG dùng `import.meta.dirname`: drizzle-kit
// transpile file config này sang CJS trước khi nạp, ở đó `import.meta.dirname`
// là `undefined` và `resolve()` ném "paths[0] must be of type string" — đã
// kiểm chứng bằng cách chạy thật, không suy đoán.
// Không dùng thẳng `process.cwd()`: chạy `pnpm db:migrate` từ thư mục con thì
// nó trỏ sai chỗ, dotenv im lặng không nạp gì, `url` rỗng và drizzle-kit báo
// lỗi kết nối Postgres tối nghĩa thay vì nói thiếu DATABASE_URL. Leo ngược lên
// tìm gốc repo (nơi có package.json).
function repoRoot(from: string): string {
  let dir = from
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(resolve(dir, 'package.json'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return from
}

config({ path: resolve(repoRoot(process.cwd()), '.env.local') })

// KHÔNG throw khi thiếu URL: `drizzle-kit generate` sinh SQL từ schema hoàn
// toàn offline và phải chạy được trước khi Neon được cấp phát. Chỉ `migrate`/
// `studio` mới thật sự cần kết nối, và drizzle-kit tự báo lỗi ở đó.
const url = process.env.DATABASE_URL ?? ''

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
})
