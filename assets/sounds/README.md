# UI sounds

Короткие звуки для геймификации. Воспроизводятся через `expo-av` из
`src/lib/fx.ts`.

## Контракт

| Имя файла          | Событие                       | Длительность | Примеры референса |
|--------------------|-------------------------------|--------------|-------------------|
| `correct.mp3`      | Правильный ответ в квизе       | 0.3-0.5 с    | "pop", "ding"     |
| `wrong.mp3`        | Неправильный ответ              | 0.4-0.6 с    | "buzz", "thud"    |
| `xp-gain.mp3`      | Начислили XP за шаг             | 0.2-0.3 с    | мягкий "tap"      |
| `level-up.mp3`     | Перешли на новый уровень        | 0.8-1.2 с    | короткие фанфары  |
| `achievement.mp3`  | Разблокировано достижение       | 0.6-1.0 с    | "chime"           |
| `daily-goal.mp3`   | Закрыта дневная цель            | 0.5-0.8 с    | "chime"           |

## Технические требования

- Формат: **MP3** (CBR 128 kbps).
- Частота: **44.1 кГц**.
- Каналы: **mono** (моно достаточно для UI).
- Размер: **< 100 KB** на файл (важно — бандл).
- Громкость: пикнуть до **-6 dBFS** (fx-движок играет на `volume: 0.85`).
- Не должно быть фейда длиннее 50 мс в начале — пользователь услышит задержку.

## Как подключить

1. Положи файл в этот каталог: `assets/sounds/correct.mp3` и т.д.
2. Открой `src/lib/sound-manifest.ts`.
3. Замени `null` на `require('@/../assets/sounds/<name>.mp3')`. Пример:

   ```ts
   export const SOUND_ASSETS: Record<FxSound, unknown | null> = {
     correct: require('@/../assets/sounds/correct.mp3'),
     wrong: require('@/../assets/sounds/wrong.mp3'),
     'xp-gain': require('@/../assets/sounds/xp-gain.mp3'),
     'level-up': require('@/../assets/sounds/level-up.mp3'),
     achievement: require('@/../assets/sounds/achievement.mp3'),
     'daily-goal': require('@/../assets/sounds/daily-goal.mp3'),
   };
   ```

4. Перезапусти Metro (`expo start --clear`).

## Поведение по умолчанию

- Если ассет не зарегистрирован — fx-движок молча пропускает звук, haptic
  продолжает играть.
- Пользователь может отключить звуки в `Profile → Настройки`. Состояние
  переключателя хранится в AsyncStorage (`@eng:fx-prefs`).
- На iOS включен `playsInSilentModeIOS: true` — звуки слышны даже в режиме
  mute. Если это нежелательно, переключи в `src/lib/fx.ts`.
