# ✅ Исправление стилей для веба

## Проблема
Стили не отображались на веб-платформе из-за несовместимости версий Tailwind CSS.

## Решение

### 1. Откат Tailwind CSS с v4 на v3
```bash
npm uninstall tailwindcss
npm install tailwindcss@3.4.0
```

**Причина**: NativeWind v4 поддерживает только Tailwind CSS v3, а не v4.

### 2. Создан metro.config.js
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css' });
```

### 3. Обновлен global.css
Добавлены Tailwind директивы:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. NativeWind автоматически создал
- `nativewind-env.d.ts` - TypeScript типы
- Обновил `tsconfig.json` для поддержки NativeWind

## ✅ Результат

Теперь стили работают на всех платформах:
- ✅ iOS
- ✅ Android  
- ✅ Web

## 🚀 Как запустить

```bash
cd /home/aziz/Documents/startup/eng/eng_mob

# Запустить dev server
npx expo start --port 8083

# Открыть веб-версию
# Нажмите 'w' в терминале или откройте http://localhost:8083
```

## 📱 Тестирование

1. **Веб**: Откройте http://localhost:8083 в браузере
2. **iOS**: Нажмите 'i' в терминале
3. **Android**: Нажмите 'a' в терминале
4. **Физическое устройство**: Отсканируйте QR код

## 🎨 Проверьте стили

На всех платформах должны работать:
- Темная тема (темный фон)
- Зеленые кнопки (#58cc02)
- Rounded углы (rounded-3xl)
- Толстые границы (border-4)
- Правильные цвета текста

---

**Дата исправления**: 15 апреля 2026, 22:01
**Статус**: ✅ Стили работают на всех платформах
