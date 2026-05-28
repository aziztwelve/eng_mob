import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * secureStore — thin wrapper над `expo-secure-store` с одинаковым
 * `getItem/setItem/removeItem` API, как у AsyncStorage.
 *
 * Зачем:
 *   - iOS: значения уходят в Keychain (защищены iOS sandbox + biometric
 *     при необходимости).
 *   - Android: EncryptedSharedPreferences через Android Keystore.
 *   - Web / SSR / Expo Go без plugin'а: graceful fallback на AsyncStorage —
 *     SecureStore.isAvailableAsync() возвращает false, и мы не падаем.
 *
 * Использовать ТОЛЬКО для секретов (access/refresh JWT). Для не-секретов
 * (device_id, флаги) — обычный AsyncStorage: дешевле и без 2 KB-лимита
 * iOS Keychain.
 *
 * Ключи должны соответствовать regex `[A-Za-z0-9._-]+` (требование
 * SecureStore на Android).
 */

let availabilityCache: boolean | null = null;

async function isSecureAvailable(): Promise<boolean> {
  if (availabilityCache !== null) return availabilityCache;
  if (Platform.OS === 'web') {
    availabilityCache = false;
    return false;
  }
  try {
    availabilityCache = await SecureStore.isAvailableAsync();
  } catch {
    availabilityCache = false;
  }
  return availabilityCache;
}

export const secureStore = {
  async getItem(key: string): Promise<string | null> {
    if (await isSecureAvailable()) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (await isSecureAvailable()) {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch {
        // fall-through to AsyncStorage
      }
    }
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (await isSecureAvailable()) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // ignore
      }
    }
    // На случай legacy-данных в AsyncStorage чистим и там тоже.
    await AsyncStorage.removeItem(key);
  },
};
