import type { SchemaTypeDefinition } from 'sanity'
import { localeString } from './objects/localeString'
import { localeText } from './objects/localeText'
import { localeBlock } from './objects/localeBlock'
import { localeSlug } from './objects/localeSlug'
import { figure } from './objects/figure'
import { link } from './objects/link'
import { seo } from './objects/seo'

export const schemaTypes: SchemaTypeDefinition[] = [
  localeString,
  localeText,
  localeBlock,
  localeSlug,
  figure,
  link,
  seo,
]
