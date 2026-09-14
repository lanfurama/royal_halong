import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stripSizeSuffix, collectOriginalImages } from '@/scripts/import/assets'

describe('stripSizeSuffix()', () => {
  it('bỏ hậu tố kích thước srcset của WordPress', () => {
    expect(stripSizeSuffix('/u/2023/04/bed-300x300.png')).toBe('/u/2023/04/bed.png')
    expect(stripSizeSuffix('/u/2023/04/room-1024x683.jpg')).toBe('/u/2023/04/room.jpg')
    expect(stripSizeSuffix('/u/2023/04/a-150x150.jpeg')).toBe('/u/2023/04/a.jpeg')
  })

  it('giữ nguyên tên file vốn đã là bản gốc', () => {
    expect(stripSizeSuffix('/u/2023/04/bed.png')).toBe('/u/2023/04/bed.png')
    expect(stripSizeSuffix('/u/2023/04/royal-halong.jpg')).toBe('/u/2023/04/royal-halong.jpg')
  })

  it('KHÔNG cắt nhầm tên file có chữ số nhưng không phải hậu tố kích thước', () => {
    expect(stripSizeSuffix('/u/2023/04/buffet-2-9.jpg')).toBe('/u/2023/04/buffet-2-9.jpg')
    expect(stripSizeSuffix('/u/2023/04/quy-2-2023.jpg')).toBe('/u/2023/04/quy-2-2023.jpg')
    expect(stripSizeSuffix('/u/2023/04/img2x3.jpg')).toBe('/u/2023/04/img2x3.jpg')
  })

  it('chỉ cắt ở ngay trước phần mở rộng', () => {
    expect(stripSizeSuffix('/u/a-300x300/b.jpg')).toBe('/u/a-300x300/b.jpg')
  })
})

describe('collectOriginalImages()', () => {
  let dir: string

  // Fixture tạm trong thư mục temp của OS — không đụng wp-content/, không
  // commit file fixture vào repo. Dọn sạch sau mỗi test.
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'import-assets-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('có bản gốc thật trên đĩa: trả về bản gốc, không trả biến thể', async () => {
    await writeFile(join(dir, 'hero.jpg'), Buffer.alloc(100, 'a'))
    await writeFile(join(dir, 'hero-300x300.jpg'), Buffer.alloc(10, 'a'))
    await writeFile(join(dir, 'hero-1024x683.jpg'), Buffer.alloc(50, 'a'))

    const result = await collectOriginalImages(dir)

    expect(result).toEqual([join(dir, 'hero.jpg')])
    expect(result).not.toContain(join(dir, 'hero-300x300.jpg'))
    expect(result).not.toContain(join(dir, 'hero-1024x683.jpg'))
  })

  it('chỉ có biến thể (không có bản gốc): trả về biến thể lớn nhất theo byte', async () => {
    // Tên đặt sao cho file lớn nhất KHÔNG đứng đầu cũng KHÔNG đứng cuối, dù
    // readdir() sắp theo thứ tự bảng chữ cái hay theo thứ tự tạo file —
    // để test không "ăn may" trúng một trường hợp biên.
    await writeFile(join(dir, 'room-100x100.jpg'), Buffer.alloc(10, 'a')) // tạo trước, tên đầu bảng chữ cái
    await writeFile(join(dir, 'room-300x300.jpg'), Buffer.alloc(500, 'a')) // tạo giữa, tên giữa bảng chữ cái — LỚN NHẤT
    await writeFile(join(dir, 'room-800x600.jpg'), Buffer.alloc(50, 'a')) // tạo sau cùng, tên cuối bảng chữ cái

    const result = await collectOriginalImages(dir)

    expect(result).toEqual([join(dir, 'room-300x300.jpg')])
  })

  it('quét đệ quy thư mục con lồng sâu (khớp cây thật uploads/2023/04/...)', async () => {
    const nested = join(dir, '2023', '04')
    await mkdir(nested, { recursive: true })
    await writeFile(join(nested, 'deep.jpg'), Buffer.alloc(20, 'a'))

    const result = await collectOriginalImages(dir)

    expect(result).toEqual([join(nested, 'deep.jpg')])
  })

  it('bỏ qua file không phải ảnh', async () => {
    await writeFile(join(dir, 'photo.jpg'), Buffer.alloc(20, 'a'))
    await writeFile(join(dir, 'readme.txt'), Buffer.alloc(20, 'a'))
    await writeFile(join(dir, 'notes.md'), Buffer.alloc(20, 'a'))

    const result = await collectOriginalImages(dir)

    expect(result).toEqual([join(dir, 'photo.jpg')])
  })

  it('kết quả đã sắp xếp và không trùng lặp', async () => {
    await writeFile(join(dir, 'zebra.jpg'), Buffer.alloc(10, 'a'))
    await writeFile(join(dir, 'apple-300x300.jpg'), Buffer.alloc(5, 'a'))
    await writeFile(join(dir, 'apple-600x400.jpg'), Buffer.alloc(15, 'a'))
    const nested = join(dir, 'sub')
    await mkdir(nested, { recursive: true })
    await writeFile(join(nested, 'mango.png'), Buffer.alloc(10, 'a'))

    const result = await collectOriginalImages(dir)

    expect(result).toEqual([...result].sort())
    expect(new Set(result).size).toBe(result.length)
  })
})
