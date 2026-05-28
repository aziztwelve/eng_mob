# Lumi — AI-generated mascot

Маскот онбординга v3 (см. `docs/tasks/mob/onboarding-v3-oki-style.md` §3.2).
4 позы: `idle` / `cheering` / `thumbs_up` / `wink`.

## Текущее состояние

В каталоге лежат **placeholder SVG** — простые геометрические коты
зелёного цвета (#58cc02 / #7ed321) с разными выражениями. Достаточно,
чтобы фронт не блокировался при разработке. **Финальные арты нужно
сгенерировать через Midjourney / DALL-E 3 / SDXL** и положить как PNG.

Подключение к компоненту `<Mascot>` — через `src/lib/mascot-manifest.ts`
(паттерн как у `lottie-manifest.ts`). Если PNG нет — компонент
использует SVG-placeholder.

## Требования к финальным ассетам

- Формат: **PNG** с прозрачным фоном (transparent canvas).
- Размеры: 1x = 200×200, 2x = 400×400, 3x = 600×600 (для retina).
- Файлы:
  - `lumi-idle.png`, `lumi-idle@2x.png`, `lumi-idle@3x.png`
  - `lumi-cheering.png`, `lumi-cheering@2x.png`, `lumi-cheering@3x.png`
  - `lumi-thumbs_up.png`, `lumi-thumbs_up@2x.png`, `lumi-thumbs_up@3x.png`
  - `lumi-wink.png`, `lumi-wink@2x.png`, `lumi-wink@3x.png`
- Стиль: **дружелюбный flat-cartoon** (Notion / Headway / Oki vibe), не
  realistic. Округлые формы, мягкие тени допустимы. **Без текста** на
  изображении.
- Цветовая палитра — наша brand:
  - Primary green `#58cc02` (Duolingo-like, наш бренд).
  - Secondary lime `#7ed321`.
  - Accent pink/blush `#ffb3d9` для носа, ушей, румянца.
  - Black `#1a1a2e` для контуров и глаз.
  - **НЕ оранжевый** (это цвет Oki, мы не копируем).
- Все позы должны быть **узнаваемо одним персонажем** (тот же
  силуэт / уши / форма головы).

## Описание персонажа (для промптов)

**Lumi** — антропоморфный котик-маскот. Лаймово-зелёный шерстяной мех,
большие умные тёмно-фиолетовые глаза с яркими бликами, маленькая
розовая мордочка-сердечко, треугольные уши с розовой подкладкой. Не
строгий, не «приторный»; уверенный, спокойный, любопытный. Похож на
смесь Pusheen и енота-учёного. Без одежды для нейтральных поз, либо
с маленьким значком/шарфом для personality.

## Промпты для AI image generation

Базовый стиль (вставлять в начало каждого промпта):

```
flat vector mascot illustration, friendly cartoon style, soft rounded shapes,
clean lines, lime green fur (#7ed321) with darker green (#58cc02) accents,
pink nose and ear interiors (#ffb3d9), large expressive dark purple eyes,
transparent background, centered composition, no text, no watermark,
high quality vector style, suitable for mobile app onboarding
```

### Pose 1: idle (нейтральная)

```
{base style}, Lumi the cat mascot standing facing forward with a calm
neutral expression, mouth in a small relaxed smile, eyes wide open
looking forward, both paws resting at sides, slight tilt of head to
the right showing curiosity, friendly approachable demeanor
```

Используется в: welcome-экране, шагах onboarding'а с нейтральным
тоном (goal / age / level / daily-commit / language).

### Pose 2: cheering (празднует)

```
{base style}, Lumi the cat mascot with both arms raised up in
celebration, eyes closed in happy crescents (^_^), wide open smile
showing tongue, golden sparkles and stars around the head, slight
upward motion lines suggesting jumping for joy, paws making a
victory gesture
```

Используется в: reaction-screens с позитивной реакцией, после
завершённого placement-test'а, на interstitial-trust.

### Pose 3: thumbs_up (одобрение)

```
{base style}, Lumi the cat mascot facing forward with right paw
raised making a thumbs-up gesture, confident slightly-squinted
eyes, small confident smirk, left paw resting at side, slight
forward lean showing engagement and approval
```

Используется в: reaction-screens с подтверждением выбора,
interstitial-projection ("ты на правильном пути"), confirm-buttons.

### Pose 4: wink (подмигивает)

```
{base style}, Lumi the cat mascot facing forward, right eye open
and bright, left eye closed in a wink (^_- expression), cheeky
asymmetric smirk, small pink blush on cheeks, tiny floating red
heart near right ear, conveying playfulness and trust-building
```

Используется в: interstitial-trust, interstitial-value-prop, paywall
intro screen.

## Опциональные позы (Phase 6+)

- `lumi-thinking` — задумчивая, лапа у подбородка, для loading-states.
- `lumi-sad` — грустная, для streak-broken / wrong-answer (не
  используется в онбординге, но может пригодиться позже).
- `lumi-sleeping` — спит, для quiet-hours / late-night reminder.
- `lumi-coffee` — с чашкой кофе, для morning-reminder.

## Lottie-анимации (опционально)

Если бюджет позволяет — заказать у After Effects-моушн-дизайнера
3-5 секундные loop-анимации поверх финальных PNG:

- `lumi-idle.json` — дыхание + моргание (loop).
- `lumi-cheering.json` — прыжок + sparkle-burst (play once).
- `lumi-wink.json` — wink-loop (play once).

Положить в `assets/lottie/` и зарегистрировать в `lottie-manifest.ts`.
Mascot-компонент сам предпочтёт Lottie если есть, иначе static PNG.

## Workflow обновления

1. Сгенерируй финальные PNG через Midjourney / DALL-E (промпты выше).
2. Экспортируй в 3 размерах (1x / 2x / 3x) — Photoshop / Figma /
   ImageMagick.
3. Положи в этот каталог поверх SVG-placeholders.
4. Раскомментируй соответствующие `require()` в
   `src/lib/mascot-manifest.ts`.
5. Smoke на iOS + Android (особенно retina rendering).

## License & attribution

Если используешь AI-сервис с коммерческой лицензией (Midjourney Pro,
DALL-E 3 через OpenAI API, Adobe Firefly) — финальные арты можно
коммерчески использовать. Записывай ID / seed промптов в этом README
для возможности re-generate при изменениях.

Текущие placeholder SVG — внутренняя разработка, лицензия проекта.
