import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import { Bell, BellOff, ShieldAlert, Smartphone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import {
  useNotificationDevices,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notifications';
import { usePushSubscription } from '@/hooks/use-push-subscription';
import { tsToDate } from '@/lib/api-client';
import {
  platformToShort,
  type DeviceToken,
  type UpdatePreferencesRequest,
} from '@/types/api';
import { glass, CtaButton } from '@/components/sunset';

/**
 * /profile/notifications — настройки push'ей (mobile mirror web).
 */
export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const prefs = useNotificationPreferences();
  const devices = useNotificationDevices();
  const updatePrefs = useUpdateNotificationPreferences();
  const push = usePushSubscription();

  const [form, setForm] = useState<UpdatePreferencesRequest | null>(null);

  useEffect(() => {
    if (!prefs.data || form) return;
    const p = prefs.data.prefs;
    setForm({
      practice_reminder_enabled: p.practice_reminder_enabled,
      streak_risk_enabled: p.streak_risk_enabled,
      daily_goal_enabled: p.daily_goal_enabled,
      achievement_enabled: p.achievement_enabled,
      friend_request_enabled: p.friend_request_enabled,
      quiet_hours_start: p.quiet_hours_start,
      quiet_hours_end: p.quiet_hours_end,
      timezone: p.timezone ?? '',
    });
  }, [prefs.data, form]);

  const isDirty = useMemo(() => {
    if (!form || !prefs.data) return false;
    const p = prefs.data.prefs;
    return (
      form.practice_reminder_enabled !== p.practice_reminder_enabled ||
      form.streak_risk_enabled !== p.streak_risk_enabled ||
      form.daily_goal_enabled !== p.daily_goal_enabled ||
      form.achievement_enabled !== p.achievement_enabled ||
      form.friend_request_enabled !== p.friend_request_enabled ||
      form.quiet_hours_start !== p.quiet_hours_start ||
      form.quiet_hours_end !== p.quiet_hours_end ||
      (form.timezone ?? '') !== (p.timezone ?? '')
    );
  }, [form, prefs.data]);

  const onSave = async () => {
    if (!form) return;
    try {
      await updatePrefs.mutateAsync(form);
      Toast.show({ type: 'success', text1: 'Настройки сохранены' });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось сохранить',
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  const onSubscribe = async () => {
    try {
      await push.subscribe();
      Toast.show({ type: 'success', text1: 'Push включены на этом устройстве' });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось подписаться',
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  const onRemoveDevice = (device: DeviceToken) => {
    Alert.alert(
      'Удалить устройство?',
      'Push-уведомления больше не будут приходить на это устройство.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await push.unsubscribe(device.id);
              Toast.show({ type: 'success', text1: 'Устройство удалено' });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Не удалось удалить',
                text2: err instanceof Error ? err.message : '',
              });
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Уведомления' }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Bell size={28} color="#FFD84A" />
          <Text style={s.title}>Уведомления</Text>
        </View>

        <PushSubCard
          state={push.state}
          ready={push.ready}
          isSubscribing={push.isSubscribing}
          lastError={push.lastError}
          onSubscribe={onSubscribe}
        />

        {prefs.isLoading || !form ? (
          <View style={[glass, s.card, { alignItems: 'center', paddingVertical: 32 }]}>
            <ActivityIndicator color="#FFD84A" />
          </View>
        ) : (
          <>
            <View style={[glass, s.card]}>
              <Text style={s.cardTitle}>Каналы</Text>
              <ChannelToggle
                label="Напоминания о практике"
                description="Пушим, если есть просроченные карточки и ты ещё не занимался."
                value={form.practice_reminder_enabled}
                onValueChange={(v) => setForm({ ...form, practice_reminder_enabled: v })}
              />
              <ChannelToggle
                label="Streak в зоне риска"
                description="Когда streak вот-вот сгорит — пинаем."
                value={form.streak_risk_enabled}
                onValueChange={(v) => setForm({ ...form, streak_risk_enabled: v })}
              />
              <ChannelToggle
                label="Дневная цель"
                description="Если до конца дня цель не выполнена."
                value={form.daily_goal_enabled}
                onValueChange={(v) => setForm({ ...form, daily_goal_enabled: v })}
              />
              <ChannelToggle
                label="Достижения"
                description="Когда разблокирована новая ачивка."
                value={form.achievement_enabled}
                onValueChange={(v) => setForm({ ...form, achievement_enabled: v })}
              />
              <ChannelToggle
                label="Заявки в друзья"
                description="Кто-то добавил тебя или принял заявку."
                value={form.friend_request_enabled}
                onValueChange={(v) => setForm({ ...form, friend_request_enabled: v })}
                last
              />
            </View>

            <View style={[glass, s.card]}>
              <Text style={s.cardTitle}>Тихие часы</Text>
              <Text style={s.cardSub}>
                В этот промежуток (локального времени) push'и не приходят.
                Если start == end — отключено.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <HourStepper
                  label="С"
                  value={form.quiet_hours_start}
                  onChange={(v) => setForm({ ...form, quiet_hours_start: v })}
                />
                <HourStepper
                  label="До"
                  value={form.quiet_hours_end}
                  onChange={(v) => setForm({ ...form, quiet_hours_end: v })}
                />
              </View>
            </View>

            {isDirty && !updatePrefs.isPending ? (
              <CtaButton label="Сохранить" onPress={onSave} block />
            ) : (
              <View style={[glass, s.saveDisabled]}>
                {updatePrefs.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveDisabledText}>Сохранить</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Devices */}
        <View style={[glass, s.card]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Smartphone size={18} color="#FFD84A" />
            <Text style={s.cardTitle}>Устройства</Text>
          </View>
          {devices.isLoading ? (
            <ActivityIndicator color="#FFD84A" style={{ marginTop: 10 }} />
          ) : (devices.data?.devices?.length ?? 0) === 0 ? (
            <Text style={s.cardSub}>Нет зарегистрированных устройств.</Text>
          ) : (
            <View style={{ marginTop: 6 }}>
              {devices.data!.devices.map((d, i) => (
                <DeviceRow
                  key={d.id}
                  device={d}
                  onRemove={() => onRemoveDevice(d)}
                  busy={push.isUnsubscribing}
                  last={i === devices.data!.devices.length - 1}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function PushSubCard({
  state,
  ready,
  isSubscribing,
  lastError,
  onSubscribe,
}: {
  state: ReturnType<typeof usePushSubscription>['state'];
  ready: boolean;
  isSubscribing: boolean;
  lastError: string | null;
  onSubscribe: () => Promise<void>;
}) {
  if (!ready) {
    return (
      <View style={[glass, s.card, { alignItems: 'center', paddingVertical: 24 }]}>
        <ActivityIndicator color="#FFD84A" />
      </View>
    );
  }

  if (state === 'subscribed') {
    return (
      <View style={[glass, s.statusCard, { borderColor: 'rgba(52,211,153,0.5)' }]}>
        <View style={s.statusHead}>
          <Bell size={20} color="#34D399" />
          <Text style={s.statusTitle}>Push включены на этом устройстве</Text>
        </View>
        <Text style={s.cardSub}>Чтобы отключить — удалите устройство из списка ниже.</Text>
      </View>
    );
  }

  if (state === 'unsupported') {
    return (
      <View style={[glass, s.statusCard]}>
        <View style={s.statusHead}>
          <BellOff size={20} color="rgba(255,255,255,0.7)" />
          <Text style={s.statusTitle}>Push не поддерживаются</Text>
        </View>
        <Text style={s.cardSub}>
          Push'и работают только на физическом устройстве (не в симуляторе).
        </Text>
      </View>
    );
  }

  if (state === 'denied') {
    return (
      <View style={[glass, s.statusCard, { borderColor: 'rgba(249,115,22,0.5)' }]}>
        <View style={s.statusHead}>
          <ShieldAlert size={20} color="#FB923C" />
          <Text style={s.statusTitle}>Permission заблокирован</Text>
        </View>
        <Text style={s.cardSub}>
          Включите уведомления в системных настройках устройства, затем вернитесь сюда.
        </Text>
      </View>
    );
  }

  // undetermined / granted_no_token / unknown — показываем кнопку.
  return (
    <View style={[glass, s.statusCard, { borderColor: 'rgba(255,216,74,0.45)', gap: 12 }]}>
      <View style={s.statusHead}>
        <Bell size={20} color="#FFD84A" />
        <Text style={s.statusTitle}>Включить уведомления</Text>
      </View>
      <Text style={s.cardSub}>
        Streak-напоминания, ежедневные цели, ачивки и заявки в друзья — без этого
        они не дойдут.
      </Text>
      {lastError ? <Text style={s.errorText}>{lastError}</Text> : null}
      <CtaButton
        label={isSubscribing ? 'Включаем…' : 'Включить push'}
        onPress={() => void onSubscribe()}
        block
      />
    </View>
  );
}

function ChannelToggle({
  label,
  description,
  value,
  onValueChange,
  last,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[s.toggleRow, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        <Text style={s.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.25)', true: '#FFB338' }}
        thumbColor="#ffffff"
        ios_backgroundColor="rgba(255,255,255,0.25)"
      />
    </View>
  );
}

function HourStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange((value - 1 + 24) % 24);
  const inc = () => onChange((value + 1) % 24);
  return (
    <View style={s.stepper}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={dec} style={s.stepperBtn}>
          <Text style={s.stepperBtnText}>−</Text>
        </Pressable>
        <Text style={s.stepperValue}>{String(value).padStart(2, '0')}:00</Text>
        <Pressable onPress={inc} style={s.stepperBtn}>
          <Text style={s.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DeviceRow({
  device,
  onRemove,
  busy,
  last,
}: {
  device: DeviceToken;
  onRemove: () => void;
  busy: boolean;
  last?: boolean;
}) {
  const platform = platformToShort(device.platform);
  const lastSeen = device.last_seen_at ? tsToDate(device.last_seen_at) : null;
  return (
    <View style={[s.toggleRow, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.platformPill}>
            <Text style={s.platformText}>{platform ?? 'unknown'}</Text>
          </View>
          <Text style={s.deviceName} numberOfLines={1}>
            {device.user_agent ?? `${device.token.slice(0, 24)}…`}
          </Text>
        </View>
        {lastSeen && (
          <Text style={s.deviceSeen}>Последний раз: {lastSeen.toLocaleString()}</Text>
        )}
      </View>
      <Pressable onPress={onRemove} disabled={busy} style={[glass, s.removeBtn, busy && { opacity: 0.5 }]}>
        <Text style={s.removeText}>Удалить</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  title: { color: '#fff', fontWeight: '900', fontSize: 28 },

  card: { borderRadius: 24, padding: 16, gap: 4 },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  cardSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18, fontWeight: '500' },

  statusCard: { borderRadius: 24, padding: 16, gap: 6, borderColor: 'rgba(255,255,255,0.22)' },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusTitle: { color: '#fff', fontWeight: '900', fontSize: 15, flex: 1 },
  errorText: { color: '#FB923C', fontSize: 12, fontWeight: '800' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  toggleLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
  toggleDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 16 },

  saveDisabled: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', opacity: 0.6 },
  saveDisabledText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  stepper: { flex: 1, borderRadius: 18, padding: 12, gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  stepperLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1 },
  stepperBtn: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  stepperBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  stepperValue: { color: '#fff', fontWeight: '900', fontSize: 22 },

  platformPill: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  platformText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  deviceName: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  deviceSeen: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 3 },
  removeBtn: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderColor: 'rgba(255,111,160,0.4)' },
  removeText: { color: '#FF6FA0', fontWeight: '800', fontSize: 12 },
});
