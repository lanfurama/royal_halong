import { defineType } from 'sanity'
import { localeFields, TRANSLATION_FIELDSET } from './localeFields'

export const localeText = defineType({
  name: 'localeText',
  title: 'Đoạn văn đa ngữ',
  type: 'object',
  fieldsets: [TRANSLATION_FIELDSET],
  fields: localeFields((_locale, isDefault) => ({
    type: 'text',
    rows: 3,
    ...(isDefault ? { validation: (r: any) => r.required().min(1) } : {}),
  })),
  preview: { select: { title: 'vi' } },
})
