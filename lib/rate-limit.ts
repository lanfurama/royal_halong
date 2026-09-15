export const LIMIT = 5
export const WINDOW_MS = 10 * 60 * 1000

/**
 * Rate limit trong bộ nhớ tiến trình. Đủ cho một site marketing: chặn được
 * bot ngây thơ và người bấm nhầm nhiều lần.
 *
 * GIỚI HẠN trên Vercel (tự kiểm, không hứa hẹn quá): mỗi instance serverless
 * có Map riêng, không chia sẻ giữa các instance — traffic bị load-balance
 * qua nhiều instance thì hạn mức thực tế cao hơn `LIMIT` lần số instance.
 * Instance cũng có thể bị tái sử dụng cho nhiều request (giữ được state) hoặc
 * bị huỷ/lạnh sau một thời gian rảnh (mất state, hạn mức "reset" ngoài ý
 * muốn). Vì vậy đây chỉ là lớp chặn spam thô, KHÔNG phải rate limit chính
 * xác/đảm bảo. Nếu cần chặt hơn thì thay bằng Upstash Redis, giữ nguyên chữ
 * ký hàm này (rateLimit/resetRateLimit) để không phải sửa nơi gọi.
 */
const hits = new Map<string, number[]>()

export function resetRateLimit(): void {
  hits.clear()
}

export function rateLimit(
  key: string,
  now: number = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS)

  if (recent.length >= LIMIT) {
    const oldest = recent[0]
    hits.set(key, recent)
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
    }
  }

  recent.push(now)
  hits.set(key, recent)
  return { allowed: true, retryAfterSeconds: 0 }
}
