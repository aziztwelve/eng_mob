# Lesson platform tiles

Three separate 600×360 RGBA native UI assets corresponding to selected panel 9 “Дорожка из плиток”. The original comparison board is `/home/aziz/.codex/generated_images/01a142e5-e3da-70d0-8ebe-c9f6c4f25182/exec-05945e13-4ded-4933-9f0d-70116ee3e820.png`.

- `tile-green.png`: completed state, 112KiB. Source `exec-a15b90c7-9bde-4815-a560-c05005b4d81d.png`.
- `tile-blue.png`: current state, 107KiB. Source `exec-c7bd0606-bf36-41aa-863a-392962478f22.png`.
- `tile-gray.png`: locked state, 107KiB. Source `exec-3a3e42dc-4d2d-47ec-bc8f-e2cc1b327655.png`.

All sources remain under `/home/aziz/.codex/generated_images/01a14706-adb5-70f1-9462-25373af1f03d/`. Generated with separate built-in imagegen calls, with true transparency enabled. Files resized proportionally and PNG-optimized using Pillow, generated alpha preserved. Source canvas ratio is 1619×971, effectively the requested 5:3 canvas.

Initial prompt: one isolated rounded square platform from panel 9, almost flat top face with shallow isometric perspective, gently rounded corners, slight clockwise screen orientation, thick visible front and right extrusion, white inset edge highlight. Pale mint top and spring-green extrusion. Wide approximately 3:2 tile silhouette on 600×360 target canvas. Absolutely empty top: no text, numbers, icons, buttons, characters, scenery, ground or background. Genuine transparent alpha and clean antialiased edges.

The blue and gray prompts edited the generated green tile, changing only palette and preserving silhouette, orientation, dimensions, highlights and empty top face. Blue uses pale ice cyan top and sky-blue extrusion; gray uses pale cool-gray top and silver-gray extrusion.

Visual note: the generator leaves very small disconnected alpha fringe around some edges. It is unobtrusive at native display scale over the pale sky, but inspect before using over dark backgrounds.

## Revision: flatter selected platform

The three filenames above were replaced with a second set derived directly from selected-9.png, flattening the matte top and using a wider simple bevel and darker bottom rim. Sources: green exec-aac32688-311e-46b8-8bb0-f7ecc54fd4cf.png; blue exec-48d56a7d-6501-49ce-9f3a-76ccef34a221.png; gray exec-84119e4d-b332-4056-b770-f28cff58d2cb.png, in the same generated_images directory. All are 600x360 RGBA. The regeneration prompt requested extraction of only the green platform from the crop, removal of all UI, flat matte soft-vector shading, nearly top-down rounded parallelogram with slight clockwise angle, broad pale top, thick dark bottom rim, no bulging padded geometry or realistic gloss. Blue and gray were generated separately as color-only edits preserving this geometry.
