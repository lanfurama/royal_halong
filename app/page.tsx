export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl text-gold-deep">Royal Hạ Long</h1>
      <p className="mt-4">Chữ thường tiếng Việt: đầy đủ dấu — ạ ằ ể ỗ ữ ợ.</p>
      <p className="mt-2 text-gold-text">Chữ nhỏ màu vàng dùng gold-text (5.32:1).</p>
      <p className="font-accent mt-2 text-2xl italic">Cormorant nghiêng</p>
      <div className="mt-6 flex gap-3">
        <span className="bg-gold text-ink px-4 py-2">Nút nền gold, chữ ink</span>
        <span className="bg-ink px-4 py-2 text-gold-hi">Nền tối, chữ gold-hi</span>
      </div>
    </main>
  )
}
