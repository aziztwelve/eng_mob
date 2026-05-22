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
│   ├── lesson/                legacy (video/text/quiz) + phase-2
│   │                          (translate/match-pairs/listening/fill-blank/
│   │                          tap-words/quiz-interactive/story) +
│   │                          StepRenderer + FeedbackBar
│   └── ui/                    common atoms
├── hooks/                     use-* (use-step-submit, use-gamification-fx, ...)
├── lib/
│   ├── api-client.ts          GamificationApi, StepValidationApi,
│   │                          VocabularyApi, TTSApi, ...
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

## Phase 2: интерактивные шаги

В `src/app/learn/[lessonId].tsx` flow раздвоен по типу шага:

```
step.type == 'quiz' && content.questions  ── legacy ─→ <QuizStep> (показывает несколько вопросов
                                                       подряд, локальный score)
isInteractiveStep(step.type)              ── phase-2 ─→ <StepRenderer>
                                                       ↓ внутри: TranslateStep / MatchPairsStep /
                                                         ListeningStep / FillBlankStep /
                                                         TapWordsStep / QuizInteractiveStep /
                                                         StoryStep
text/video                                ── legacy ─→ <TextStep> / <VideoStep>
```

Phase-2 компоненты следуют общему контракту (`step-types.ts`):

```ts
interface StepComponentProps {
  step: Step;
  onSubmit: (answer: Record<string, unknown>) => Promise<SubmitAnswerResponse>;
  onContinue: () => void;
  isLast?: boolean;
}
```

`onSubmit` дёргает `useStepSubmit().mutateAsync` →
`POST /api/v1/steps/:id/submit` → step-validation-service. При correct
триггерим тот же `fireGamificationFx` пайплайн что и legacy
completeStep (XPGain / Level-up / Daily-goal / Achievement-modal).

Нижний legacy nav-bar (Previous/Continue) скрывается для phase-2 типов
через флаг `isPhaseTwoInteractive` — у компонентов своя FeedbackBar.

**Phase 2.5 — DnD word bank** (translate / tap_words):
`components/lesson/draggable-word-bank.tsx` — общий DnD-движок.
- Tap по слову банка → append в answer; tap по слову в answer → вернуть в банк.
- Long-drag (>8px) — Pan + Tap race-композиция через `Gesture.Race`.
  Drop hit-test'ит зоны через `measure(useAnimatedRef)` в worklet'е.
  Insert-at-index в answer считается по `onLayout`-картам детей
  (reading order: row Y → centre X).
- Во время drag меняем только SharedValues (translate/scale), не
  React-state — другие слова не re-flow'ятся, drop-position стабильна.
- `<GestureHandlerRootView>` живёт в `app/_layout.tsx` (обязательно для RNGH v2).

**Phase 2.5 — Story markdown** (`components/lesson/story-step.tsx`):
`scene.text` и `scene.translation` рендерятся через `react-native-markdown-display`
с двумя `StyleSheet`-вариантами (`mdMain` 18px / `mdTranslation` 14px). Цвета
из tailwind config (`#ffffff` / `#b3b3b3` / `#58cc02`). Поддерживаются bold,
italic, inline/block code, links (auto-openUrl), heading1-3, lists.

## Phase 3: Practice + SRS + Push (mobile)

Phase 3 mobile (2026-05-16 done) — добавили:

**Routes:**
- `app/(tabs)/practice/index.tsx` — Practice Hub (SRS stats + CTA)
- `app/(tabs)/practice/session.tsx` — practice session, переиспользует
  `<StepRenderer>` (Phase 2). Backend pipeline (`/steps/:id/submit` →
  step-validation) сам пишет SRS-карточки и mistake-resolution.
- `app/(tabs)/practice/mistakes.tsx` — список ошибок (3 таба + pagination)
- `app/profile/strength.tsx` — карта `user_skill_decay` (фильтр по
  module/lesson, sort by strength ASC)
- `app/profile/notifications.tsx` — push subscribe + 5 channel toggles +
  quiet hours + список devices

**API + types:**
- `lib/api-client.ts`: `SrsApi` (8 методов), `NotificationsApi` (8 методов)
- `types/api.ts`: SRS / Mistake / Practice / SkillDecay / DeviceToken /
  UserPreferences / NotificationLog + helpers
  (`itemTypeShort` / `skillTypeShort` / `practiceSourceLabel` /
  `channelToShort` / `platformToShort`)

**Hooks:**
- `hooks/use-srs.ts`: `useSrsStats` / `useSrsDue` / `useSrsWeak` /
  `useSrsReview` / `useGeneratePracticeSession` / `useMistakes` /
  `useSkillStrengths` / `useWeakSkills` (+ exported keys для invalidation)
- `hooks/use-notifications.ts`: `useNotifications` (inbox) /
  `useMarkNotificationRead` / `useMarkAllNotificationsRead` /
  `useNotificationPreferences` / `useUpdateNotificationPreferences` /
  `useNotificationDevices` / `useUnregisterDevice`
- `hooks/use-push-subscription.ts`: state-machine
  (`unknown | unsupported | denied | undetermined | granted_no_token |
  subscribed`) + `subscribe()` / `unsubscribe(id)` / `refresh()`

**Push registration (Expo):**
- `lib/push-registration.ts`:
  - `setupPushHandler()` — глобально один раз в `app/_layout.tsx`
    mount-effect.
  - `registerForPushNotifications()` — full flow: device check →
    permission → Android channel → `getExpoPushTokenAsync({projectId})`
    → POST `/notifications/devices` с `platform='expo'`. Возвращает
    `{deviceId, token, created}` либо null (на симуляторе / без
    permission / без projectId).
  - `getExpoProjectId()` — из `Constants.expoConfig.extra.eas.projectId`
    либо `Constants.easConfig.projectId`. Без EAS / в Expo Go без
    projectId — null.
- Зависимости: `expo-notifications`, `expo-device`, `expo-constants`,
  `expo-localization` (все через `expo install`, SDK 55-совместимые).

**Tabs:**
- 5 вкладок: Home / Tracks / Courses / **Practice (🧠)** / Profile
- Practice — group `(tabs)/practice/*` со stack-layout.

**Что НЕ сделано в Phase 3 mobile (отложено):**
- Notifications inbox UI (отдельный экран для журнала push'ей).
- Deep-linking из push (`addNotificationResponseReceivedListener`).
- Auto-prompt subscribe после login (сейчас юзер должен сам зайти в
  `/profile/notifications`).

## Phase 4 + 4.5: Leagues + Friends (mobile)

Phase 4 mobile (2026-05-16 done) — Sprint 3:

**Routes:**
- `app/leagues/_layout.tsx` + `index.tsx` — Hero (Crown + tier + cycle
  timer + my rank/XP) + Zone hints (promotion/demotion) + Leaderboard
  top-30 (Medal top-3 + is_me highlight + zone-окраска рядов).
- `app/leagues/history.tsx` — список выступлений с pagination
  (PAGE_SIZE=20) + promotion/demotion badges + gems.
- `app/friends/_layout.tsx` + `index.tsx` — главный hub: 3 action-карты
  (Search / Pending / Leaderboard, badge с incoming-count) + accepted
  friends-list с Remove (через `Alert.alert` confirm).
- `app/friends/pending.tsx` — incoming (Accept/Reject) + outgoing
  (Cancel) сессии с group-секциями.
- `app/friends/search.tsx` — debounce 250ms input + per-row Add /
  status badge (accepted / pending / blocked).
- `app/friends/leaderboard.tsx` — друзья + self, Medal top-3, self-row
  highlight.
- Sub-routes структура (вместо inline-tabs) для native-feel UX.

**API + types:**
- `lib/api-client.ts`: `SocialApi` (4 метода: listLeagues / getMyLeague /
  getMyLeaderboard / getHistory) + `FriendsApi` (8 методов: list /
  listPending / sendRequest / accept / reject / remove / search /
  leaderboard).
- `types/api.ts`: League / UserLeague / LeaderboardEntry /
  LeagueHistoryEntry + 4 response shapes (Phase 4); FriendInfo /
  Friendship / FriendshipStatusProto+Short + `friendshipStatusToShort` /
  LeaderboardFriendEntry / PendingDirection + 8 response shapes
  (Phase 4.5).

**Hooks:**
- `hooks/use-leagues.ts`: `useLeaguesCatalog` / `useMyLeague` /
  `useMyLeaderboard` / `useLeagueHistory` (+ exported keys для
  invalidation).
- `hooks/use-friends.ts`: 4 query (`useFriends` / `usePendingFriends` /
  `useFriendsSearch` / `useFriendsLeaderboard`) + 4 mutation
  (`useSendFriendRequest` / `useAcceptFriendRequest` /
  `useRejectFriendRequest` / `useRemoveFriend`). Все mutation-success
  делают `invalidateQueries({ queryKey: ['friends'] })` сразу для всех
  friends-кэшей.

**Shared atoms:**
- `components/ui/avatar.tsx` — небольшой Avatar-компонент: круг с
  `<Image>` из `avatar_url` либо инициалы на цветном фоне.
  Используется в leagues / friends.

**Profile entry:**
- В `(tabs)/profile.tsx` добавлены NavRow «🏆 Лиги» → `/leagues` и
  «👥 Друзья» → `/friends` (рядом с «💪 Сила навыков»).
- 5 нижних табов не трогали — точки входа только через Profile.

**Что НЕ сделано в Phase 4 mobile (отложено):**
- Push deep-linking из канала `friend_request`
  (`addNotificationResponseReceivedListener`).
- Lottie promotion celebration (как level-up — требует ассет).
- Banner / mini-card на Home tab для текущей лиги.

## Phase 5: AI Integration (mobile)

Phase 5 mobile (2026-05-16 done) — Sprint 4: 5 AI-фич + quota.

**Routes (`app/ai/*`):**
- `_layout.tsx` — Stack.
- `index.tsx` — Hub: 5 фич + `<QuotaWidget>` сверху.
- `chat/index.tsx` — список конверсаций + «Новый чат» (`scenario=free_chat`,
  выбор языка). Per-row Delete с `Alert.alert`.
- `chat/[id].tsx` — экран одного диалога. ScrollView + auto-scroll-to-end.
  `<KeyboardAvoidingView>` (iOS padding) для нормального поведения
  keyboard. AI-печатает индикатор + error banner.
- `roleplay.tsx` — каталог сценариев + filter pills (язык / уровень).
  Клик по карточке → `start({scenario: 'roleplay_<id>', target_language,
  user_level, title})` → router push в `/ai/chat/<id>`.
- `writing.tsx` — форма (lang + level pills, optional prompt, multiline
  text + word counter, MIN_WORDS=10) → `<AssessmentResult>`.
- `tutor.tsx` — single Q&A с pills для target/native lang. Markdown в
  ответе (react-native-markdown-display).
- `pronunciation.tsx` — target text input + lang pills + `<VoiceRecorder>`
  → результат с overall progress + word-level badges.

**Components (`components/ai/*`):**
- `quota-widget.tsx` — full-card (на hub) и compact pill-набор (для
  chat / writing / tutor / pron). Также экспортирует `hasQuotaLeft(q,
  kind)` helper.
- `chat-message.tsx` — bubble user (right) / assistant (left) +
  Markdown body + corrections (orig→corrected + explanation) +
  translation toggle + `<MessageAudio>` (expo-av Audio.Sound
  play/pause).
- `chat-input.tsx` — multiline TextInput + want_audio toggle +
  Send-button (disabled при пустой строке / loading).
- `scenario-card.tsx` — карточка roleplay-сценария (title + description
  + level badge + AI-роль + vocabulary_focus pills + Start CTA).
- `assessment-result.tsx` — overall + 4 score-bars + corrected_text +
  feedback rows с category-окраской.
- `voice-recorder.tsx` — expo-av Audio.Recording state machine:
  `idle | recording | recorded | denied`. `Audio.requestPermissionsAsync`
  + `setAudioModeAsync({allowsRecordingIOS: true, playsInSilentModeIOS:
  true})`. После stop восстанавливаем mode для playback. Возвращает
  `{ uri, type, name }` для multipart upload (RN-FormData ждёт file-
  объект, не Blob). MAX_DURATION_SEC=60, авто-stop по timer.

**API + types:**
- `lib/ai-api.ts`: `AIApi` (9 методов: startConversation, list,
  get, delete, sendMessage, listScenarios, explainMistake,
  assessWriting, askTutor, checkPronunciation (multipart), getQuota).
  Pronunciation идёт мимо `ApiClient` — отдельный `fetch` с подстановкой
  Bearer-токена через `AuthService.getAccessToken()` (FormData ставит
  multipart-boundary автоматически, явный Content-Type не задаём).
- `types/api.ts`: AIMessage / AICorrection / AIConversation /
  AIScenario / 6 RPC-shapes / AssessWritingResponse + AIWritingFeedback
  / CheckPronunciationResponse + AIWordScore / AskTutor* /
  ExplainMistake* / AIQuotaStatus.

**Hooks:**
- `hooks/use-ai.ts`: 4 query (`useAIQuota` / `useAIConversations` /
  `useAIConversation` / `useAIScenarios`) + 6 mutation
  (`useStartConversation` / `useSendMessage(id)` / `useDeleteConversation`
  / `useExplainMistake` / `useAssessWriting` / `useAskTutor` /
  `useCheckPronunciation`). Mutation-success инвалидирует пересекающиеся
  ключи: list / specific conversation / quota.

**Profile entry:**
- `(tabs)/profile.tsx` — NavRow «🤖 AI помощник» → `/ai`. Рядом с Лиги
  и Друзья. 5 нижних табов не трогаем.

**Что НЕ сделано в Phase 5 mobile (отложено):**
- Mistake explain UI: hook готов (`useExplainMistake`), но интегрировать
  в `mistakes.tsx` / lesson-fail flow — отдельная итерация.
- Pronunciation step type — сделать `pronunciation`-шаг в lesson player
  с auto-target-text (post-MVP).
- Воспроизведение `audio_url` через downloadable URI (сейчас MockProvider
  возвращает пустой `audio_url` — кнопка прослушивания просто скрыта).
- Real provider (OpenAI / Anthropic / Whisper) — backend Phase 5.X-real.

## Документация изменений

Бэкенд-логи:
- `microservices-course/elearning/docs/tasks/PHASE_1_PROGRESS.md`
- `microservices-course/elearning/docs/tasks/PHASE_2_PROGRESS.md`
- `microservices-course/elearning/docs/tasks/PHASE_3_PROGRESS.md`
- `microservices-course/elearning/docs/tasks/PHASE_4_PROGRESS.md`
- `microservices-course/elearning/docs/tasks/PHASE_5_PROGRESS.md`

Mobile roadmap:
- `microservices-course/elearning/docs/tasks/MOBILE_PROGRESS.md`

Здесь — этот файл и READMEs внутри `assets/sounds/` и `assets/lottie/`.
