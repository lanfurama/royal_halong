'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

/**
 * Studio phải tự import `sanity.config.ts` ở phía client.
 *
 * Nếu để server component import config rồi truyền qua prop, build sẽ vỡ:
 * config chứa hàm (`document.actions`, `document.newDocumentOptions`,
 * `structureTool({ structure })`), mà React không serialize hàm qua ranh giới
 * server → client. Import ngay trong file 'use client' thì config nằm trọn trong
 * bundle client và không phải đi qua ranh giới nào.
 */
export function Studio() {
  return <NextStudio config={config} />
}
