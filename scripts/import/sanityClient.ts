// Dùng `createClient` re-export từ `next-sanity` thay vì import thẳng từ
// `@sanity/client`: `@sanity/client` KHÔNG phải dependency trực tiếp của repo
// (chỉ là dependency lồng của `sanity`/`next-sanity`) — với pnpm strict
// node_modules, `import ... from '@sanity/client'` không resolve được trừ khi
// thêm gói mới, mà nhiệm vụ này yêu cầu không cài thêm gì. `next-sanity` re-export
// nguyên `createClient` của `@sanity/client` (`export * from '@sanity/client'`
// trong next-sanity/dist/index.js) nên hành vi giống hệt — và đây cũng đúng là
// cách `sanity/lib/client.ts` sẵn có trong repo đang làm.
import { createClient } from 'next-sanity'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { ROOT } from './paths'

// `dotenv/config` mặc định chỉ nạp `.env`, KHÔNG nạp `.env.local` — mà biến
// môi trường thật của repo (token, project id) nằm ở `.env.local`. Next.js tự
// nạp `.env.local`, nhưng script chạy bằng tsx thì không — phải nạp tường minh.
config({ path: resolve(ROOT, '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset) throw new Error('Thiếu NEXT_PUBLIC_SANITY_PROJECT_ID/DATASET')
if (!token) throw new Error('Thiếu SANITY_API_WRITE_TOKEN — xem .env.example')

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-09-14',
  token,
  useCdn: false,
})
