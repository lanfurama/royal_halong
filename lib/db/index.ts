import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * KHÔNG đọc `process.env.DATABASE_URL` (hay tạo client) ở top-level module.
 *
 * `lib/db` bị nạp bởi cây import của cả `pnpm test` (257 test hiện tại,
 * nhiều test không liên quan gì tới DB nhưng import xuyên qua action/route)
 * lẫn `next build` — cả hai đều chạy KHI CHƯA có `DATABASE_URL` (Neon project
 * chưa được cấp phát, xem `.env.example`). `sanity/lib/live.ts` trong repo
 * này từng throw ngay lúc import khi thiếu `SANITY_API_READ_TOKEN`, buộc
 * `tests/setup.ts` phải giả lập biến môi trường chỉ để né crash — đừng lặp
 * lại kiểu lỗi đó ở đây. Thay vào đó, hoãn việc đọc env + tạo client tới khi
 * có truy vấn THẬT SỰ gọi vào `db`, qua một Proxy: import module này luôn an
 * toàn, lỗi "Thiếu DATABASE_URL" (nếu có) chỉ nổ ra tại thời điểm query.
 */
let cached: NeonHttpDatabase<typeof schema> | undefined

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!cached) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('Thiếu DATABASE_URL — xem .env.example')
    cached = drizzle(neon(url), { schema })
  }
  return cached
}

export const db: NeonHttpDatabase<typeof schema> = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

export * from './schema'
