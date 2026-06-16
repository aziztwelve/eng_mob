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
import { NeonScreen, neon, neonStyles } from '@/components/neon-screen';
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

  const onLogin = () => router.push('/auth/login');

  return (
    <NeonScreen>
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Header back */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="active:opacity-60"
        >
          <ArrowLeft size={22} color="#9ca3af" />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(220)} style={{ alignItems: 'center', marginTop: 8 }}>
            <Mascot pose="thumbs_up" size={120} />
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(280).delay(100)}
            style={[neonStyles.title, { textAlign: 'center', marginTop: 12, fontSize: 28 }]}
          >
            {t('onboarding.signup.title')}
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(280).delay(160)}
            style={{ color: neon.muted, fontWeight: '600', fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 }}
          >
            {t('onboarding.signup.subtitle')}
          </Animated.Text>

          {/* Email form (Android) */}
          {showEmailForm ? (
            <View style={{ gap: 10, marginTop: 20 }}>
              <TextInput
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: '#fff',
                }}
                placeholder={t('onboarding.signup.email.email_placeholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!busy}
              />
              <TextInput
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: '#fff',
                }}
                placeholder={t('onboarding.signup.email.username_placeholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
                editable={!busy}
              />
              <TextInput
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: '#fff',
                }}
                placeholder={t('onboarding.signup.email.password_placeholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!busy}
              />
              {emailErr ? (
                <Text style={{ color: '#FF7FAA', fontSize: 13, marginTop: 2 }}>{emailErr}</Text>
              ) : null}
              <Pressable
                onPress={() => void onEmailSubmit()}
                disabled={busy}
                style={[neonStyles.cta, { backgroundColor: neon.ctaBg }, busy && { opacity: 0.6, shadowOpacity: 0, backgroundColor: 'rgba(255,255,255,0.08)' }]}
                accessibilityRole="button"
              >
                <Text style={{ color: neon.text, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>
                  {claim.isPending && !complete.isPending
                    ? t('onboarding.signup.email.submitting')
                    : t('onboarding.signup.email.submit')}
                </Text>
              </Pressable>

              {googleAvailable ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <Text style={{ color: neon.muted, fontSize: 12, fontWeight: '700' }}>
                    {t('onboarding.signup.email.divider')}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                </View>
              ) : null}
            </View>
          ) : null}

          {/* OAuth buttons */}
          <View style={{ gap: 12, marginTop: 8 }}>
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
              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: neon.border, borderRadius: 16, padding: 12 }}>
                <Text style={{ color: neon.muted, fontSize: 13, lineHeight: 20 }}>
                  {t('onboarding.signup.no_oauth_hint')}
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={onLogin}
            style={{ paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
            className="active:opacity-60"
          >
            <Text style={{ color: neon.primary, fontWeight: '700', fontSize: 14 }}>
              {t('onboarding.signup.login_link')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' }}>
          {t('onboarding.signup.terms')}
        </Text>
      </View>
    </SafeAreaView>
    </NeonScreen>
  );
}
