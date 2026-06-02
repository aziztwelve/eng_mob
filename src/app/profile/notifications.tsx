import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BellOff,
  ShieldAlert,
  Smartphone,
} from 'lucide-react-native';
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

/**
 * /profile/notifications — настройки push'ей (mobile mirror web).
 *
 *   1. Кнопка «Включить уведомления» (Expo push registration в этом устройстве).
 *   2. Тогглы 5 каналов (practice_reminder / streak_risk / daily_goal /
 *      achievement / friend_request).
 *   3. Quiet hours (start/end, 0..23 локального часа).
 *   4. Список зарегистрированных устройств + «Удалить».
 */
export default function NotificationsSettingsScreen() {
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
      Toast.show({
        type: 'success',
        text1: 'Push включены на этом устройстве',
      });
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
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Уведомления' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">К профилю</Text>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Bell size={28} color="#00FFA3" />
          <Text className="text-foreground font-black text-3xl">
            Уведомления
          </Text>
        </View>

        {/* Push subscribe card */}
        <PushSubCard
          state={push.state}
          ready={push.ready}
          isSubscribing={push.isSubscribing}
          lastError={push.lastError}
          onSubscribe={onSubscribe}
        />

        {/* Channels */}
        {prefs.isLoading || !form ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center">
            <ActivityIndicator color="#00FFA3" />
          </View>
        ) : (
          <>
            <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
              <Text className="text-foreground font-black text-lg">Каналы</Text>
              <ChannelToggle
                label="Напоминания о практике"
                description="Пушим, если есть просроченные карточки и ты ещё не занимался."
                value={form.practice_reminder_enabled}
                onValueChange={(v) =>
                  setForm({ ...form, practice_reminder_enabled: v })
                }
              />
              <ChannelToggle
                label="Streak в зоне риска"
                description="Когда streak вот-вот сгорит — пинаем."
                value={form.streak_risk_enabled}
                onValueChange={(v) =>
                  setForm({ ...form, streak_risk_enabled: v })
                }
              />
              <ChannelToggle
                label="Дневная цель"
                description="Если до конца дня цель не выполнена."
                value={form.daily_goal_enabled}
                onValueChange={(v) =>
                  setForm({ ...form, daily_goal_enabled: v })
                }
              />
              <ChannelToggle
                label="Достижения"
                description="Когда разблокирована новая ачивка."
                value={form.achievement_enabled}
                onValueChange={(v) =>
                  setForm({ ...form, achievement_enabled: v })
                }
              />
              <ChannelToggle
                label="Заявки в друзья"
                description="Кто-то добавил тебя или принял заявку."
                value={form.friend_request_enabled}
                onValueChange={(v) =>
                  setForm({ ...form, friend_request_enabled: v })
                }
              />
            </View>

            {/* Quiet hours */}
            <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
              <Text className="text-foreground font-black text-lg">
                Тихие часы
              </Text>
              <Text className="text-muted-foreground text-sm font-medium">
                В этот промежуток (локального времени) push'и не приходят.
                Если start == end — отключено.
              </Text>
              <View className="flex-row gap-3">
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

            {/* Save */}
            <Pressable
              onPress={onSave}
              disabled={!isDirty || updatePrefs.isPending}
              className={`rounded-2xl py-3 items-center ${
                isDirty && !updatePrefs.isPending
                  ? 'bg-primary active:opacity-80'
                  : 'bg-muted opacity-60'
              }`}
            >
              {updatePrefs.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-primary-foreground font-black">
                  Сохранить
                </Text>
              )}
            </Pressable>
          </>
        )}

        {/* Devices */}
        <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
          <View className="flex-row items-center gap-2">
            <Smartphone size={18} color="#00FFA3" />
            <Text className="text-foreground font-black text-lg">
              Устройства
            </Text>
          </View>
          {devices.isLoading ? (
            <ActivityIndicator color="#00FFA3" />
          ) : (devices.data?.devices?.length ?? 0) === 0 ? (
            <Text className="text-muted-foreground font-medium text-sm">
              Нет зарегистрированных устройств.
            </Text>
          ) : (
            <View className="gap-2">
              {devices.data!.devices.map((d) => (
                <DeviceRow
                  key={d.id}
                  device={d}
                  onRemove={() => onRemoveDevice(d)}
                  busy={push.isUnsubscribing}
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
      <View className="bg-card rounded-3xl border-4 border-border p-6 items-center">
        <ActivityIndicator color="#00FFA3" />
      </View>
    );
  }

  if (state === 'subscribed') {
    return (
      <View className="bg-emerald-500/10 rounded-3xl border-4 border-emerald-500 p-4 gap-2">
        <View className="flex-row items-center gap-2">
          <Bell size={20} color="#10b981" />
          <Text className="text-foreground font-black">
            Push включены на этом устройстве
          </Text>
        </View>
        <Text className="text-muted-foreground text-sm font-medium">
          Чтобы отключить — удалите устройство из списка ниже.
        </Text>
      </View>
    );
  }

  if (state === 'unsupported') {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-4 gap-2">
        <View className="flex-row items-center gap-2">
          <BellOff size={20} color="#9ca3af" />
          <Text className="text-foreground font-bold">
            Push не поддерживаются
          </Text>
        </View>
        <Text className="text-muted-foreground text-sm font-medium">
          Push'и работают только на физическом устройстве (не в симуляторе).
        </Text>
      </View>
    );
  }

  if (state === 'denied') {
    return (
      <View className="bg-orange-500/10 rounded-3xl border-4 border-orange-500 p-4 gap-2">
        <View className="flex-row items-center gap-2">
          <ShieldAlert size={20} color="#f97316" />
          <Text className="text-foreground font-black">
            Permission заблокирован
          </Text>
        </View>
        <Text className="text-muted-foreground text-sm font-medium">
          Включите уведомления в системных настройках устройства, затем
          вернитесь сюда.
        </Text>
      </View>
    );
  }

  // undetermined / granted_no_token / unknown — показываем кнопку.
  return (
    <View className="bg-primary/10 rounded-3xl border-4 border-primary p-4 gap-3">
      <View className="flex-row items-center gap-2">
        <Bell size={20} color="#00FFA3" />
        <Text className="text-foreground font-black text-lg">
          Включить уведомления
        </Text>
      </View>
      <Text className="text-muted-foreground text-sm font-medium">
        Streak-напоминания, ежедневные цели, ачивки и заявки в друзья — без
        этого они не дойдут.
      </Text>
      {lastError ? (
        <Text className="text-orange-500 text-xs font-bold">{lastError}</Text>
      ) : null}
      <Pressable
        onPress={() => void onSubscribe()}
        disabled={isSubscribing}
        className="bg-primary rounded-2xl py-3 items-center active:opacity-80"
      >
        {isSubscribing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-primary-foreground font-black">
            Включить push
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function ChannelToggle({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-2 border-b border-border/40">
      <View className="flex-1 gap-0.5">
        <Text className="text-foreground font-bold">{label}</Text>
        <Text className="text-muted-foreground text-xs font-medium">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3f3f46', true: '#00FFA3' }}
        thumbColor={value ? '#ffffff' : '#9ca3af'}
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
    <View className="flex-1 bg-muted rounded-2xl p-3 gap-1">
      <Text className="text-muted-foreground text-xs uppercase font-bold tracking-wider">
        {label}
      </Text>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={dec}
          className="bg-card rounded-xl px-3 py-2 active:opacity-70"
        >
          <Text className="text-foreground font-black text-lg">−</Text>
        </Pressable>
        <Text className="text-foreground font-black text-2xl tabular-nums">
          {String(value).padStart(2, '0')}:00
        </Text>
        <Pressable
          onPress={inc}
          className="bg-card rounded-xl px-3 py-2 active:opacity-70"
        >
          <Text className="text-foreground font-black text-lg">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DeviceRow({
  device,
  onRemove,
  busy,
}: {
  device: DeviceToken;
  onRemove: () => void;
  busy: boolean;
}) {
  const platform = platformToShort(device.platform);
  const lastSeen = device.last_seen_at
    ? tsToDate(device.last_seen_at)
    : null;
  return (
    <View className="flex-row items-center justify-between gap-3 py-2 border-b border-border/40">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <View className="bg-card border-2 border-border rounded-full px-2 py-0.5">
            <Text className="text-foreground text-[10px] font-bold uppercase">
              {platform ?? 'unknown'}
            </Text>
          </View>
          <Text className="text-foreground text-sm font-bold flex-1" numberOfLines={1}>
            {device.user_agent ?? device.token.slice(0, 24)}…
          </Text>
        </View>
        {lastSeen && (
          <Text className="text-muted-foreground text-[10px] font-bold">
            Последний раз: {lastSeen.toLocaleString()}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onRemove}
        disabled={busy}
        className={`rounded-xl px-3 py-2 ${
          busy ? 'bg-muted opacity-60' : 'bg-card border-2 border-border active:opacity-80'
        }`}
      >
        <Text className="text-orange-500 font-bold text-xs">Удалить</Text>
      </Pressable>
    </View>
  );
}
