import { describe, it, expect, vi } from 'vitest'
import { uploadAll, uploadOriginals } from '@/scripts/import/assets'

describe('uploadAll()', () => {
  it('chỉ upload file chưa có trong cache', async () => {
    const upload = vi.fn(async (p: string) => `image-${p.split('/').pop()}`)
    const cache = { '/a/one.jpg': 'image-one.jpg' }

    const next = await uploadAll(['/a/one.jpg', '/a/two.jpg'], cache, upload)

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload).toHaveBeenCalledWith('/a/two.jpg')
    expect(next['/a/one.jpg']).toBe('image-one.jpg')
    expect(next['/a/two.jpg']).toBe('image-two.jpg')
  })

  it('không làm mất mục cũ trong cache', async () => {
    const upload = vi.fn(async () => 'image-new')
    const cache = { '/a/old.jpg': 'image-old' }
    const next = await uploadAll(['/a/new.jpg'], cache, upload)
    expect(next['/a/old.jpg']).toBe('image-old')
  })

  it('chạy lại với cùng đầu vào không upload thêm lần nào', async () => {
    const upload = vi.fn(async (p: string) => `image-${p}`)
    const first = await uploadAll(['/a/x.jpg'], {}, upload)
    upload.mockClear()
    const second = await uploadAll(['/a/x.jpg'], first, upload)
    expect(upload).not.toHaveBeenCalled()
    expect(second).toEqual(first)
  })
})

describe('uploadOriginals()', () => {
  // Bug thật đã xảy ra: `collectOriginalImages()` không tìm thấy bản gốc
  // `area.png` trên đĩa nên trả về biến thể `area-300x300.png` — nhưng parser
  // (`toImageRef` → `stripSizeSuffix`) luôn tạo `ParsedImageRef.filePath` = 'area.png'
  // BẤT KỂ tên đã strip có thật trên đĩa hay không. Nếu cache khoá theo đường dẫn
  // THẬT (area-300x300.png) thì tra cứu ở pha transform luôn trượt cho những icon
  // dạng này (60/60 icon phòng bị mất). Khoá theo đường dẫn ĐÃ STRIP mới khớp với
  // parser bằng cấu trúc, không phải trùng hợp.
  it('khoá cache theo đường dẫn ĐÃ STRIP, không theo đường dẫn thật trên đĩa', async () => {
    const upload = vi.fn(async (p: string) => `image-${p}`)

    const next = await uploadOriginals(['/u/area-300x300.png'], {}, upload)

    // Upload đúng file THẬT tồn tại trên đĩa.
    expect(upload).toHaveBeenCalledWith('/u/area-300x300.png')
    // Nhưng cache khoá theo tên ĐÃ STRIP — khớp với filePath mà parser tạo ra.
    expect(next['/u/area.png']).toBe('image-/u/area-300x300.png')
    // KHÔNG có mục nào khoá theo tên thật — đó chính là cách lỗi cũ xảy ra.
    expect(next['/u/area-300x300.png']).toBeUndefined()
  })

  it('file đã có bản gốc thật trên đĩa: khoá cache = chính đường dẫn đó (strip là idempotent)', async () => {
    const upload = vi.fn(async (p: string) => `image-${p}`)
    const next = await uploadOriginals(['/u/hero.jpg'], {}, upload)
    expect(next['/u/hero.jpg']).toBe('image-/u/hero.jpg')
  })

  it('chạy lại với cùng đầu vào không upload thêm lần nào (cache khoá theo path đã strip)', async () => {
    const upload = vi.fn(async (p: string) => `image-${p}`)
    const first = await uploadOriginals(['/u/area-300x300.png'], {}, upload)
    upload.mockClear()
    const second = await uploadOriginals(['/u/area-300x300.png'], first, upload)
    expect(upload).not.toHaveBeenCalled()
    expect(second).toEqual(first)
  })
})
