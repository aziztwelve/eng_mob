# Onboarding Interstitial Illustrations

Доп. иллюстрации для interstitial-экранов онбординга v3 (см.
`docs/tasks/mob/onboarding-v3-oki-style.md` §3.7).

**Статус:** опциональные — по спеке (§Sprint 0) emoji-fallback OK для
MVP. Если будут финальные арты — положить сюда и обновить
`onboarding-illustrations-manifest.ts` (создаётся в Sprint 4).

## Список нужных иллюстраций

### 1. `trust-skills.png` — interstitial-trust

**Экран:** "У тебя уже больше навыков, чем ты думаешь."
**Содержание:** Lumi с открытой ладонью / распахнутыми руками,
вокруг — иконки навыков (книга / микрофон / лампочка / сердце).
**Emoji fallback:** 💪✨

**Prompt:**
```
flat vector illustration, Lumi the lime-green cat mascot standing
with arms open wide in a welcoming gesture, surrounded by floating
icons of skills: book, microphone, light bulb, heart, dialog bubble,
star, all in soft pastel colors with green accents, transparent
background, mobile app onboarding style, centered composition
```

### 2. `value-prop-tutor.png` — interstitial-value-prop

**Экран:** "В 50 раз доступнее, чем репетитор."
**Содержание:** Слева — иконка дорогого репетитора (формальный),
справа — Lumi с приветливым выражением. Между ними — тильда / стрелка
сравнения / монеты.
**Emoji fallback:** 💰 vs 🐱

**Prompt:**
```
split-screen flat vector illustration: left side shows a stiff
formal-looking human teacher avatar with a money stack (representing
expensive tutoring), right side shows the lime-green Lumi cat mascot
with a friendly smile and one coin (representing affordable
alternative), arrow between them, soft colors with green and gold
accents, transparent background, no text
```

### 3. `roadmap-milestones.png` — interstitial-roadmap

**Экран:** "Твой путь — 5 этапов."
**Содержание:** Вертикальный путь / дорога с 5 узлами, в каждом узле
mini-Lumi в разной позе (от стартующего до конфидентного speaker'а).
**Emoji fallback:** 🛤️ 🎯

**Prompt:**
```
vertical timeline illustration showing 5 milestone nodes connected
by a flowing curved path, each node has a small lime-green Lumi cat
in a different stage: 1) waving hello, 2) holding a book, 3) speaking
with a dialog bubble, 4) wearing a tiny graduation cap, 5) confidently
gesturing forward, soft pastel background with subtle dots, transparent
background, flat vector style, mobile app onboarding
```

### 4. `social-proof-crowd.png` — interstitial-building / social-proof badge

**Экран:** "400 000+ человек учатся вместе с тобой."
**Содержание:** Толпа маленьких разных Lumi-маскотов (с разными
аксессуарами — шарфы, очки, кепки — намекая на разнообразие).
**Emoji fallback:** 👥

**Prompt:**
```
flat vector illustration of a crowd of diverse mini Lumi cat mascots
all in lime-green but with different small accessories: glasses,
scarves, caps, headphones, books, microphones; arranged in a friendly
gathered group, slight 3D depth, conveying community and scale,
transparent background, no text, mobile app onboarding style
```

### 5. `paywall-hero.png` — paywall шапка (опционально)

**Экран:** "Начни путешествие со всеми возможностями."
**Содержание:** Lumi с золотой короной / звёздочкой, на фоне иконок
премиум-фич (∞ hearts, AI tutor, unlimited lessons).
**Emoji fallback:** 👑

**Prompt:**
```
flat vector illustration, Lumi the lime-green cat mascot wearing a
small gold crown, surrounded by floating premium icons: infinity
hearts, AI brain, unlimited lesson scrolls, golden stars, soft
gradient background hint, transparent background, no text, conveying
premium-but-friendly feel
```

## Формат и размеры

- Все — **PNG, transparent**.
- Размеры: 1x = 600×400 (landscape) или 400×400 (portrait), 2x / 3x для retina.
- **Без текста** внутри изображения (текст — отдельным React-слоем
  поверх, для i18n).
- Стиль консистентен с Lumi mascot (см. `assets/mascot/README.md`).

## MVP path

Для MVP можно обойтись emoji + Lumi mascot в позах: эти иллюстрации
улучшают UX, но не блокируют запуск. Очередь приоритетов, если
бюджет на ассеты ограничен:

1. **Lumi 4 позы** (must-have, blocking).
2. `roadmap-milestones.png` (high impact на конверсию paywall).
3. `value-prop-tutor.png` (явное value-comparison перед paywall).
4. `trust-skills.png` (emotional trust-builder).
5. `social-proof-crowd.png` (можно заменить avatar-кучкой из stock).
6. `paywall-hero.png` (nice-to-have).
