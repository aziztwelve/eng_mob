# Mobile app (eng_mob)

Expo SDK 55 + expo-router + NativeWind + Reanimated v4 + TanStack Query.
Бэкенд — `microservices-course/elearning` (см. AGENTS.md там).

## Команды

```bash
npm start              # expo start (Metro)
npm run ios            # expo run:ios
npm run android        # expo run:android
npm run web            # expo start --web
npm run lint           # expo lint
npx tsc --noEmit       # Полный typecheck (CI gate)

# Установка нативных зависимостей через expo install — он подбирает
# совместимую с SDK 55 версию:
npx expo install <pkg>
```

## Структура

```
src/
├── app/                       expo-router file-based routing
│   ├── (tabs)/                нижние табы (index/courses/tracks/profile)
│   ├── auth/                  login/register
│   ├── learn/[lessonId].tsx   плеер уроков (FX оверлеи здесь)
│   └── profile/               sub-stack (stats/streak/achievements/settings)
├── components/
│   ├── gamification/          XPBar, StreakBadge, LevelUpOverlay, ...
│   ├── lesson/                video/text/quiz steps
│   └── ui/                    common atoms
├── hooks/                     use-* (use-gamification-fx, use-user-stats, ...)
├── lib/
│   ├── api-client.ts          GamificationApi, AuthApi, ...
│   ├── fx.ts                  haptics + sounds engine
│   ├── fx-prefs.ts            AsyncStorage prefs (haptics/sounds toggle)
│   ├── sound-manifest.ts      реестр sound-ассетов (null-стубы)
│   └── lottie-manifest.ts     реестр Lottie JSON (null-стубы)
└── types/api.ts               proto-mirror types (sync с web)
```

## Конвенции

- Стили только через NativeWind (`className=`). Inline `style` —
  только для динамических значений (Reanimated, computed sizes).
- React Query keys экспортируются константами из хуков
  (`USER_STATS_KEY`, `HEARTS_KEY`, ...) для re-use в `useLessonGamificationFx`.
- Toast через `react-native-toast-message`. Большие события (level-up,
  achievement unlock) — full-screen Modal оверлеи, не Toast.
- Иконки — `lucide-react-native`.
- Reanimated v4 (worklets отдельным пакетом `react-native-worklets`).

## Геймификация: пайплайн событий

```
QuizStep.handleSubmit
   └─ fx.onCorrect() / fx.onWrong()      ←  src/lib/fx.ts

LessonScreen.handleStepComplete (POST /progress/steps/:id/complete)
   └─ fireGamificationFx({ xp, silent: true })   ←  use-gamification-fx
        ├─ updates React-Query кэшей (stats, achievements, daily_goal, hearts)
        └─ возвращает { xpGained, leveledUp, newLevel, newAchievements,
                        dailyGoalCompleted }
   на основе результата:
        ├─ XPGainAnimation       (+N XP top-overlay)
        ├─ fx.onXPGain()          (selection haptic + sound)
        ├─ LevelUpOverlay         (full-screen Lottie / fallback)
        ├─ fx.onLevelUp()         (heavy → success haptic + fanfare)
        ├─ AchievementModal       (queue-based)
        ├─ fx.onAchievement()     (success haptic + chime)
        ├─ Toast 'Цель дня'
        └─ fx.onDailyGoal()       (success haptic + chime)
```

## FX-движок

- 6 событий: `onCorrect`, `onWrong`, `onXPGain`, `onLevelUp`,
  `onAchievement`, `onDailyGoal` + `tap()`.
- Haptics всегда работают (expo-haptics).
- Sounds работают, **только если** ассет зарегистрирован в
  `sound-manifest.ts` (Metro требует литеральный `require()`).
  Иначе — тихо пропускаем (haptic всё равно играет).
- Юзер может выключить любой канал в `Profile → Настройки`.

## Lottie

- `LevelUpOverlay` использует Lottie если `LOTTIE_ASSETS['level-up']`
  зарегистрирован, иначе Reanimated-фолбэк с эмодзи-орбитой.
- Чтобы подключить — положить .json в `assets/lottie/level-up.json` и
  раскомментировать в `lottie-manifest.ts`.

## Что осталось дизайнеру (1 строка кода каждое)

- 6 MP3 → `assets/sounds/` + `sound-manifest.ts`. Требования в
  `assets/sounds/README.md`.
- 1-2 Lottie JSON → `assets/lottie/` + `lottie-manifest.ts`. Требования
  в `assets/lottie/README.md`.

## Verification

```bash
npx tsc --noEmit           # Должен быть clean
npm run lint               # expo-lint
```

## Известные нюансы

- Reanimated v4 типы строгие — для `useAnimatedStyle` в массиве `style=[...]`
  кастуй в `as object` если получаешь mismatch с TextStyle/ViewStyle (см.
  `LevelUpOverlay.FallbackBurst`).
- `lottie-react-native` source ждёт `AnimationObject`, но `require()` в RN
  возвращает `number` — кастуй через `as never` (см. LevelUpOverlay).
- `expo-av` Audio.Sound: на iOS нужен `Audio.setAudioModeAsync({
  playsInSilentModeIOS: true })` чтобы UI-звуки слышны были и в mute.
  Делается лениво в `fx.ts:ensureAudioMode`.

## Документация изменений

Бэкенд-логи: `microservices-course/elearning/docs/tasks/PHASE_1_PROGRESS.md`.
Здесь — этот файл и READMEs внутри `assets/sounds/` и `assets/lottie/`.
