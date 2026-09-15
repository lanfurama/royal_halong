export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Dữ liệu do chính ta dựng từ Sanity, không phải chuỗi người dùng nhập tự do.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
