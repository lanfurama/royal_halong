import { defineType } from 'sanity'
import { localeFields, TRANSLATION_FIELDSET } from './localeFields'

export const localeString = defineType({
  name: 'localeString',
  title: 'Chuỗi đa ngữ',
  type: 'object',
  fieldsets: [TRANSLATION_FIELDSET],
  fields: localeFields((_locale, isDefault) => ({
    type: 'string',
    ...(isDefault ? { validation: (r: any) => r.required().min(1) } : {}),
  })),
  preview: { select: { title: 'vi', subtitle: 'en' } },
})
