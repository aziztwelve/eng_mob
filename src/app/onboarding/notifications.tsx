import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Bell, Flame, Brain, Trophy } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { usePatchOnboarding } from '@/hooks/use-onboarding';
import { usePushSubscription } from '@/hooks/use-push-subscription';

const TOTAL = 14;

/**
 * Phase 3 mobile + onboarding bridge.
 *
 * Просим юзера включить push'и **после** того, как он понял ценность
 * (видит цель, выбрал язык). По данным Apple/Google, opt-in после prompt
 * с контекстом ~50%, против ~25% при unprompted system dialog.
 *
 * Юзер может skip'нуть — всегда сможет включить позже в /profile/notifications.
 */
export default function OnboardingNotificationsScreen() {
  const { t } = useTranslation();
  const push = usePushSubscription();
  const patch = usePatchOnboarding();

  const goNext = async () => {
    await patch.mutateAsync({ notifications_prompted: true });
    router.push('/onboarding/plan');
  };

  const onEnable = async () => {
    try {
      await push.subscribe();
      Toast.show({ type: 'success', text1: t('onboarding.notifications.toast.enabled') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('onboarding.notifications.toast.failed_title'),
        text2: err instanceof Error ? err.message : '',
      });
    } finally {
      // В любом случае двигаемся дальше — юзер может включить позже.
      await goNext();
    }
  };

  const onSkip = async () => {
    await goNext();
  };

  const subscribed = push.state === 'subscribed';
  const unsupported = push.state === 'unsupported';
  const denied = push.state === 'denied';
  const canSubscribe =
    !subscribed && !unsupported && !denied && push.ready;

  return (
    <OnboardingShell
      trackKey="notifications"
      step={12}
      total={TOTAL}
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      onContinue={canSubscribe ? onEnable : goNext}
      continueLabel={
        subscribed
          ? t('onboarding.notifications.cta_next')
          : unsupported || denied
            ? t('onboarding.notifications.cta_next')
            : t('onboarding.notifications.cta_enable')
      }
      continueLoading={push.isSubscribing || patch.isPending}
      footerExtra={
        canSubscribe ? (
          <Pressable
            onPress={() => void onSkip()}
            className="py-2 items-center active:opacity-60"
          >
            <Text className="text-muted-foreground font-bold">
              {t('onboarding.notifications.skip')}
            </Text>
          </Pressable>
        ) : null
      }
    >
      <View className="bg-card rounded-3xl border-4 border-border p-5 gap-4 mt-2">
        <Channel
          icon={<Flame size={20} color="#f97316" />}
          title={t('onboarding.notifications.channels.streak_title')}
          description={t('onboarding.notifications.channels.streak_desc')}
        />
        <Channel
          icon={<Brain size={20} color="#00FFA3" />}
          title={t('onboarding.notifications.channels.practice_title')}
          description={t('onboarding.notifications.channels.practice_desc')}
        />
        <Channel
          icon={<Trophy size={20} color="#f59e0b" />}
          title={t('onboarding.notifications.channels.achievements_title')}
          description={t('onboarding.notifications.channels.achievements_desc')}
        />
        <Channel
          icon={<Bell size={20} color="#a855f7" />}
          title={t('onboarding.notifications.channels.quiet_title')}
          description={t('onboarding.notifications.channels.quiet_desc')}
        />
      </View>

      {push.ready && (
        <StatusHint
          t={t}
          subscribed={subscribed}
          unsupported={unsupported}
          denied={denied}
          lastError={push.lastError}
        />
      )}
      {!push.ready && (
        <View className="flex-row items-center justify-center py-2">
          <ActivityIndicator color="#00FFA3" />
        </View>
      )}
    </OnboardingShell>
  );
}

function Channel({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="w-9 h-9 rounded-2xl bg-muted items-center justify-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-black text-sm">{title}</Text>
        <Text className="text-muted-foreground font-medium text-xs">
          {description}
        </Text>
      </View>
    </View>
  );
}

function StatusHint({
  t,
  subscribed,
  unsupported,
  denied,
  lastError,
}: {
  t: (key: string) => string;
  subscribed: boolean;
  unsupported: boolean;
  denied: boolean;
  lastError: string | null;
}) {
  if (subscribed) {
    return (
      <Text className="text-emerald-500 font-bold text-center mt-2">
        {t('onboarding.notifications.status.subscribed')}
      </Text>
    );
  }
  if (unsupported) {
    return (
      <Text className="text-muted-foreground font-medium text-center mt-2 text-xs">
        {t('onboarding.notifications.status.unsupported')}
      </Text>
    );
  }
  if (denied) {
    return (
      <Text className="text-orange-500 font-bold text-center mt-2 text-xs">
        {t('onboarding.notifications.status.denied')}
      </Text>
    );
  }
  if (lastError) {
    return (
      <Text className="text-orange-500 font-bold text-center mt-2 text-xs">
        {lastError}
      </Text>
    );
  }
  return null;
}
