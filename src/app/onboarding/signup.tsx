import { useKeyboardScroll } from '@/hooks/use-keyboard-scroll';
import { KeyboardLift } from '@/components/keyboard-lift';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { CloudBear, CloudButton, CloudScreen } from '@/components/onboarding/CloudScreen';
import { syncLocalOnboardingToBackend } from '@/hooks/use-onboarding';
import { analytics } from '@/lib/analytics';
import { AuthApi } from '@/lib/api-client';
import { AuthService } from '@/lib/auth-service';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { useSocialLogin } from '@/hooks/use-social-login';

export default function SignupScreen() {
  const { t } = useTranslation();
  const keyboardScroll = useKeyboardScroll();
  const register = useMutation({ mutationFn: AuthApi.register });
  const finish = useMutation({ mutationFn: syncLocalOnboardingToBackend, onSuccess: () => router.replace('/(tabs)') });
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const social = useSocialLogin('onboarding');

  // Email form state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);

  useEffect(() => {
    analytics.track('signup_screen_viewed');
    let active = true;
    void AuthService.isAuthenticated().then(value => { if (active) setHasSession(value); }).catch(() => { if (active) setHasSession(false); });
    return () => { active = false; };
  }, []);

  const busy = register.isPending || finish.isPending || social.isPending;

  const finishAndGoHome = () => finish.mutateAsync();

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
      const auth = await register.mutateAsync({ email: trimmedEmail, username: trimmedUser, password });
      await AuthService.saveAuthResponse(auth);
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
    <CloudScreen>
      <KeyboardLift>
        <View className="flex-row items-center gap-3 px-5 pb-1 pt-3">
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/onboarding/reminder-time')} accessibilityRole="button" accessibilityLabel={t('onboarding.common.back')} className="h-11 w-11 items-center justify-center rounded-full bg-white"><ArrowLeft size={23} color="#1782AD" /></Pressable>
          <View className="h-3 flex-1 rounded-full bg-[#12B4FB]" />
          <Text className="font-nunito-extrabold text-xs text-[#217FA5]">6/6</Text>
        </View>
        <ScrollView ref={keyboardScroll.ref} onLayout={keyboardScroll.reveal} onContentSizeChange={keyboardScroll.reveal} className="flex-1" contentContainerClassName="px-5 pb-5 pt-2" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text accessibilityRole="header" className="mt-3 font-nunito-black text-[28px] leading-8 text-[#142A35]">{t(hasSession ? 'onboarding.signup.connected_title' : 'onboarding.signup.title')}</Text>
          <Text className="mt-2 font-nunito-semibold text-[15px] leading-[21px] text-[#496779]">{t(hasSession ? 'onboarding.signup.connected_subtitle' : 'onboarding.signup.subtitle')}</Text>
          <View className="items-center pt-2"><CloudBear signup /></View>
          {hasSession === null ? <ActivityIndicator color="#12B4FB" /> : hasSession ? (
            <View className="gap-3 rounded-[28px] bg-white/90 p-4">
              <Text className="text-center font-nunito-semibold text-base leading-6 text-[#496779]">{t('onboarding.signup.connected_body')}</Text>
              <CloudButton label={t('onboarding.signup.connected_continue')} onPress={() => finish.mutate()} loading={finish.isPending} testID="onboarding-finish" />
              {finish.isError && <Text accessibilityRole="alert" className="text-center font-nunito-semibold text-sm text-[#B34D4D]">{t('onboarding.signup.toast_failed')}</Text>}
            </View>
          ) : <>
          <View className="gap-3 rounded-[28px] bg-white/75 p-4">
            <TextInput onFocus={keyboardScroll.reveal} className="min-h-14 rounded-2xl border-2 border-[#C9EDFF] bg-white px-4 py-3 font-nunito-semibold text-base text-[#142A35]" placeholder={t('onboarding.signup.email.username_placeholder')} accessibilityLabel={t('onboarding.signup.email.username_placeholder')} placeholderTextColor="#648495" value={username} onChangeText={setUsername} autoCapitalize="none" autoComplete="username" editable={!busy} testID="signup-username" />
            <TextInput onFocus={keyboardScroll.reveal} className="min-h-14 rounded-2xl border-2 border-[#C9EDFF] bg-white px-4 py-3 font-nunito-semibold text-base text-[#142A35]" placeholder={t('onboarding.signup.email.email_placeholder')} accessibilityLabel={t('onboarding.signup.email.email_placeholder')} placeholderTextColor="#648495" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!busy} testID="signup-email" />
            <View className="min-h-14 flex-row items-center rounded-2xl border-2 border-[#C9EDFF] bg-white">
              <TextInput onFocus={keyboardScroll.reveal} className="min-h-14 flex-1 px-4 py-3 font-nunito-semibold text-base text-[#142A35]" placeholder={t('onboarding.signup.email.password_placeholder')} accessibilityLabel={t('onboarding.signup.email.password_placeholder')} placeholderTextColor="#648495" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} autoCapitalize="none" autoComplete="password-new" editable={!busy} testID="signup-password" />
              <Pressable onPress={() => setPasswordVisible(!passwordVisible)} accessibilityRole="button" accessibilityLabel={passwordVisible ? t('onboarding.signup.hide_password') : t('onboarding.signup.show_password')} className="h-12 w-12 items-center justify-center">{passwordVisible ? <EyeOff size={22} color="#648495" /> : <Eye size={22} color="#648495" />}</Pressable>
            </View>
            {emailErr && <Text accessibilityRole="alert" className="font-nunito-semibold text-sm text-[#B34D4D]">{emailErr}</Text>}
            <CloudButton label={busy ? t('onboarding.signup.email.submitting') : t('onboarding.signup.email.submit')} onPress={() => void onEmailSubmit()} loading={busy} testID="signup-submit" />
          </View>
          <SocialAuthButtons disabled={busy} pending={social.isPending ? social.variables : undefined} onPress={social.start} />
          <Pressable onPress={onLogin} accessibilityRole="button" className="min-h-12 items-center justify-center py-3"><Text className="text-center font-nunito-extrabold text-sm text-[#078FC8]">{t('onboarding.signup.login_link')}</Text></Pressable>
          </>}
          <Text className="text-center font-nunito-medium text-xs leading-4 text-[#58788A]">{t('onboarding.signup.terms')}</Text>
        </ScrollView>
      </KeyboardLift>
    </CloudScreen>
  );
}
