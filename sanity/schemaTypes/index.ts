import type { SchemaTypeDefinition } from 'sanity'
import { localeString } from './objects/localeString'
import { localeText } from './objects/localeText'
import { localeBlock } from './objects/localeBlock'
import { localeSlug } from './objects/localeSlug'
import { figure } from './objects/figure'
import { link } from './objects/link'
import { seo } from './objects/seo'
import { room } from './documents/room'
import { post } from './documents/post'
import { offer } from './documents/offer'
import { venue } from './documents/venue'
import { hall } from './documents/hall'
import { galleryAlbum } from './documents/galleryAlbum'
import { testimonial } from './documents/testimonial'
import { sectionTypes } from './sections'
import { page } from './documents/page'
import { siteSettings } from './documents/siteSettings'
import { navigation } from './documents/navigation'
import { homePage } from './documents/homePage'

export const schemaTypes: SchemaTypeDefinition[] = [
  localeString,
  localeText,
  localeBlock,
  localeSlug,
  figure,
  link,
  seo,
  room, post, offer, venue, hall, galleryAlbum, testimonial,
  ...sectionTypes, page,
  siteSettings, navigation, homePage,
]
