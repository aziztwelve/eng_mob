# Google и Apple для LingoIQ

Google OAuth-клиенты созданы 18 октября 2026 в проекте `lingoiq`. Web secret записан только в окружение auth-service на сервере; публичные Web/iOS IDs добавлены в локальный `.env` и все EAS build profiles. Auth-service и Metro перезапущены. Google challenge отвечает 200, на физическом Android открылся выбор Google-аккаунта. Реальный Google-вход успешно завершён: social login → 200, /auth/me → 200, токен сохранён на телефоне. В Apple Developer проверена существующая настройка Sign in with Apple для LingoIQ; серверный Apple-провайдер активирован. Другие приложения Darda не изменены.

## Google Cloud

Можно использовать существующий Cloud-проект, но клиентские приложения должны принадлежать LingoIQ.

1. Создать OAuth client типа **Web application** для серверного обмена. Сохранить Client ID и secret; secret только в окружении auth-service на сервере.
2. Создать OAuth client типа **Android**:
   - package: `com.aziztwelve.engmob`
   - SHA-1 текущего установленного development APK: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - Для production добавить отдельный Android client с SHA-1 **Google Play App Signing**. Development SHA-1 не заменяет сертификат Play.
3. Создать OAuth client типа **iOS**, bundle ID `com.aziztwelve.engmob`. Этот ID также настраивает обратную URL-схему через `app.config.js`.
4. Настроить экран согласия Google и тестовые аккаунты, если проект в режиме Testing.

Мобильные/EAS public env (для development, preview, production):

```dotenv
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<LingoIQ Web client ID>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<LingoIQ iOS client ID>
```

Сервер `/var/www/html/elearning/deploy/env/auth.env`:

```dotenv
GOOGLE_SIGN_IN_WEB_CLIENT_ID=<тот же Web client ID>
GOOGLE_SIGN_IN_CLIENT_SECRET=<Web client secret, только сервер>
GOOGLE_SIGN_IN_AUTHORIZED_PARTY_IDS=<Web client ID>,<LingoIQ Android client ID>,<LingoIQ iOS client ID>
```

Не копировать список authorized parties Darda: он разрешает другое приложение. Native Google SDK использует одноразовый serverAuthCode; сервер меняет его на подписанный ID token и выдаёт обычную сессию LingoIQ.

## Apple Developer

1. В Certificates, Identifiers & Profiles открыть App ID `com.aziztwelve.engmob` и включить **Sign in with Apple**.
2. Обновить provisioning profile и собрать iOS-приложение с этим bundle ID. `usesAppleSignIn` и Expo plugin уже включены.
3. В серверном `auth.env` задать:

```dotenv
APPLE_SIGN_IN_CLIENT_IDS=com.aziztwelve.engmob
```

Проверка native identityToken использует публичные JWKS Apple и одноразовый nonce. Darda bundle ID `com.aziztwelve.darda` не подходит. Идентичность сохраняется по подписанному subject, поэтому повторный вход без возвращённого email работает. Привязка к существующему аккаунту по совпадению почты автоматически не выполняется.

Для production Apple-релиза отдельно завершить обработку отзыва Apple-токенов при удалении аккаунта и серверных Apple account notifications. Этот вход не сохраняет Apple refresh token и не заменяет такую обработку.

После изменения окружения перезапустить auth-service по рабочему процессу проекта. Для Google iOS URL scheme / Apple entitlement нужна новая native-сборка; Metro не меняет native-конфигурацию. Сейчас в Android development APK модуль RNGoogleSignin уже присутствует.

## Что проверено

- Android: только Google на входе и регистрации. Нажатие без настройки завершает loading и показывает сообщение; email-вход остаётся доступен.
- iOS: обе кнопки по unit-тесту; физический iPhone и реальный провайдер не проверены.
- Девять mobile-тестов: обмен кодом, отмена без API login, отсутствие конфигурации/SDK, Apple Android guard, nonce/state и отсутствие email при повторном входе, неверный state, видимость кнопок.
- TypeScript и scoped ESLint: passed.
- Backend auth-service: Go tests с race detector; gateway: Go tests; обе сборки: passed.
- SQL-проверка сервера: BEGIN/ROLLBACK, без сохранения тестовых аккаунтов; одноразовость/срок/provider challenge, уникальность identity/email: passed.

Скриншоты и логи: `docs/qa/social-auth/`. Серверная реализация: `microservices-course/elearning/docs/tasks/social-sign-in-2026-10-18.md`.

Официальные инструкции: [Google](https://developers.google.com/identity/sign-in/android/backend-auth), [OAuth client configuration](https://react-native-google-signin.github.io/docs/setting-up/get-config-file), [Apple](https://developer.apple.com/documentation/signinwithapple/verifying-a-user).

## Серверный выпуск

Коммит backend `ae6de7d` развёрнут на сервере; миграция 005 применена. После обновления пересобраны и перезапущены 12 Go-сервисов. Во время деплоя очистка временного каталога остановила скрипт перед запуском; запуск был сразу выполнен отдельно, после чего health и HTTP smoke прошли. Бэкапы прежних бинарников: `/root/backups/lingoiq-social-ae6de7d/`. Провайдеры намеренно не активированы: Google/Apple challenge → 503, неподдерживаемый guest_fake → 400, пустой social login → 400, health → 200. Старые настройки Darda не менялись.

## Созданные Google-клиенты (публичные IDs)

| Назначение | Client ID |
|---|---|
| Web / backend | 1052284386364-d5u68m1hb5ctle3q02rrpgsbmjjbajh9.apps.googleusercontent.com |
| Android development | 1052284386364-tg6vk51k8bd3u7tbbmltja1t5tv8viq8.apps.googleusercontent.com |
| iOS | 1052284386364-i9o22tmcgpmc3cea730hntkdi9pu7em5.apps.googleusercontent.com |

Google Cloud: External / Testing. Тестовый аккаунт владельца проекта aziztwelve@gmail.com сохранён. На телефоне доступны другие аккаунты; их добавление и первый вход требуют выбора пользователя. Production Android client с Play App Signing SHA-1 пока не создан; Google iOS требует следующей native-сборки с новой URL-схемой. Секреты не попали в mobile/EAS/public config; защищённый временный файл Web secret удалён после передачи серверу.

## Исправление перехода после первого реального входа

Google-вход нового аккаунта прошёл успешно (18 октября, 14:22 по Душанбе), но приложение возвращало пользователя на welcome. Это выглядело как потеря сессии. Исправлено: после первого Google-входа открывается выбор цели с сохранённой сессией; последний шаг для авторизованного пользователя показывает «Аккаунт подключён» и сохранение настроек, без повторной регистрации/email/password. Повторный вход существующего аккаунта загружает серверный профиль. Автоматические проверки новых переходов добавлены; 9 mobile-тестов, TypeScript и scoped ESLint прошли. На реальной сессии проверен экран без повторной регистрации. Настройки обучения пользователя не выбирались и не отправлялись автоматически.

## Apple Developer подтверждён и backend активирован

18 октября проверен реальный App ID LingoIQ: bundle `com.aziztwelve.engmob`, App ID `GHCYP359R7`, Team `24DB6F692V`. Sign In with Apple уже был включён как Primary App ID; настройки capability не менялись. На сервере задано `APPLE_SIGN_IN_CLIENT_IDS=com.aziztwelve.engmob`, auth-service перезапущен. Smoke: Apple challenge 200, случайный неподписанный token 401, Google challenge 200. Expo introspection подтверждает entitlement `com.apple.developer.applesignin=[Default]` и Google URL scheme. EAS-доступ работает; последняя найденная iOS STORE-сборка №5 от 17 октября предшествует этим изменениям. Реальный вход на iPhone ещё не проверен.

## Ограничение пользователя: без EAS-сборок и проверок

18 октября пользователь уточнил: сейчас только подключить iOS/Apple; EAS-лимит беречь, сборку и проверки отложить до готовности. Уже отправленная iOS-сборка `2bdc4e65-9560-42b5-b357-b76e2e4cd054` отменена; EAS CLI подтвердил `Build canceled`. Новые EAS-сборки, загрузки в TestFlight и проверки не запускать без новой явной команды пользователя. Настройки Apple Developer уже были включены; серверный Apple audience и конфигурация iOS сохранены.
