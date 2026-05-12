# 📱 Как запустить LingoLearn Mobile

## ✅ Приложение готово к использованию!

Вам **НЕ НУЖЕН** Android SDK для тестирования. Есть 2 простых способа:

---

## 🌐 Способ 1: Веб-версия (РЕКОМЕНДУЕТСЯ)

### Самый быстрый способ протестировать приложение!

1. **Откройте браузер**
2. **Перейдите на**: http://localhost:8083
3. **Готово!** Приложение работает в браузере

### Или в терминале с Expo:
```
Нажмите: w
```

### Что работает в веб-версии:
- ✅ Все экраны (Login, Register, Courses, Lesson Player, Profile)
- ✅ Все стили (NativeWind)
- ✅ Все функции (auth, courses, lessons, quiz)
- ✅ API интеграция
- ✅ Навигация

---

## 📱 Способ 2: Физическое устройство (Expo Go)

### Протестируйте на реальном телефоне без эмулятора!

### Шаг 1: Установите Expo Go

**Android:**
- Откройте Google Play Store
- Найдите "Expo Go"
- Установите: https://play.google.com/store/apps/details?id=host.exp.exponent

**iOS:**
- Откройте App Store
- Найдите "Expo Go"
- Установите: https://apps.apple.com/app/expo-go/id982107779

### Шаг 2: Подключитесь

1. **Убедитесь**, что телефон и компьютер в одной WiFi сети
2. **Откройте Expo Go** на телефоне
3. **Отсканируйте QR код** из терминала Expo
4. **Готово!** Приложение откроется на телефоне

### Если QR код не работает:

В терминале Expo найдите строку:
```
› Metro: exp://192.168.1.107:8083
```

В Expo Go:
1. Нажмите "Enter URL manually"
2. Введите: `exp://192.168.1.107:8083`
3. Нажмите "Connect"

---

## 🖥️ Способ 3: Android SDK (Опционально)

### Если хотите использовать Android эмулятор:

### Вариант A: Android Studio (Проще)

1. **Скачайте Android Studio**:
   https://developer.android.com/studio

2. **Установите Android Studio**

3. **Откройте Android Studio** → Tools → AVD Manager

4. **Создайте виртуальное устройство**

5. **Добавьте в ~/.bashrc**:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

6. **Перезагрузите терминал**:
   ```bash
   source ~/.bashrc
   ```

7. **Запустите эмулятор** из Android Studio

8. **В терминале Expo нажмите**: `a`

### Вариант B: Command Line Tools (Сложнее)

Загрузка занимает много времени из-за медленного соединения.
Рекомендуем использовать веб-версию или Expo Go.

---

## 🚀 Текущий статус

```
✅ Expo Dev Server:  http://localhost:8083
✅ Metro Bundler:    Запущен
✅ Веб-версия:       Работает
✅ Expo Go:          Готов к подключению
✅ Приложение:       Полностью функционально
```

---

## 🧪 Что тестировать

### Базовый флоу:

1. **Landing Page** → Нажмите "Sign Up"
2. **Register** → Создайте аккаунт
   - Username: test123
   - Email: test@example.com
   - Password: password123
3. **Courses** → Просмотрите курсы, используйте поиск
4. **Course Detail** → Нажмите на курс → "Enroll Now"
5. **Lesson Player** → Откройте урок, пройдите шаги:
   - Video: посмотрите видео
   - Text: прочитайте текст
   - Quiz: ответьте на вопросы
6. **Profile** → Проверьте профиль → "Logout"

---

## 📚 Документация

Все документы в `/home/aziz/Documents/startup/eng/eng_mob/`:

- **FINAL_SUMMARY.md** - Финальный отчет
- **MIGRATION_COMPLETE.md** - Полная документация
- **QUICKSTART.md** - Быстрый старт
- **ERRORS_FIXED.md** - Исправленные ошибки
- **STYLES_FIXED.md** - Исправление стилей
- **HOW_TO_RUN.md** - Этот файл

---

## ⚠️ Важно

### Backend API должен быть запущен!

Убедитесь, что ваш backend работает на порту 8081:
```bash
curl http://localhost:8081/api/v1/courses
```

Если backend не запущен, приложение не сможет загрузить данные.

---

## 🎉 Готово!

**Рекомендуем начать с веб-версии**: http://localhost:8083

Это самый быстрый способ протестировать все функции приложения!

---

**Дата**: 15 апреля 2026, 22:20
**Статус**: ✅ Готово к использованию
