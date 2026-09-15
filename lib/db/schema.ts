import { pgTable, uuid, text, integer, date, timestamp, index } from 'drizzle-orm/pg-core'

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 'wedding' | 'mice' | 'general' */
    type: text('type').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    eventDate: date('event_date'),
    guestCount: integer('guest_count'),
    message: text('message'),
    /** slug trang đã gửi form, để biết lead đến từ đâu */
    sourcePage: text('source_page'),
    locale: text('locale').notNull().default('vi'),
    /** 'new' | 'contacted' | 'closed' */
    status: text('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('leads_created_at_idx').on(table.createdAt),
    index('leads_status_idx').on(table.status),
  ],
)

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  locale: text('locale').notNull().default('vi'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
})

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type NewSubscriber = typeof newsletterSubscribers.$inferInsert
