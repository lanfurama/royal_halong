import { describe, it, expect, beforeAll } from 'vitest'
import { is } from 'drizzle-orm'
import { PgDatabase } from 'drizzle-orm/pg-core'

/**
 * `lib/db` khởi tạo client LAZY qua Proxy để `pnpm test` và `next build` chạy
 * được khi chưa cấp Neon. Bộ test này chốt hai điều kiện của cách làm đó:
 * (1) import module KHÔNG được throw khi thiếu DATABASE_URL;
 * (2) Proxy phải TRONG SUỐT với introspection — bản đầu chỉ có trap `get`,
 *     khiến `'select' in db` -> false và `is(db, PgDatabase)` -> false dù `db`
 *     đúng là instance đó. Chưa hỏng runtime hôm nay, nhưng hỏng lặng lẽ khi
 *     nâng version drizzle hoặc dùng API batch/replica.
 */
describe('lib/db — client lazy', () => {
  it('import được khi CHƯA có DATABASE_URL, và chỉ nổ lúc truy vấn', async () => {
    delete process.env.DATABASE_URL
    const mod = await import('@/lib/db')
    expect(mod.db).toBeDefined()
    expect(() => (mod.db as any).select()).toThrow(/DATABASE_URL/)
  })
})

describe('lib/db — Proxy trong suốt với introspection', () => {
  let db: any
  let leads: any

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@ep-x-pooler.aws.neon.tech/neondb?sslmode=require'
    // Reset module để client lazy khởi tạo lại với env vừa đặt.
    const mod = await import('@/lib/db')
    db = mod.db
    leads = mod.leads
  })

  it("'select' in db", () => {
    expect('select' in db).toBe(true)
  })

  it('getPrototypeOf trả prototype thật, không phải Object.prototype', () => {
    expect(Object.getPrototypeOf(db)).not.toBe(Object.prototype)
  })

  it('is(db, PgDatabase) nhận đúng kiểu', () => {
    expect(is(db, PgDatabase)).toBe(true)
  })

  it('Object.keys(db) không ném TypeError', () => {
    expect(() => Object.keys(db)).not.toThrow()
  })

  it('select/insert vẫn sinh đúng SQL', () => {
    expect(db.select().from(leads).toSQL().sql).toContain('leads')
    const sql = db
      .insert(leads)
      .values({ type: 'wedding', name: 'A', email: 'a@b.co', phone: '0900000000' })
      .toSQL().sql
    expect(sql).toContain('insert into')
  })
})
