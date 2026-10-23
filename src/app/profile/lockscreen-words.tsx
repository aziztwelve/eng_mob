import { twMerge } from 'tailwind-merge';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BellOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

import { ProfileButton as CtaButton } from '@/components/profile/profile-ui';
import { useOnboardingState } from '@/hooks/use-onboarding';
import {
  INTERVAL_CHOICES,
  type LockscreenConfig,
  type LockscreenInterval,
  type WordPair,
  loadConfig,
  saveConfig,
  reschedule,
  getWordPool,
  sendTestNotification,
  scheduledWordsCount,
} from '@/lib/lockscreen-words';

/**
 * /profile/lockscreen-words — настройки «Слова на экране блокировки».
 * См. docs/tasks/mob/lockscreen-words.md (elearning).
 */
export default function LockscreenWordsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const onboarding = useOnboardingState();

  const [config, setConfig] = useState<LockscreenConfig | null>(null);
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [testWord, setTestWord] = useState<WordPair | null>(null);

  useEffect(() => {
    void (async () => {
      setConfig(await loadConfig());
      const p = await Notifications.getPermissionsAsync();
      setPermission(p.status);
      setQueueCount(await scheduledWordsCount());
    })();
  }, []);

  const refreshQueue = useCallback(async () => {
    setQueueCount(await scheduledWordsCount());
  }, []);

  const persistAndReschedule = useCallback(
    async (next: LockscreenConfig) => {
      setBusy(true);
      try {
        await saveConfig(next);
        await reschedule(onboarding.data?.level ?? null);
        setConfig(next);
        await refreshQueue();
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: t('common.save_failed'),
          text2: err instanceof Error ? err.message : '',
        });
      } finally {
        setBusy(false);
      }
    },
    [onboarding.data?.level, refreshQueue, t],
  );

  const onToggle = async (value: boolean) => {
    if (!config) return;
    if (value && permission !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      setPermission(asked.status);
      if (asked.status !== 'granted') return; // статус-картинка подскажет про настройки
    }
    await persistAndReschedule({ ...config, enabled: value });
    Toast.show({
      type: 'success',
      text1: t(value ? 'lockscreen.enabled_toast' : 'lockscreen.disabled_toast'),
    });
  };

  const onInterval = (intervalMin: LockscreenInterval) => {
    if (!config || busy) return;
    void persistAndReschedule({ ...config, intervalMin });
  };

  const onQuiet = (patch: { quietFrom?: number; quietTo?: number }) => {
    if (!config || busy) return;
    void persistAndReschedule({ ...config, ...patch });
  };

  const onTest = async () => {
    if (!testWord) {
      // Слово для теста берём из пула юзера (flashcards → словарь уровня).
      setBusy(true);
      try {
        const pool = await getWordPool(onboarding.data?.level ?? null);
        setTestWord(pool[0] ?? { word: 'spoon', translation: 'ложка' });
      } finally {
        setBusy(false);
      }
      return;
    }
    try {
      await sendTestNotification(testWord);
      Toast.show({ type: 'success', text1: t('lockscreen.test_sent') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  const openSystemSettings = () => {
    void Linking.openSettings();
  };

  if (!config) {
    return (
      <View className="flex-1 items-center justify-center">
        <Stack.Screen options={{ title: t('lockscreen.title') }} />
        <ActivityIndicator color="#1AB3FF" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: t('lockscreen.title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >

        <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('lockscreen.subtitle')}</Text>

        {/* Permission warning */}
        {permission === 'denied' && (
          <View className="bg-mieo-surface border-[1.5px] rounded-[24px] p-[16px] gap-[4px] border-[rgba(249,115,22,0.5)]">
            <View className="flex-row items-center gap-[8px]">
              <BellOff size={20} color="#FB923C" />
              <Text className="text-mieo-heading font-nunito-black text-[16px] mb-[4px]">{t('lockscreen.permission_blocked')}</Text>
            </View>
            <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('lockscreen.permission_blocked_d')}</Text>
            <CtaButton label={t('lockscreen.open_settings')} onPress={openSystemSettings} block />
          </View>
        )}

        {/* Main toggle */}
        <View className="bg-mieo-surface border-[1.5px] rounded-[24px] p-[16px] gap-[4px] border-mieo-stroke">
          <View className="flex-row items-center justify-between gap-[12px]">
            <View className="flex-1 pr-[12px]">
              <Text className="text-mieo-heading font-nunito-extrabold text-[14px]">{t('lockscreen.enable')}</Text>
              <Text className="text-mieo-body text-[12px] leading-[16px] mt-[3px]">{t('lockscreen.enable_d')}</Text>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={onToggle}
              disabled={busy}
              trackColor={{ false: '#E3E6E8', true: '#59C8FF' }}
              thumbColor="#fff"
            />
          </View>

          {config.enabled && (
            <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium mt-[8px]">
              {queueCount === null
                ? '…'
                : t('lockscreen.queue', { count: queueCount })}
            </Text>
          )}
        </View>

        {/* Interval */}
        <View className={twMerge("bg-mieo-surface border-[1.5px] border-[#C9EDFF]", "rounded-[24px] p-[16px] gap-[4px] border-mieo-stroke", (config.enabled ? undefined : "opacity-[0.55]"))}>
          <Text className="text-mieo-heading font-nunito-black text-[16px] mb-[4px]">{t('lockscreen.interval_title')}</Text>
          <View className="flex-row flex-wrap gap-[8px] mt-[10px]">
            {INTERVAL_CHOICES.map((min) => {
              const active = config.intervalMin === min;
              return (
                <Pressable
                  key={min}
                  onPress={() => onInterval(min)}
                  disabled={!config.enabled || busy}
                  className={twMerge("rounded-[999px] px-[14px] py-[8px] bg-[#F0F9FF] border-[1px] border-mieo-stroke", (active ? "bg-[#59C8FF] border-[#59C8FF]" : undefined))}
                >
                  <Text className={twMerge("text-mieo-body font-nunito-extrabold text-[12px]", (active ? "text-mieo-heading" : undefined))}>
                    {t('lockscreen.every_min', { count: min })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Quiet hours */}
        <View className={twMerge("bg-mieo-surface border-[1.5px] border-[#C9EDFF]", "rounded-[24px] p-[16px] gap-[4px] border-mieo-stroke", (config.enabled ? undefined : "opacity-[0.55]"))}>
          <Text className="text-mieo-heading font-nunito-black text-[16px] mb-[4px]">{t('lockscreen.quiet_title')}</Text>
          <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('lockscreen.quiet_d')}</Text>
          <View className="flex-row gap-[12px] mt-[12px]">
            <HourStepper
              label={t('notif.from')}
              value={config.quietFrom}
              onChange={(v) => onQuiet({ quietFrom: v })}
              disabled={!config.enabled || busy}
            />
            <HourStepper
              label={t('notif.to')}
              value={config.quietTo}
              onChange={(v) => onQuiet({ quietTo: v })}
              disabled={!config.enabled || busy}
            />
          </View>
        </View>

        {/* Test + выключение вручную */}
        {config.enabled && (
          <View className="bg-mieo-surface border-[1.5px] rounded-[24px] p-[16px] gap-[4px] border-mieo-stroke">
            <Text className="text-mieo-heading font-nunito-black text-[16px] mb-[4px]">{t('lockscreen.test_title')}</Text>
            <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('lockscreen.test_d')}</Text>
            <View className="flex-row gap-[12px] mt-[12px]">
              <View className="flex-1">
                <CtaButton label={t('lockscreen.test_cta')} onPress={onTest} block />
              </View>
              <View className="flex-1">
                <Pressable className="rounded-[16px] py-[15px] items-center border-[1px] border-mieo-stroke" onPress={() => void refreshQueue()}>
                  <Text className="text-mieo-heading font-nunito-black text-[15px]">{t('lockscreen.refresh_queue')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function HourStepper({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const step = (delta: number) => onChange(((value + delta) % 24 + 24) % 24);
  return (
    <View className={twMerge("flex-1 rounded-[18px] p-[12px] gap-[8px] bg-[#F0F9FF] border-[1px] border-mieo-stroke", (disabled ? "opacity-[0.5]" : undefined))}>
      <Text className="text-mieo-body text-[11px] uppercase font-nunito-extrabold tracking-[1px]">{label}</Text>
      <View className="flex-row items-center justify-between">
        <Pressable className="bg-[#F0F9FF] rounded-[12px] w-8 min-h-11 items-center justify-center" onPress={() => step(-1)} disabled={disabled}>
          <Text className="text-mieo-heading font-nunito-black text-[18px]">−</Text>
        </Pressable>
        <Text className="text-mieo-heading font-nunito-black text-[16px]">{String(value).padStart(2, '0')}:00</Text>
        <Pressable className="bg-[#F0F9FF] rounded-[12px] w-8 min-h-11 items-center justify-center" onPress={() => step(1)} disabled={disabled}>
          <Text className="text-mieo-heading font-nunito-black text-[18px]">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
