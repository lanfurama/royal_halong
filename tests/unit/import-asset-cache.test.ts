import { describe, it, expect, vi } from 'vitest'
import { uploadAll } from '@/scripts/import/assets'

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
