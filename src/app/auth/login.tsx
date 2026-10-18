import { useKeyboardScroll } from '@/hooks/use-keyboard-scroll';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { KeyboardLift } from '@/components/keyboard-lift';
import { CloudButton, CloudScreen } from '@/components/onboarding/CloudScreen';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { useSocialLogin } from '@/hooks/use-social-login';
import { useLogin } from '@/hooks/use-auth';
import type { LoginRequest } from '@/types/api';

export default function LoginScreen() {
  const { t } = useTranslation();
  const keyboardScroll = useKeyboardScroll();
  const login = useLogin();
  const social = useSocialLogin('login');
  const busy = login.isPending || social.isPending;
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>({ defaultValues: { email: '', password: '' } });
  return (
    <CloudScreen>
      <KeyboardLift>
        <ScrollView ref={keyboardScroll.ref} onLayout={keyboardScroll.reveal} onContentSizeChange={keyboardScroll.reveal} className="flex-1" contentContainerClassName="grow items-center px-4 pb-4 pt-3" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-md items-center">
            <Text className="mb-1 text-center font-nunito-black text-[28px] text-[#09527F]">LingoIQ</Text>
            <Image source={require('../../../assets/onboarding-cloud/login-bear.png')} resizeMode="contain" className="z-10 -mb-7 h-56 w-80" accessible={false} />
            <View className="w-full rounded-[30px] bg-white px-5 pb-3 pt-7">
              <Text accessibilityRole="header" className="font-nunito-black text-[28px] leading-9 text-[#142A35]">{t('auth.login.welcome_back')}</Text>
              <Text className="mt-1 font-nunito-semibold text-[15px] leading-5 text-[#496779]">{t('auth.login.login_subtitle')}</Text>
              <View className="mt-5 gap-3">
                <Controller control={control} name="email" rules={{ required: t('auth.login.email_required'), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('auth.login.email_invalid') } }} render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`min-h-14 flex-row items-center gap-3 rounded-[14px] border-2 bg-white px-3 ${errors.email ? 'border-[#EB8787]' : 'border-[#C9EDFF]'}`}>
                    <Mail size={24} color="#15ADF1" />
                    <TextInput onFocus={keyboardScroll.reveal} testID="login-email" accessibilityLabel="Email" className="min-h-14 min-w-0 flex-1 py-3 font-nunito-semibold text-base text-[#142A35]" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Email" placeholderTextColor="#648495" keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!busy} />
                  </View>
                )} />
                {errors.email && <Text accessibilityRole="alert" className="font-nunito-semibold text-xs text-[#B34D4D]">{errors.email.message}</Text>}
                <Controller control={control} name="password" rules={{ required: t('auth.login.password_required'), minLength: { value: 6, message: t('auth.login.password_min') } }} render={({ field: { onChange, onBlur, value } }) => (
                  <View className={`min-h-14 flex-row items-center gap-3 rounded-[14px] border-2 bg-white pl-3 ${errors.password ? 'border-[#EB8787]' : 'border-[#C9EDFF]'}`}>
                    <LockKeyhole size={24} color="#648495" />
                    <TextInput onFocus={keyboardScroll.reveal} testID="login-password" accessibilityLabel={t('auth.login.password_hint')} className="min-h-14 min-w-0 flex-1 py-3 font-nunito-semibold text-base text-[#142A35]" value={value} onBlur={onBlur} onChangeText={onChange} placeholder={t('auth.login.password_hint')} placeholderTextColor="#648495" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password" editable={!busy} />
                    <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityRole="button" accessibilityLabel={showPassword ? t('onboarding.signup.hide_password') : t('onboarding.signup.show_password')} className="h-12 w-12 items-center justify-center">{showPassword ? <EyeOff size={23} color="#648495" /> : <Eye size={23} color="#648495" />}</Pressable>
                  </View>
                )} />
                {errors.password && <Text accessibilityRole="alert" className="font-nunito-semibold text-xs text-[#B34D4D]">{errors.password.message}</Text>}
              </View>
              <Pressable onPress={() => Alert.alert(t('auth.login.forgot_password_title'), t('auth.login.forgot_password_body'))} accessibilityRole="button" className="min-h-12 items-end justify-center py-2"><Text className="font-nunito-semibold text-sm text-[#078FC8] underline">{t('auth.login.forgot_password')}</Text></Pressable>
              <CloudButton label={t('auth.login.login_now')} loading={login.isPending} disabled={busy} onPress={handleSubmit(data => login.mutate(data))} testID="login-submit" />
              <SocialAuthButtons disabled={busy} pending={social.isPending ? social.variables : undefined} onPress={social.start} />
              <Pressable onPress={() => router.replace('/onboarding/welcome')} accessibilityRole="button" className="min-h-14 items-center justify-center px-1 pt-3"><Text className="text-center font-nunito-semibold text-sm text-[#648495]">{t('auth.login.no_account')}{' '}<Text className="text-[#078FC8] underline">{t('auth.login.start_learning')}</Text></Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardLift>
    </CloudScreen>
  );
}
