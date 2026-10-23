import { twMerge } from 'tailwind-merge';
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
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import { ProfileButton as CtaButton, ProfileQueryError } from '@/components/profile/profile-ui';

/**
 * /profile/notifications — настройки push'ей (mobile mirror web).
 */
export default function NotificationsSettingsScreen() {
  const { t } = useTranslation();
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
      Toast.show({ type: 'success', text1: t('common.saved') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.save_failed'),
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  const onSubscribe = async () => {
    try {
      await push.subscribe();
      Toast.show({ type: 'success', text1: t('notif.push_on') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.subscribe_failed'),
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  const onRemoveDevice = (device: DeviceToken) => {
    Alert.alert(
      t('notif.remove_q'),
      t('notif.remove_desc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await push.unsubscribe(device.id);
              Toast.show({ type: 'success', text1: t('common.device_removed') });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: t('common.delete_failed'),
                text2: err instanceof Error ? err.message : '',
              });
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: t('profile.notif_title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >


        <PushSubCard
          state={push.state}
          ready={push.ready}
          isSubscribing={push.isSubscribing}
          lastError={push.lastError}
          onSubscribe={onSubscribe}
        />

        {prefs.isError ? <ProfileQueryError onRetry={() => { void prefs.refetch(); }} /> : prefs.isLoading || !form ? (
          <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[4px] items-center py-[32px]">
            <ActivityIndicator color="#1AB3FF" />
          </View>
        ) : (
          <>
            <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[4px]">
              <Text className="text-mieo-heading font-nunito-black text-[16px] mb-[4px]">{t('notif.channels')}</Text>
              <ChannelToggle
                label={t('notif.ch_practice')}
                description={t('notif.ch_practice_d')}
                value={form.practice_reminder_enabled}
                onValueChange={(v) => setForm({ ...form, practice_reminder_enabled: v })}
              />
              <ChannelToggle
                label={t('notif.ch_streak')}
                description={t('notif.ch_streak_d')}
                value={form.streak_risk_enabled}
                onValueChange={(v) => setForm({ ...form, streak_risk_enabled: v })}
              />
              <ChannelToggle
                label={t('profile.daily_goal')}
                description={t('notif.ch_goal_d')}
                value={form.daily_goal_enabled}
                onValueChange={(v) => setForm({ ...form, daily_goal_enabled: v })}
              />
              <ChannelToggle
                label={t('profile.achievements')}
                description={t('notif.ch_ach_d')}
                value={form.achievement_enabled}
                onValueChange={(v) => setForm({ ...form, achievement_enabled: v })}
              />
              <ChannelToggle
                label={t('notif.ch_friend')}
                description={t('notif.ch_friend_d')}
                value={form.friend_request_enabled}
                onValueChange={(v) => setForm({ ...form, friend_request_enabled: v })}
                last
              />
            </View>

            <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[4px]">
              <Text className="text-mieo-heading font-nunito-black text-[16px] mb-[4px]">{t('notif.quiet')}</Text>
              <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('notif.quiet_d')}</Text>
              <View className="flex-row gap-[12px] mt-[12px]">
                <HourStepper
                  label={t('notif.from')}
                  value={form.quiet_hours_start}
                  onChange={(v) => setForm({ ...form, quiet_hours_start: v })}
                />
                <HourStepper
                  label={t('notif.to')}
                  value={form.quiet_hours_end}
                  onChange={(v) => setForm({ ...form, quiet_hours_end: v })}
                />
              </View>
            </View>

            {isDirty && !updatePrefs.isPending ? (
              <CtaButton label={t('common.save')} onPress={onSave} block />
            ) : (
              <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[16px] py-[15px] items-center opacity-[0.6]">
                {updatePrefs.isPending ? (
                  <ActivityIndicator color="#1AB3FF" />
                ) : (
                  <Text className="text-mieo-heading font-nunito-black text-[15px]">{t('common.save')}</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Devices */}
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[4px]">
          <View className="flex-row items-center gap-[8px]">
            <Smartphone size={18} color="#1AB3FF" />
            <Text className="text-mieo-heading font-nunito-black text-[16px] mb-[4px]">{t('notif.devices')}</Text>
          </View>
          {devices.isError ? <ProfileQueryError onRetry={() => { void devices.refetch(); }} /> : devices.isLoading ? (
            <ActivityIndicator color="#1AB3FF" className="mt-[10px]" />
          ) : (devices.data?.devices?.length ?? 0) === 0 ? (
            <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('notif.no_devices')}</Text>
          ) : (
            <View className="mt-[6px]">
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
  const { t } = useTranslation();
  if (!ready) {
    return (
      <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[4px] items-center py-[24px]">
        <ActivityIndicator color="#1AB3FF" />
      </View>
    );
  }

  if (state === 'subscribed') {
    return (
      <View className="bg-mieo-surface border-[1.5px] rounded-[24px] p-[16px] gap-[6px] border-[rgba(52,211,153,0.5)]">
        <View className="flex-row items-center gap-[8px]">
          <Bell size={20} color="#34D399" />
          <Text className="text-mieo-heading font-nunito-black text-[15px] flex-1">{t('notif.push_on')}</Text>
        </View>
        <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('notif.push_on_d')}</Text>
      </View>
    );
  }

  if (state === 'unsupported') {
    return (
      <View className="bg-mieo-surface border-[1.5px] rounded-[24px] p-[16px] gap-[6px] border-mieo-stroke">
        <View className="flex-row items-center gap-[8px]">
          <BellOff size={20} color="#5D686F" />
          <Text className="text-mieo-heading font-nunito-black text-[15px] flex-1">{t('notif.unsupported')}</Text>
        </View>
        <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('notif.unsupported_d')}</Text>
      </View>
    );
  }

  if (state === 'denied') {
    return (
      <View className="bg-mieo-surface border-[1.5px] rounded-[24px] p-[16px] gap-[6px] border-[rgba(249,115,22,0.5)]">
        <View className="flex-row items-center gap-[8px]">
          <ShieldAlert size={20} color="#FB923C" />
          <Text className="text-mieo-heading font-nunito-black text-[15px] flex-1">{t('notif.denied')}</Text>
        </View>
        <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('notif.denied_d')}</Text>
      </View>
    );
  }

  // undetermined / granted_no_token / unknown — показываем кнопку.
  return (
    <View className="bg-mieo-surface border-[1.5px] rounded-[24px] p-[16px] border-[#C9EDFF] gap-[12px]">
      <View className="flex-row items-center gap-[8px]">
        <Bell size={20} color="#1AB3FF" />
        <Text className="text-mieo-heading font-nunito-black text-[15px] flex-1">{t('notif.enable')}</Text>
      </View>
      <Text className="text-mieo-body text-[13px] leading-[18px] font-nunito-medium">{t('notif.enable_d')}</Text>
      {lastError ? <Text className="text-[#FB923C] text-[12px] font-nunito-extrabold">{lastError}</Text> : null}
      <CtaButton
        label={isSubscribing ? t('notif.enabling') : t('notif.enable_push')}
        disabled={isSubscribing}
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
    <View className={twMerge("flex-row items-center justify-between gap-[12px] py-[11px] border-b-[1px] border-b-[#E3E6E8]", (last ? "border-b-[0px]" : undefined))}>
      <View className="flex-1 gap-[2px]">
        <Text className="text-mieo-heading font-nunito-extrabold text-[14px]">{label}</Text>
        <Text className="text-mieo-body text-[12px] leading-[16px]">{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E3E6E8', true: '#59C8FF' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#E3E6E8"
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
    <View className="flex-1 rounded-[18px] p-[12px] gap-[8px] bg-[#F0F9FF] border-[1px] border-mieo-stroke">
      <Text className="text-mieo-body text-[11px] uppercase font-nunito-extrabold tracking-[1px]">{label}</Text>
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} −1`} onPress={dec} className="bg-[#F0F9FF] rounded-[12px] w-8 min-h-11 items-center justify-center">
          <Text className="text-mieo-heading font-nunito-black text-[18px]">−</Text>
        </Pressable>
        <Text className="text-mieo-heading font-nunito-black text-[16px]">{String(value).padStart(2, '0')}:00</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} +1`} onPress={inc} className="bg-[#F0F9FF] rounded-[12px] w-8 min-h-11 items-center justify-center">
          <Text className="text-mieo-heading font-nunito-black text-[18px]">+</Text>
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
  const { t } = useTranslation();
  return (
    <View className={twMerge("flex-row items-center justify-between gap-[12px] py-[11px] border-b-[1px] border-b-[#E3E6E8]", (last ? "border-b-[0px]" : undefined))}>
      <View className="flex-1">
        <View className="flex-row items-center gap-[8px]">
          <View className="bg-[#F0F9FF] rounded-[999px] px-[8px] py-[2px]">
            <Text className="text-mieo-heading text-[10px] font-nunito-extrabold uppercase">{platform ?? 'unknown'}</Text>
          </View>
          <Text className="text-mieo-heading text-[13px] font-nunito-bold flex-1" numberOfLines={1}>
            {device.user_agent ?? `${device.token.slice(0, 24)}…`}
          </Text>
        </View>
        {lastSeen && (
          <Text className="text-mieo-body text-[10px] font-nunito-bold mt-[3px]">{t('notif.last_seen', { time: lastSeen.toLocaleString() })}</Text>
        )}
      </View>
      <Pressable onPress={onRemove} disabled={busy} className={twMerge("bg-mieo-surface border-[1.5px] border-[#C9EDFF]", "rounded-[12px] px-[12px] py-[8px] border-[rgba(255,111,160,0.4)]", (busy ? "opacity-[0.5]" : undefined))}>
        <Text className="text-[#FF6FA0] font-nunito-extrabold text-[12px]">{t('common.remove')}</Text>
      </Pressable>
    </View>
  );
}
