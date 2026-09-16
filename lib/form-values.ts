import { HONEYPOT_FIELD } from '@/lib/validation'

/**
 * Giá trị người dùng vừa gửi, đã bỏ trường bẫy bot, để form điền lại khi lỗi.
 *
 * Để ở module thường chứ KHÔNG để trong `app/actions/lead.ts`: file mang
 * chỉ thị `'use server'` chỉ được export hàm ASYNC, nên một hàm đồng bộ
 * exported ở đó làm `next build` đỏ — trong khi `pnpm test` và `pnpm typecheck`
 * vẫn xanh, vì cả hai đều không build.
 */
export function echoValues(raw: unknown): Record<string, string> {
  if (typeof raw !== 'object' || raw === null) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === HONEYPOT_FIELD) continue
    if (typeof v === 'string') out[k] = v
  }
  return out
}
