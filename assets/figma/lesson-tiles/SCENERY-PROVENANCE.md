# Tile lesson map scenery

`scenery.webp` is an opaque 780×1170 decorative backdrop for the selected variant 9, “Дорожка из плиток”. Interactive lesson tiles, labels, progress, icons and connectors must be rendered as native UI above this image. The image contains only sky, clouds, edge pine islands and a distant mountain; the wide central area stays clear.

Generated with the built-in image generation tool on 2026-10-17, using panel 9 of the user-selected comparison board as a style reference. The reference is `/home/aziz/.codex/generated_images/01a142e5-e3da-70d0-8ebe-c9f6c4f25182/exec-05945e13-4ded-4933-9f0d-70116ee3e820.png`.

Retained generation source: `/home/aziz/.codex/generated_images/01a14742-2e1c-78a0-8a75-754ef26b8f31/exec-e7ea764e-962e-4038-a0a1-89640541266d.png` (1024×1536). Proportionally resized with Pillow/Lanczos and encoded as WebP quality 88, method 6. No redrawing or compositing was performed.

Prompt intent: tall portrait mobile lesson-map background, bright pale sky blue, fluffy white edge clouds, small green conifer islands along the outer edges and bottom corners, a distant mountain on the right edge. Soft vector-storybook 3D shading matching selected panel 9. Reserve the broad central 75% for three native tile buttons. No UI, paths, tiles, numbers, text, lesson nodes, mascots, characters, flags or icons.

Prepared by asset-only agent `lesson_tile_scenery`. The optimized image was visually inspected; source artwork remains outside the Metro asset graph.

## Revision: match selected panel 9 more closely

The shipped `scenery.webp` was replaced on 2026-10-17 with a 780×1560 (1:2) opaque backdrop, 37,186 bytes. The earlier version left too much empty sky and used floating rocky islands. This revision follows the exact zoomed crop `docs/qa/lesson-tiles/selected-9.png`: flatter triangular green pine clusters and bright grassy foliage alternating at both side edges, with denser fluffy white cloud clusters framing the lesson tiles. Header top quarter remains mostly sky; the broad middle stays available for native UI. No actual lesson tiles, bear, connectors, text, buttons or progress are baked into the scenery.

Revised generation source: `/home/aziz/.codex/generated_images/01a14742-2e1c-78a0-8a75-754ef26b8f31/exec-7fdfe3e5-e2b8-4882-b588-f7f757a2b3f2.png`. Proportionally resized using Pillow/Lanczos and encoded as WebP quality 88, method 6. No redrawing/compositing; original generation retained.

## Hiking mascot

`bear-hiker.png` is a standalone transparent orange bear with a blue hiking backpack, waving one paw. It follows the mascot on the second tile in the selected reference, replacing the unrelated career briefcase mascot. Generated with the built-in image tool using `docs/qa/lesson-tiles/selected-9.png` as the precise visual reference; no UI, scenery, tile or text is included.

Source: `/home/aziz/.codex/generated_images/01a14742-2e1c-78a0-8a75-754ef26b8f31/exec-570734c4-5565-42e4-8040-003b636b075d.png`. Preserved genuine alpha and proportionally resized to fit 240×320 with Pillow/Lanczos, PNG optimized. No redrawing or compositing. Full body, backpack and waving paw are visible with transparent margins.
