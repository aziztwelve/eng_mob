import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  ActivityIndicator,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BookOpenText, BellOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

import { glass, CtaButton } from '@/components/sunset';
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: t('lockscreen.title') }} />
        <ActivityIndicator color="#FFD84A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('lockscreen.title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BookOpenText size={28} color="#FFD84A" />
          <Text style={s.title}>{t('lockscreen.title')}</Text>
        </View>
        <Text style={s.subtitle}>{t('lockscreen.subtitle')}</Text>

        {/* Permission warning */}
        {permission === 'denied' && (
          <View style={[glass, s.card, { borderColor: 'rgba(249,115,22,0.5)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BellOff size={20} color="#FB923C" />
              <Text style={s.cardTitle}>{t('lockscreen.permission_blocked')}</Text>
            </View>
            <Text style={s.cardSub}>{t('lockscreen.permission_blocked_d')}</Text>
            <CtaButton label={t('lockscreen.open_settings')} onPress={openSystemSettings} block />
          </View>
        )}

        {/* Main toggle */}
        <View style={[glass, s.card]}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={s.toggleLabel}>{t('lockscreen.enable')}</Text>
              <Text style={s.toggleDesc}>{t('lockscreen.enable_d')}</Text>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={onToggle}
              disabled={busy}
              trackColor={{ false: 'rgba(255,255,255,0.18)', true: '#00FFA3' }}
              thumbColor="#fff"
            />
          </View>

          {config.enabled && (
            <Text style={[s.cardSub, { marginTop: 8 }]}>
              {queueCount === null
                ? '…'
                : t('lockscreen.queue', { count: queueCount })}
            </Text>
          )}
        </View>

        {/* Interval */}
        <View style={[glass, s.card, config.enabled ? null : s.dimmed]}>
          <Text style={s.cardTitle}>{t('lockscreen.interval_title')}</Text>
          <View style={s.pillRow}>
            {INTERVAL_CHOICES.map((min) => {
              const active = config.intervalMin === min;
              return (
                <Pressable
                  key={min}
                  onPress={() => onInterval(min)}
                  disabled={!config.enabled || busy}
                  style={[s.pill, active && s.pillActive]}
                >
                  <Text style={[s.pillText, active && s.pillTextActive]}>
                    {t('lockscreen.every_min', { count: min })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Quiet hours */}
        <View style={[glass, s.card, config.enabled ? null : s.dimmed]}>
          <Text style={s.cardTitle}>{t('lockscreen.quiet_title')}</Text>
          <Text style={s.cardSub}>{t('lockscreen.quiet_d')}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
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
          <View style={[glass, s.card]}>
            <Text style={s.cardTitle}>{t('lockscreen.test_title')}</Text>
            <Text style={s.cardSub}>{t('lockscreen.test_d')}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <CtaButton label={t('lockscreen.test_cta')} onPress={onTest} block />
              </View>
              <View style={{ flex: 1 }}>
                <Pressable style={s.secondaryBtn} onPress={() => void refreshQueue()}>
                  <Text style={s.secondaryBtnText}>{t('lockscreen.refresh_queue')}</Text>
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
    <View style={[s.stepper, disabled && { opacity: 0.5 }]}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable style={s.stepperBtn} onPress={() => step(-1)} disabled={disabled}>
          <Text style={s.stepperBtnText}>−</Text>
        </Pressable>
        <Text style={s.stepperValue}>{String(value).padStart(2, '0')}:00</Text>
        <Pressable style={s.stepperBtn} onPress={() => step(1)} disabled={disabled}>
          <Text style={s.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  title: { color: '#fff', fontWeight: '900', fontSize: 28 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18, fontWeight: '500' },

  card: { borderRadius: 24, padding: 16, gap: 4, borderColor: 'rgba(255,255,255,0.22)' },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  cardSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18, fontWeight: '500' },

  dimmed: { opacity: 0.55 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
  toggleDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 16, marginTop: 3 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pillActive: { backgroundColor: '#00FFA3', borderColor: '#00FFA3' },
  pillText: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 12 },
  pillTextActive: { color: '#06170F' },

  stepper: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  stepperLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  stepperBtn: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  stepperBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  stepperValue: { color: '#fff', fontWeight: '900', fontSize: 22 },

  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
