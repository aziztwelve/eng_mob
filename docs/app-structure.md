# LingoIQ — структура мобильного приложения

Источник: код eng_mob, проверка от 2026-11-05. Список заменяет устаревшее описание от октября.

В `src/app` осталось 49 файлов маршрутов без `_layout`. Это включает стартовые и совместимые перенаправления, а не только самостоятельные экраны. Два `/` намеренно различаются группой `(tabs)`: корневой маршрут выбирает вход/онбординг, главный экран находится внутри вкладок.

## Нижнее меню

| Пункт | Что открывает |
|---|---|
| Главная | Выбранный вариант 10, прямой Free Talk, темы, быстрые ссылки на учебные разделы |
| Практика | Треки / банк слов / мои слова / курсы «Скоро» |
| AI | Темы A1–C2, Free Talk, отдельная кнопка истории |
| Social | «Скоро», переход нижнего меню выключен; друзья доступны из профиля |
| Профиль | Данные аккаунта, статистика, достижения, ошибки, настройки и дополнительные разделы |

Истории AI на главной нет. Нажатие Free Talk создаёт разговор и запускает серверную сессию; просмотр истории сам по себе её не запускает.

## Все маршруты

| Маршрут | Назначение | Исходник |
|---|---|---|
| `/ai/chat/[id]` | Диалог из истории: ролевые и другие сохранённые разговоры | `src/app/(tabs)/ai/chat/[id].tsx` |
| `/ai/chat` | Прокручиваемая история AI | `src/app/(tabs)/ai/chat/index.tsx` |
| `/ai` | Темы по уровням, Free Talk, вход в историю | `src/app/(tabs)/ai/index.tsx` |
| `/` | Главная / стартовый переход по состоянию входа | `src/app/(tabs)/index.tsx` |
| `/practice` | Треки, банк слов, мои слова, курсы «Скоро» | `src/app/(tabs)/practice/index.tsx` |
| `/practice/mistakes` | Разбор ошибок | `src/app/(tabs)/practice/mistakes.tsx` |
| `/practice/session` | Повторение SRS | `src/app/(tabs)/practice/session.tsx` |
| `/practice/srs` | Выбор повторения | `src/app/(tabs)/practice/srs.tsx` |
| `/practice/vocabulary/[externalId]/learn` | Плеер занятий со словом | `src/app/(tabs)/practice/vocabulary/[externalId]/learn.tsx` |
| `/practice/vocabulary/[externalId]` | Карточка слова | `src/app/(tabs)/practice/vocabulary/[externalId].tsx` |
| `/practice/vocabulary/all` | Полный банк слов | `src/app/(tabs)/practice/vocabulary/all.tsx` |
| `/profile` | Профиль | `src/app/(tabs)/profile.tsx` |
| `/social` | Социальный раздел; пункт нижнего меню «Скоро» | `src/app/(tabs)/social/index.tsx` |
| `/tracks/[id]/dictionary` | Словарь трека | `src/app/(tabs)/tracks/[id]/dictionary.tsx` |
| `/tracks/[id]` | Уроки выбранного трека | `src/app/(tabs)/tracks/[id].tsx` |
| `/tracks` | Каталог треков | `src/app/(tabs)/tracks/index.tsx` |
| `/auth/login` | Вход | `src/app/auth/login.tsx` |
| `/auth/register` | Совместимость: перенаправление на /onboarding/signup | `src/app/auth/register.tsx` |
| `/flashcards` | Библиотека флеш-карточек | `src/app/flashcards/index.tsx` |
| `/flashcards/results` | Результат повторения | `src/app/flashcards/results.tsx` |
| `/flashcards/session` | Сессия флеш-карточек | `src/app/flashcards/session.tsx` |
| `/free-talk/[id]` | Свободный разговор или практика темы с аватаром | `src/app/free-talk/[id].tsx` |
| `/friends` | Друзья из профиля | `src/app/friends/index.tsx` |
| `/friends/leaderboard` | Рейтинг друзей | `src/app/friends/leaderboard.tsx` |
| `/friends/pending` | Входящие и исходящие заявки | `src/app/friends/pending.tsx` |
| `/friends/search` | Поиск друзей | `src/app/friends/search.tsx` |
| `/` | Главная / стартовый переход по состоянию входа | `src/app/index.tsx` |
| `/leagues/history` | История лиг | `src/app/leagues/history.tsx` |
| `/leagues` | Лиги | `src/app/leagues/index.tsx` |
| `/learn/[lessonId]` | Плеер урока | `src/app/learn/[lessonId].tsx` |
| `/onboarding/[...retired]` | Совместимость: старые шаги перенаправляются на текущие | `src/app/onboarding/[...retired].tsx` |
| `/onboarding/add-language` | Выбор языка | `src/app/onboarding/add-language.tsx` |
| `/onboarding/age` | Возраст | `src/app/onboarding/age.tsx` |
| `/onboarding/goal` | Цель | `src/app/onboarding/goal.tsx` |
| `/onboarding/level` | Уровень | `src/app/onboarding/level.tsx` |
| `/onboarding/reminder-time` | Время напоминаний | `src/app/onboarding/reminder-time.tsx` |
| `/onboarding/signup` | Текущая регистрация / сохранение выбора пользователя | `src/app/onboarding/signup.tsx` |
| `/onboarding/welcome` | Приветствие | `src/app/onboarding/welcome.tsx` |
| `/profile/achievements` | Достижения | `src/app/profile/achievements.tsx` |
| `/profile/delete-account` | Удаление аккаунта: экран подтверждения | `src/app/profile/delete-account.tsx` |
| `/profile/edit` | Редактирование профиля | `src/app/profile/edit.tsx` |
| `/profile/help` | Помощь и контакты | `src/app/profile/help.tsx` |
| `/profile/lockscreen-words` | Слова на экране блокировки | `src/app/profile/lockscreen-words.tsx` |
| `/profile/notifications` | Настройки уведомлений | `src/app/profile/notifications.tsx` |
| `/profile/settings` | Настройки, язык, звук, выход | `src/app/profile/settings.tsx` |
| `/profile/stats` | Статистика и история XP | `src/app/profile/stats.tsx` |
| `/profile/streak` | Серия занятий | `src/app/profile/streak.tsx` |
| `/profile/strength` | Сила навыков | `src/app/profile/strength.tsx` |
| `/profile/subscription` | Экран Premium $15.99/месяц; покупка пока недоступна | `src/app/profile/subscription.tsx` |

## Что исключено

- Старые home-candy, home-neon, home-ruya, home-ruya-pro, index-old, index-backup, Explore и галерея Figma.
- Четыре старые страницы AI: roleplay, tutor, writing, pronunciation. История сохраняет возможность открыть ранее созданные разговоры.
- Отдельный старый каталог курсов и карточка курса. В Практике осталась согласованная текущая вкладка «Курсы — скоро». Копия исходников каталога сохранена в `design-explorations/retired-release-2026-11-05/courses-source.tar.gz`, вне маршрутов и архива EAS.
- Старая отдельная форма регистрации заменена перенаправлением; для регистрации используется один текущий экран.

## Проверка перед следующей сборкой

```sh
npm run check:release
```

Команда проверяет TypeScript, ESLint, локальные регрессии и назначения статических ссылок; также запрещает возвращение удалённых маршрутов. Подробности готовности, фактический состав экспорта и ограничения — в `docs/release-audit-2026-11-05.md`.
