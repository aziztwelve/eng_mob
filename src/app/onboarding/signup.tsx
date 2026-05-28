import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Mascot } from '@/components/onboarding/Mascot';
import { OAuthButton } from '@/components/onboarding/OAuthButton';
import { useClaimAccount } from '@/hooks/use-claim-account';
import { useCompleteOnboarding } from '@/hooks/use-onboarding';
import { analytics } from '@/lib/analytics';
import {
  isAppleAvailable,
  isGoogleAvailable,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/oauth';

/**
 * Sign-up (финальный шаг онбординга).
 *
 * Платформенно-зависимый набор методов:
 *   - iOS:     Apple + Google (OAuth-only, как на welcome раньше).
 *   - Android: Email/password форма + Google.
 *
 * Email/password идёт через `AuthApi.claim` (claim guest → registered),
 * чтобы не терять прогресс онбординга. Поэтому используем
 * `useClaimAccount({kind: 'password'})`, а не общий `useRegister`.
 *
 * Skip («Позже»): markOnboardingComplete без claim'а — юзер остаётся гостем,
 * но онбординг закрыт.
 */
export default function SignupScreen() {
  const { t } = useTranslation();
  const claim = useClaimAccount();
  const complete = useCompleteOnboarding();
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Email form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);

  useEffect(() => {
    analytics.track('signup_screen_viewed');
    void isAppleAvailable().then(setAppleAvailable);
  }, []);

  const googleAvailable = isGoogleAvailable();
  const showEmailForm = Platform.OS !== 'ios';
  const busy = claim.isPending || complete.isPending;

  const finishAndGoHome = async () => {
    try {
      await complete.mutateAsync();
      analytics.track('onboarding_completed');
    } finally {
      router.replace('/(tabs)');
    }
  };

  const onGoogle = async () => {
    if (busy) return;
    analytics.track('oauth_attempted', { provider: 'google' });
    const result = await signInWithGoogle();
    await handleOAuthResult('google', result);
  };

  const onApple = async () => {
    if (busy) return;
    analytics.track('oauth_attempted', { provider: 'apple' });
    const result = await signInWithApple();
    await handleOAuthResult('apple', result);
  };

  const handleOAuthResult = async (
    provider: 'google' | 'apple',
    result: Awaited<ReturnType<typeof signInWithGoogle>>,
  ) => {
    if (!result.ok) {
      if (result.reason === 'cancelled') return;
      analytics.track('oauth_failed', { provider, reason: result.reason });
      Toast.show({
        type: 'error',
        text1: `${provider} sign-in: ${result.reason}`,
        text2: result.message,
      });
      return;
    }
    try {
      await claim.mutateAsync({ kind: 'oauth', payload: result.payload });
      analytics.track('oauth_succeeded', { provider });
      await finishAndGoHome();
    } catch (err) {
      analytics.track('oauth_failed', {
        provider,
        reason: 'claim_error',
        message: err instanceof Error ? err.message : undefined,
      });
      Toast.show({
        type: 'error',
        text1: t('onboarding.signup.toast_failed'),
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  const onEmailSubmit = async () => {
    if (busy) return;
    setEmailErr(null);

    const trimmedEmail = email.trim();
    const trimmedUser = username.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setEmailErr(t('onboarding.signup.email.err_email'));
      return;
    }
    if (trimmedUser.length < 3) {
      setEmailErr(t('onboarding.signup.email.err_username'));
      return;
    }
    if (password.length < 8) {
      setEmailErr(t('onboarding.signup.email.err_password'));
      return;
    }

    analytics.track('signup_email_attempted');
    try {
      await claim.mutateAsync({
        kind: 'password',
        payload: {
          email: trimmedEmail,
          username: trimmedUser,
          password,
        },
      });
      analytics.track('signup_email_succeeded');
      await finishAndGoHome();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      analytics.track('signup_email_failed', { message });
      setEmailErr(message || t('onboarding.signup.toast_failed'));
      Toast.show({
        type: 'error',
        text1: t('onboarding.signup.toast_failed'),
        text2: message,
      });
    }
  };

  const onSkip = async () => {
    if (busy) return;
    analytics.track('claim_skipped');
    await finishAndGoHome();
  };

  const onLogin = () => router.push('/auth/login');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }} className="bg-background">
      {/* Header back */}
      <View className="flex-row items-center px-4 pt-2 pb-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="active:opacity-60"
        >
          <ArrowLeft size={22} color="#9ca3af" />
        </Pressable>
        <View className="flex-1" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(220)} className="items-center mt-2">
            <Mascot pose="thumbs_up" size={120} />
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(280).delay(100)}
            className="text-foreground font-black text-3xl text-center mt-3"
          >
            {t('onboarding.signup.title')}
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(280).delay(160)}
            className="text-muted-foreground font-medium text-base text-center mt-2"
          >
            {t('onboarding.signup.subtitle')}
          </Animated.Text>

          {/* Email form (Android) */}
          {showEmailForm ? (
            <View className="gap-2 mt-5">
              <TextInput
                className="bg-card border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base"
                placeholder={t('onboarding.signup.email.email_placeholder')}
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!busy}
              />
              <TextInput
                className="bg-card border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base"
                placeholder={t('onboarding.signup.email.username_placeholder')}
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
                editable={!busy}
              />
              <TextInput
                className="bg-card border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base"
                placeholder={t('onboarding.signup.email.password_placeholder')}
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!busy}
              />
              {emailErr ? (
                <Text className="text-destructive text-sm mt-1">{emailErr}</Text>
              ) : null}
              <Pressable
                onPress={() => void onEmailSubmit()}
                disabled={busy}
                className={`rounded-2xl py-4 items-center mt-1 ${
                  busy ? 'bg-muted opacity-60' : 'bg-primary active:opacity-80'
                }`}
                accessibilityRole="button"
              >
                <Text className="text-primary-foreground font-black text-base">
                  {claim.isPending && !complete.isPending
                    ? t('onboarding.signup.email.submitting')
                    : t('onboarding.signup.email.submit')}
                </Text>
              </Pressable>

              {googleAvailable ? (
                <View className="flex-row items-center gap-3 my-2">
                  <View className="flex-1 h-px bg-border" />
                  <Text className="text-muted-foreground text-xs font-bold">
                    {t('onboarding.signup.email.divider')}
                  </Text>
                  <View className="flex-1 h-px bg-border" />
                </View>
              ) : null}
            </View>
          ) : null}

          {/* OAuth buttons */}
          <View className="gap-3 mt-2">
            {appleAvailable ? (
              <OAuthButton
                provider="apple"
                onPress={() => void onApple()}
                loading={busy}
              />
            ) : null}
            {googleAvailable ? (
              <OAuthButton
                provider="google"
                onPress={() => void onGoogle()}
                loading={busy}
              />
            ) : null}

            {!appleAvailable && !googleAvailable && !showEmailForm ? (
              <View className="bg-card border-2 border-border rounded-2xl p-3">
                <Text className="text-muted-foreground font-medium text-sm leading-snug">
                  {t('onboarding.signup.no_oauth_hint')}
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={onLogin}
            className="py-3 items-center active:opacity-60 mt-2"
          >
            <Text className="text-primary font-bold text-sm">
              {t('onboarding.signup.login_link')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer skip */}
      <View className="px-5 pb-4 pt-2">
        <Pressable
          onPress={() => void onSkip()}
          disabled={busy}
          className="py-3 items-center active:opacity-60"
        >
          <Text className="text-muted-foreground font-bold text-sm">
            {t('onboarding.signup.skip')}
          </Text>
        </Pressable>
        <Text className="text-muted-foreground font-medium text-xs text-center">
          {t('onboarding.signup.terms')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
