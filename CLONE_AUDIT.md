# Clone Audit — royalhalonghotel.com/vi/

> **How to read this file.** The section below is raw `audit-clone.mjs` output. Two of its
> categories are expected noise for a **faithful clone** and are triaged here.

## Triage

| Category | Raw count | Real issues | Notes |
|---|---|---|---|
| 保真度硬伤 (font/image/colour) | 0 | **0** | ✅ Clean. Fonts self-hosted, all images local, colours copied from source CSS. |
| 追踪脚本 / 统计像素 | 3 | **0** | All false positives — see below. |
| 原站品牌残留 | 1,452 | **0 for now** | Expected: faithful mode preserves the original brand verbatim. Becomes a **blocker before deployment** — see the replacement checklist in `NOTES.md`. |
| 外链风险 | — | triaged | `drive.google.com` (96) and `secure.gravatar.com` are the original's own external links, intentionally preserved. |

### The 3 tracking hits are all false positives

1. `.od-skills/.../SKILL.md:157` — the skill's own documentation, not clone output.
2. `font-awesome/css/all.css:2205` — the `.fa-hotjar` **icon glyph** (`content: "\f3b1"`).
3. `font-awesome/webfonts/fa-brands-400.svg:1616` — the same Hotjar brand glyph outline.

Independent verification over the 22 delivered pages:

```
grep -liE "googletagmanager|connect\.facebook\.net|google-analytics|fbq\(|hotjar\.com|clarity\.ms|gtag\(" index.html */index.html
→ (no matches)
```

Google Tag Manager (`GT-P84QK984`) and the Facebook Customer Chat SDK were both removed from
all 22 pages. See `CLONE_REPORT.md` for per-tracker counts.

### Brand residue is intentional in this mode

This is a **忠实复刻 / faithful clone**, so every "Royal Halong Hotel" string, photograph, logo
and legal identifier is preserved deliberately. Do **not** treat the 1,452 findings below as
defects — treat them as the work list for `NOTES.md` → *"Must replace before any public
deployment"*, which additionally flags the Bộ Công Thương registration badge, the company
registration number, and the Salient ThemeForest licence requirement.

---

# Clone Audit

- Project: /Users/bcmac/Library/Application Support/Open Design/namespaces/release-stable/data/projects/63ba9b92-8049-4028-b6fb-6705c18e81fb
- Scanned files: 54
- Findings: 1452

## 保真度硬伤（字体 / 图片 / 颜色）
- 未发现

## 追踪脚本 / 统计像素
- .od-skills/web-clone-a5a9cd5828/SKILL.md:157 · Google Tag Manager · `googletagmanager`
- wp-content/plugins/types/vendor/toolset/toolset-common/res/lib/font-awesome/css/all.css:2205 · Hotjar / Clarity · `hotjar`
- wp-content/plugins/types/vendor/toolset/toolset-common/res/lib/font-awesome/webfonts/fa-brands-400.svg:1616 · Hotjar / Clarity · `hotjar`

## 原站品牌残留
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:9 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:9 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:13 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:13 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:16 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:24 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:27 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:251 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:251 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:251 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:251 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:251 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:251 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:300 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:321 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:327 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:332 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:370 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:391 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:410 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:446 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:573 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:660 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:15 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:17 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:192 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:192 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:192 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:192 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:192 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:192 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:249 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:772 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- casino/index.html:865 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:15 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:17 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:247 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:331 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:536 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- culinary/index.html:629 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:15 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:17 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:248 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:326 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:544 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- deluxe/index.html:637 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:15 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:17 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:190 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:247 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:314 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:349 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:566 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- experiences/index.html:659 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:11 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- index.html:16 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- index.html:19 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:23 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:195 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:195 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:195 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:195 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:195 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:195 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:252 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:403 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:538 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- index.html:675 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- index.html:768 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:12 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- luu-tru-phong-khach-san-villas/index.html:16 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:17 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- luu-tru-phong-khach-san-villas/index.html:19 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:25 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:25 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- luu-tru-phong-khach-san-villas/index.html:25 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:25 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:25 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:25 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:191 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:248 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:538 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- luu-tru-phong-khach-san-villas/index.html:631 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:15 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:17 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:210 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:210 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:210 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:210 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:210 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:210 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:267 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:292 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- news/index.html:311 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- news/index.html:314 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- news/index.html:317 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- news/index.html:320 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:320 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:340 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:340 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:374 · brand residue: Royal Halong Hotel · `ROYAL HALONG HOTEL`
- news/index.html:465 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- news/index.html:558 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:15 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:17 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:188 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:188 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:188 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:188 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:188 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:188 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:245 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:361 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:544 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- offers/index.html:637 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:11 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:15 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:17 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:23 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:189 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:189 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- our-announcement/index.html:189 · brand residue: Royal Halong Hotel · `Royal Halong Hotel`
- 还有 228 条未展开

## 日文残留
- 未发现

## TODO / 占位内容
- .od-skills/web-clone-a5a9cd5828/SKILL.md:267 · TODO / placeholder content · `TODO`
- .od-skills/web-clone-a5a9cd5828/SKILL.md:282 · TODO / placeholder content · `TODO`
- .od-skills/web-clone-a5a9cd5828/references/deliverables.md:137 · TODO / placeholder content · `TODO`
- .od-skills/web-clone-a5a9cd5828/references/design-dna.md:41 · TODO / placeholder content · `TODO`
- wp-content/plugins/types/vendor/toolset/toolset-common/res/lib/font-awesome/css/all.css:2607 · TODO / placeholder content · `todo`
- wp-content/plugins/types/vendor/toolset/toolset-common/res/lib/font-awesome/webfonts/fa-brands-400.svg:2498 · TODO / placeholder content · `todo`
- wp-content/themes/salient/css/fonts/icomoon.svg:87 · TODO / placeholder content · `todo`

## 外部依赖 / 外链风险
- .od-skills/web-clone-a5a9cd5828/SKILL.md:64 · external URL · `https://raw.githubusercontent.com/`
- .od-skills/web-clone-a5a9cd5828/SKILL.md:173 · external URL · `http://127.0.0.1:`
- .od-skills/web-clone-a5a9cd5828/SKILL.md:178 · external URL · `http://127.0.0.1:`
- .od-skills/web-clone-a5a9cd5828/SKILL.md:185 · external URL · `http://127.0.0.1:`
- .od-skills/web-clone-a5a9cd5828/references/design-dna.md:7 · external URL · `https://github.com/zanwei/design-dna`
- .od-skills/web-clone-a5a9cd5828/references/effect-extraction.md:6 · external URL · `https://github.com/lixiaolin94/skills`
- .od-skills/web-clone-a5a9cd5828/references/marbles-case.md:3 · external URL · `https://chiuhans111.github.io/marbles/`
- .od-skills/web-clone-a5a9cd5828/references/static-mirror.md:38 · external URL · `https://use.typekit.net/`
- .od-skills/web-clone-a5a9cd5828/references/static-mirror.md:49 · external URL · `https://use.typekit.net/`
- .od-skills/web-clone-a5a9cd5828/references/static-mirror.md:51 · external URL · `https://use\.typekit\.net/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:8 · external URL · `https://yoast.com/wordpress/plugins/seo/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:15 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:17 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://schema.org`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#article`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#/schema/person/a470a10cd21f0bedcfcfe71c9809b343`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#organization`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#primaryimage`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#respond`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#website`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#primaryimage`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#primaryimage`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#breadcrumb`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#primaryimage`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#breadcrumb`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#website`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#organization`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/?s={search_term_string}`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#organization`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#/schema/person/a470a10cd21f0bedcfcfe71c9809b343`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/#/schema/person/image/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://secure.gravatar.com/avatar/f2b655a63cf76731281a8bd14396dc3b1c7a5cc239675905f156ff189f3000d6?s=96&d=mm&r=g`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://secure.gravatar.com/avatar/f2b655a63cf76731281a8bd14396dc3b1c7a5cc239675905f156ff189f3000d6?s=96&d=mm&r=g`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:30 · external URL · `https://royalhalonghotel.com/vi/author/rih_admin_tech/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:121 · external URL · `https://royalhalonghotel.com/vi/?p=4336`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:232 · external URL · `https://royalhalonghotel.com/vi/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:326 · external URL · `https://royalhalonghotel.com/vi/category/press-release-vi/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:332 · external URL · `https://royalhalonghotel.com/vi/author/rih_admin_tech/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:332 · external URL · `https://royalhalonghotel.com/vi/canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/#respond`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:374 · external URL · `https://www.facebook.com/royalhalonghotelandvillas?__cft__[0]=AZWMtCEPktie_phC2AeussraSByLeKa4D1lOJCDffCYAT25W2Oz8TfF5EJdJZ15CaqimX_FE1dPDqIsYgkgBU2NnE03b_6-cJd`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:374 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:375 · external URL · `https://royalhalonghotel.com/?fbclid=IwZXh0bgNhZW0CMTAAAR02boO6W9gbCX4XVdQn71OAzf9MkJ_g34JF6zRyDgkF-5QOITKexFTxQpE_aem_FP5N5hUTXxyQg1G706qmLg`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:375 · external URL · `https://royalhalonghotel.com`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:395 · external URL · `http://www.royalhalonghotel.com/?fbclid=IwZXh0bgNhZW0CMTAAAR2QDMkr-y7YffwSKyN5FGPx7hZBWISsyCpWWQPz-zR66sHZRSG0kLIZcGY_aem_IWNnBYJ_iauxiVJqqLGgFQ`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:432 · external URL · `https://royalhalonghotel.com/vi/category/press-release-vi/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:446 · external URL · `https://royalhalonghotel.com/vi/author/rih_admin_tech/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:458 · external URL · `https://royalhalonghotel.com/vi/category/press-release-vi/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:458 · external URL · `https://royalhalonghotel.com/vi/category/travel-vi/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:472 · external URL · `https://royalhalonghotel.com/vi/author/mark/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:490 · external URL · `https://royalhalonghotel.com/wp-comments-post.php`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:528 · external URL · `https://www.google.com/maps/place/Royal+Villas+Halong+-Casino/@20.9511168,107.0335968,17z/data=!4m20!1m10!3m9!1s0x314a58f2131ffc0b:0xf552eee4639bb007!2sRoyal+Vi`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:544 · external URL · `https://royalhalonghotel.com/casino/`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:545 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:549 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:567 · external URL · `http://online.gov.vn/Home/WebDetails/125953`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:660 · external URL · `https://twitter.com`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:660 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:660 · external URL · `https://www.instagram.com`
- canh-bao-trang-facebook-gia-mao-khach-san-royal-halong-hotel/index.html:660 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- casino/index.html:6 · external URL · `https://royalhalonghotel.com/royal-international-club-halong-casino-for-foreigners/`
- casino/index.html:8 · external URL · `https://royalhalonghotel.com/royal-international-club-halong-casino-for-foreigners/`
- casino/index.html:10 · external URL · `https://yoast.com/wordpress/plugins/seo/`
- casino/index.html:16 · external URL · `https://royalhalonghotel.com/vi/casino/`
- casino/index.html:18 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- casino/index.html:23 · external URL · `https://schema.org`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/vi/casino/`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/vi/casino/`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/vi/casino/#breadcrumb`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/vi/casino/`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/vi/casino/#breadcrumb`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/vi/`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/?s={search_term_string}`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- casino/index.html:23 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- casino/index.html:23 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- casino/index.html:23 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- casino/index.html:83 · external URL · `https://royalhalonghotel.com/vi/?p=2685`
- casino/index.html:173 · external URL · `https://royalhalonghotel.com/vi/`
- casino/index.html:228 · external URL · `https://royalhalonghotel.com/royal-international-club-halong-casino-for-foreigners/`
- casino/index.html:727 · external URL · `https://www.google.com/maps/place/Royal+Villas+Halong+-Casino/@20.9511168,107.0335968,17z/data=!4m20!1m10!3m9!1s0x314a58f2131ffc0b:0xf552eee4639bb007!2sRoyal+Vi`
- casino/index.html:743 · external URL · `https://royalhalonghotel.com/casino/`
- casino/index.html:744 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- casino/index.html:748 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- casino/index.html:766 · external URL · `http://online.gov.vn/Home/WebDetails/125953`
- casino/index.html:840 · external URL · `https://royalhalonghotel.com/royal-international-club-halong-casino-for-foreigners/`
- casino/index.html:865 · external URL · `https://twitter.com`
- casino/index.html:865 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- casino/index.html:865 · external URL · `https://www.instagram.com`
- casino/index.html:865 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- culinary/index.html:6 · external URL · `https://royalhalonghotel.com/culinary-at-royal-ha-long-hotel/`
- culinary/index.html:8 · external URL · `https://royalhalonghotel.com/culinary-at-royal-ha-long-hotel/`
- culinary/index.html:10 · external URL · `https://yoast.com/wordpress/plugins/seo/`
- culinary/index.html:16 · external URL · `https://royalhalonghotel.com/vi/culinary/`
- culinary/index.html:18 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- culinary/index.html:23 · external URL · `https://schema.org`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/vi/culinary/`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/vi/culinary/`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/vi/culinary/#breadcrumb`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/vi/culinary/`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/vi/culinary/#breadcrumb`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/vi/`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/?s={search_term_string}`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- culinary/index.html:23 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- culinary/index.html:23 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- culinary/index.html:23 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- culinary/index.html:81 · external URL · `https://royalhalonghotel.com/vi/?p=2692`
- culinary/index.html:171 · external URL · `https://royalhalonghotel.com/vi/`
- culinary/index.html:226 · external URL · `https://royalhalonghotel.com/culinary-at-royal-ha-long-hotel/`
- culinary/index.html:285 · external URL · `https://drive.google.com/file/d/1F64SrHIc7mcniUfixwenkBPb3yMlvUcK/view`
- culinary/index.html:355 · external URL · `https://drive.google.com/file/d/1F64SrHIc7mcniUfixwenkBPb3yMlvUcK/view`
- culinary/index.html:491 · external URL · `https://www.google.com/maps/place/Royal+Villas+Halong+-Casino/@20.9511168,107.0335968,17z/data=!4m20!1m10!3m9!1s0x314a58f2131ffc0b:0xf552eee4639bb007!2sRoyal+Vi`
- culinary/index.html:507 · external URL · `https://royalhalonghotel.com/casino/`
- culinary/index.html:508 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- culinary/index.html:512 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- culinary/index.html:530 · external URL · `http://online.gov.vn/Home/WebDetails/125953`
- culinary/index.html:604 · external URL · `https://royalhalonghotel.com/culinary-at-royal-ha-long-hotel/`
- culinary/index.html:629 · external URL · `https://twitter.com`
- culinary/index.html:629 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- culinary/index.html:629 · external URL · `https://www.instagram.com`
- culinary/index.html:629 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- deluxe/index.html:6 · external URL · `https://royalhalonghotel.com/deluxe-royal-halong-hotel-room/`
- deluxe/index.html:8 · external URL · `https://royalhalonghotel.com/deluxe-royal-halong-hotel-room/`
- deluxe/index.html:10 · external URL · `https://yoast.com/wordpress/plugins/seo/`
- deluxe/index.html:16 · external URL · `https://royalhalonghotel.com/vi/deluxe/`
- deluxe/index.html:18 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- deluxe/index.html:23 · external URL · `https://schema.org`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/vi/deluxe/`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/vi/deluxe/`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/vi/deluxe/#breadcrumb`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/vi/deluxe/`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/vi/deluxe/#breadcrumb`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/vi/`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/?s={search_term_string}`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- deluxe/index.html:23 · external URL · `https://royalhalonghotel.com/#/schema/logo/image/`
- deluxe/index.html:23 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- deluxe/index.html:23 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- deluxe/index.html:82 · external URL · `https://royalhalonghotel.com/vi/?p=2676`
- deluxe/index.html:172 · external URL · `https://royalhalonghotel.com/vi/`
- deluxe/index.html:227 · external URL · `https://royalhalonghotel.com/deluxe-royal-halong-hotel-room/`
- deluxe/index.html:391 · external URL · `https://royalhalonghotel.com/vi/accommodation/suite/`
- deluxe/index.html:499 · external URL · `https://www.google.com/maps/place/Royal+Villas+Halong+-Casino/@20.9511168,107.0335968,17z/data=!4m20!1m10!3m9!1s0x314a58f2131ffc0b:0xf552eee4639bb007!2sRoyal+Vi`
- deluxe/index.html:515 · external URL · `https://royalhalonghotel.com/casino/`
- deluxe/index.html:516 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- deluxe/index.html:520 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- deluxe/index.html:538 · external URL · `http://online.gov.vn/Home/WebDetails/125953`
- deluxe/index.html:612 · external URL · `https://royalhalonghotel.com/deluxe-royal-halong-hotel-room/`
- deluxe/index.html:637 · external URL · `https://twitter.com`
- deluxe/index.html:637 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- deluxe/index.html:637 · external URL · `https://www.instagram.com`
- deluxe/index.html:637 · external URL · `https://www.tripadvisor.com/Hotel_Review-g13163470-d7373971-Reviews-Royal_Halong_Hotel-Bai_Chay_Halong_Bay_Quang_Ninh_Province.html`
- experiences/index.html:6 · external URL · `https://royalhalonghotel.com/experiences-at-royal-halong-hotel/`
- experiences/index.html:8 · external URL · `https://royalhalonghotel.com/experiences-at-royal-halong-hotel/`
- experiences/index.html:10 · external URL · `https://yoast.com/wordpress/plugins/seo/`
- experiences/index.html:16 · external URL · `https://royalhalonghotel.com/vi/experiences/`
- experiences/index.html:18 · external URL · `https://www.facebook.com/royalhalonghotelandvillas`
- experiences/index.html:23 · external URL · `https://schema.org`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/vi/experiences/`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/vi/experiences/`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/vi/experiences/#breadcrumb`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/vi/experiences/`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/vi/experiences/#breadcrumb`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/vi/`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/#website`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/?s={search_term_string}`
- experiences/index.html:23 · external URL · `https://royalhalonghotel.com/#organization`
- 还有 814 条未展开

## 结论
- 需要处理上面的残留项后再声明可部署。
