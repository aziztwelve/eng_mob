# Lottie animations

Lottie JSON-анимации для full-screen celebration оверлеев в геймификации.
Рендерятся через `lottie-react-native` из `src/components/gamification/`.

## Контракт

| Имя файла          | Событие                       | Длительность | Canvas / резолюция | Особенности |
|--------------------|-------------------------------|--------------|-------------------|-------------|
| `level-up.json`    | Переход на новый уровень       | 1.5-2.5 с    | 1:1, 280×280, transparent | Конфетти / фанфары / звезда |
| `achievement.json` | Разблокировано достижение      | 1.2-2.0 с    | 1:1, 280×280, transparent | Трофей / медаль burst       |

## Технические требования

- Формат: **Lottie JSON** (экспорт из After Effects через Bodymovin или
  напрямую с lottiefiles.com).
- **Прозрачный фон** — оверлей сам подкладывает дим.
- **Один цикл** (без loop) — компонент сам запускает заново при
  следующем событии.
- Без вложенных PNG/JPG (только векторы и shape layers) — это критично:
  raster-слои не работают в `lottie-react-native` без extra-конфига.
- Размер < 50 KB после минификации (https://lottiefiles.com/tools/json-editor).
- Кадровая частота: 30 или 60 fps; работает любая, но 30 — меньший вес.

## Как подключить

1. Сохрани `<name>.json` в этот каталог: `assets/lottie/level-up.json`.
2. Открой `src/lib/lottie-manifest.ts`.
3. Замени `null` на `require('@/../assets/lottie/<name>.json')`:

   ```ts
   export const LOTTIE_ASSETS: Record<LottieAnimation, unknown | null> = {
     'level-up': require('@/../assets/lottie/level-up.json'),
     achievement: require('@/../assets/lottie/achievement.json'),
   };
   ```

4. Перезапусти Metro (`expo start --clear`).

## Поведение по умолчанию

- Если ассета нет — `LevelUpOverlay` показывает **Reanimated-фолбэк**:
  орбитальная карусель из эмодзи (✨🎉🌟🎊) + центральная ⭐.
  Это полноценная анимация, не «пусто», но менее впечатляющая чем Lottie.
- Lottie-анимация перекрывает фолбэк, когда `LOTTIE_ASSETS[event]` не null.
- Авто-закрытие через **3.2 с** или по тапу. Это значение в
  `LevelUpOverlay.tsx` (`AUTO_DISMISS_MS`) — если Lottie длиннее, обнови
  константу.

## Где смотреть free-ассеты

- https://lottiefiles.com/featured  (фильтр "Free" + "Celebration")
- https://app.lottiefiles.com/animation/* — превью прямо в браузере.

Хорошие референсы для level-up: "confetti", "trophy", "stars burst",
"reach top". Для achievement: "badge", "medal", "shield".
