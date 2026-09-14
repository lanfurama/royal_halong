import type { StructureResolver } from 'sanity/structure'

const SINGLETONS = [
  { id: 'siteSettings', title: 'Cấu hình site' },
  { id: 'navigation', title: 'Menu điều hướng' },
  { id: 'homePage', title: 'Trang chủ' },
] as const

export const SINGLETON_IDS: string[] = SINGLETONS.map((s) => s.id)

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Nội dung')
    .items([
      ...SINGLETONS.map(({ id, title }) =>
        S.listItem()
          .title(title)
          .id(id)
          .child(S.document().schemaType(id).documentId(id).title(title)),
      ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETON_IDS.includes(item.getId() ?? ''),
      ),
    ])
