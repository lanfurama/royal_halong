import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve } from 'node:path'


// `dotenv/config` mặc định CHỈ nạp `.env` — repo này không có file đó, biến môi
// trường thật nằm ở `.env.local` (Next.js tự nạp, drizzle-kit thì không). Nạp
// tường minh, cùng cách `scripts/import/sanityClient.ts` đang làm; thiếu dòng
// này thì `pnpm db:migrate` không thấy DATABASE_URL dù đã điền đúng chỗ.
//
// Dùng `process.cwd()` chứ KHÔNG dùng `import.meta.dirname`: drizzle-kit
// transpile file config này sang CJS trước khi nạp, ở đó `import.meta.dirname`
// là `undefined` và `resolve()` ném "paths[0] must be of type string" — đã
// kiểm chứng bằng cách chạy thật, không suy đoán.
config({ path: resolve(process.cwd(), '.env.local') })

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
