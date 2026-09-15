import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <h1 className="font-display text-gold-deep text-4xl">Không tìm thấy trang</h1>
      <p className="mt-4">Trang bạn tìm không tồn tại hoặc đã được chuyển đi.</p>
      <Link href="/vi" className="bg-gold text-ink mt-8 inline-block px-6 py-3 font-medium">
        Về trang chủ
      </Link>
    </div>
  )
}
