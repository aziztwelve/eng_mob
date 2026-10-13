import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { FigmaSvg } from '@/components/figma/FigmaSvg';
import { useLogin } from '@/hooks/use-auth';
import { signInWithApple, signInWithGoogle } from '@/lib/oauth';
import { LoginRequest } from '@/types/api';

const cloudLeftTop = require('../../../assets/figma/mieo-login/118-364-14963-svg.svg');
const cloudRightTop = require('../../../assets/figma/mieo-login/120-364-14970-svg.svg');
const cloudLeftMid = require('../../../assets/figma/mieo-login/122-364-14977-svg.svg');
const cloudRightMid = require('../../../assets/figma/mieo-login/124-364-14985-svg.svg');
const cloudTop = require('../../../assets/figma/mieo-login/126-364-14992-svg.svg');
const cloudBottomRight = require('../../../assets/figma/mieo-login/128-364-14999-svg.svg');
const googleIcon = require('../../../assets/figma/mieo-login/113-366-15242-svg.svg');
const appleIcon = require('../../../assets/figma/mieo-login/115-366-15246-svg.svg');
const mailBody = require('../../../assets/figma/mieo-login/084-364-15128-svg.svg');
const mailFold = require('../../../assets/figma/mieo-login/083-364-15128-svg.svg');
const lockBody = require('../../../assets/figma/mieo-login/093-364-15127-svg.svg');
const lockShackle = require('../../../assets/figma/mieo-login/099-364-15127-svg.svg');
const lockKeyhole = require('../../../assets/figma/mieo-login/095-364-15127-svg.svg');
const eyeTop = require('../../../assets/figma/mieo-login/096-364-15127-svg.svg');
const eyeBottom = require('../../../assets/figma/mieo-login/097-364-15127-svg.svg');

// Figma uses hard (non-blurred) offset shadows; NativeWind has no classes for them.
const primaryShadow = { shadowColor: '#3E8CB2', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 4 };
const fieldShadow = { shadowColor: '#1AB3FF', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
const socialShadow = { shadowColor: '#E3E6E8', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

function MailIcon() {
  return <View className="w-6 h-6 shrink-0"><FigmaSvg source={mailBody} width={20.64} height={18.72} style={styles.iconLayer} /><FigmaSvg source={mailFold} width={19.12} height={9.1} style={[styles.iconLayer, { top: 4 }]} /></View>;
}
function LockIcon() {
  return <View className="w-6 h-6 shrink-0"><FigmaSvg source={lockBody} width={18.72} height={13.93} style={[styles.iconLayer, { top: 8 }]} /><FigmaSvg source={lockShackle} width={11.04} height={8.16} style={[styles.iconLayer, { left: 6, top: 1 }]} /><FigmaSvg source={lockKeyhole} width={9.5} height={9.5} style={[styles.iconLayer, { left: 7.25, top: 10 }]} /></View>;
}
function EyeIcon() {
  return <View className="w-6 h-6 shrink-0"><FigmaSvg source={eyeTop} width={21.5} height={9.5} style={styles.iconLayer} /><FigmaSvg source={eyeBottom} width={21.5} height={9.5} style={styles.iconLayer} /><FigmaSvg source={lockKeyhole} width={9.5} height={9.5} style={[styles.iconLayer, { left: 6, top: 5 }]} /></View>;
}
function CloudDecoration() {
  // Absolute positions come from the Figma frame, so they stay inline.
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <FigmaSvg source={cloudLeftTop} width={200.4} height={96.5} style={styles.cloudLeftTop} />
    <FigmaSvg source={cloudRightTop} width={200.4} height={96.5} style={styles.cloudRightTop} />
    <FigmaSvg source={cloudLeftMid} width={205.8} height={72.3} style={styles.cloudLeftMid} />
    <FigmaSvg source={cloudRightMid} width={172.7} height={53.3} style={styles.cloudRightMid} />
    <FigmaSvg source={cloudTop} width={143.9} height={54.8} style={styles.cloudTop} />
    <FigmaSvg source={cloudBottomRight} width={143.9} height={54.8} style={styles.cloudBottomRight} />
  </View>;
}

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const contentWidth = Math.min(width, 375);
  const sidePadding = width < 375 ? 16 : 0;
  const formWidth = contentWidth - sidePadding * 2;
  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>({ defaultValues: { email: '', password: '' } });
  const showOAuthMessage = async (provider: 'google' | 'apple') => {
    const result = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
    if (!result.ok && result.reason !== 'cancelled') Toast.show({ type: 'info', text1: provider === 'google' ? t('auth.login.oauth_google_title') : t('auth.login.oauth_apple_title'), text2: result.message ?? t('auth.login.oauth_not_configured') });
  };

  return <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
    <StatusBar style="dark" />
    <View className="flex-1 overflow-hidden bg-mieo-surface">
      <LinearGradient colors={['#B3E6FF', '#FFFFFF', '#FFFFFF']} locations={[0, 0.42365, 1]} style={StyleSheet.absoluteFill} />
      <CloudDecoration />
      <ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center', paddingTop: 113, paddingBottom: 32, width: contentWidth }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="justify-center gap-7" style={{ minHeight: 586, width: contentWidth, paddingHorizontal: sidePadding }}>
          <View className="h-20 items-center justify-center">
            <Text className="font-nunito-black text-[32px] leading-10 text-center text-mieo-heading">{t('auth.login.welcome_back')}</Text>
            <Text className="font-nunito-medium text-base leading-5 tracking-wide text-center text-mieo-heading px-4">{t('auth.login.login_subtitle')}</Text>
          </View>

          <View className="gap-4">
            <Controller control={control} name="email" rules={{ required: t('auth.login.email_required'), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('auth.login.email_invalid') } }} render={({ field: { onChange, onBlur, value } }) => <View style={[{ width: formWidth }, fieldShadow]} className={`h-[52px] flex-row items-center gap-4 px-3 rounded-xl border-[1.5px] bg-mieo-surface ${errors.email ? 'border-mieo-error' : 'border-mieo-primary'}`}><MailIcon /><TextInput className="flex-1 min-w-0 p-0 font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="jennyfrost@gmail.com" placeholderTextColor="#171A1C" keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>} />
            <Controller control={control} name="password" rules={{ required: t('auth.login.password_required'), minLength: { value: 6, message: t('auth.login.password_min') } }} render={({ field: { onChange, onBlur, value } }) => <View style={[{ width: formWidth }, fieldShadow, { shadowColor: '#E3E6E8' }]} className={`h-[52px] flex-row items-center gap-4 px-3 rounded-xl border-[1.5px] bg-mieo-surface ${errors.password ? 'border-mieo-error' : 'border-mieo-stroke'}`}><LockIcon /><TextInput className="flex-1 min-w-0 p-0 font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading" value={value} onBlur={onBlur} onChangeText={onChange} placeholder={t('auth.login.password_hint')} placeholderTextColor="#5D686F" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password" /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setShowPassword((v) => !v)}><EyeIcon /></Pressable></View>} />
            {errors.email && <Text className="font-nunito-semibold text-xs -mt-2 text-mieo-error-text">{errors.email.message}</Text>}
            {errors.password && <Text className="font-nunito-semibold text-xs -mt-2 text-mieo-error-text">{errors.password.message}</Text>}
            <Pressable accessibilityRole="button" onPress={() => Alert.alert(t('auth.login.forgot_password_title'), t('auth.login.forgot_password_body'))} className="self-stretch items-end">
              <Text className="font-nunito-semibold text-sm tracking-[0.1px] underline text-mieo-heading">{t('auth.login.forgot_password')}</Text>
            </Pressable>
          </View>

          <View className="w-full px-4 py-6">
            <Pressable accessibilityRole="button" onPress={handleSubmit((data) => login.mutate(data))} disabled={login.isPending} style={[primaryShadow, login.isPending && styles.disabled]} className="min-h-12 items-center justify-center overflow-hidden px-6 py-3.5 rounded-2xl bg-mieo-primary active:opacity-80">
              {/* Figma sheen: two translucent bars rotated 119°, clipped to the button */}
              <View pointerEvents="none" style={[styles.sheenBar, { left: -12, top: 13, height: 15, opacity: 0.3 }]} />
              <View pointerEvents="none" style={[styles.sheenBar, { left: 2, top: 21, height: 5, opacity: 0.2 }]} />
              <Text className="font-nunito-extrabold text-base tracking-[0.15px] text-[#F5FCFF]">{login.isPending ? t('auth.login.submitting') : t('auth.login.login_now')}</Text>
            </Pressable>
          </View>

          <View className="w-full gap-[18px] px-4 py-6">
            <View className="w-full flex-row items-center gap-4">
              <View className="flex-1 h-px bg-mieo-stroke" />
              <Text className="font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading">{t('auth.login.or_continue_with')}</Text>
              <View className="flex-1 h-px bg-mieo-stroke" />
            </View>
            <View className="w-full flex-row gap-4">
              <Pressable accessibilityRole="button" onPress={() => void showOAuthMessage('google')} style={socialShadow} className="flex-1 min-h-[52px] flex-row items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl border-2 border-mieo-stroke bg-mieo-surface active:opacity-80"><FigmaSvg source={googleIcon} width={23} height={23} /><Text className="font-nunito-semibold text-sm tracking-[0.1px] text-mieo-body">{t('auth.login.google')}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void showOAuthMessage('apple')} style={socialShadow} className="flex-1 min-h-[52px] flex-row items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl border-2 border-mieo-stroke bg-mieo-surface active:opacity-80"><FigmaSvg source={appleIcon} width={20} height={24} /><Text className="font-nunito-semibold text-sm tracking-[0.1px] text-mieo-body">{t('auth.login.apple')}</Text></Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  iconLayer: { position: 'absolute', left: 0, top: 0 },
  disabled: { opacity: 0.6 },
  sheenBar: { position: 'absolute', width: 88, backgroundColor: '#FFFFFF', transform: [{ rotate: '119.15deg' }] },
  cloudLeftTop: { position: 'absolute', left: -85, top: -113 },
  cloudRightTop: { position: 'absolute', left: 155, top: -23 },
  cloudLeftMid: { position: 'absolute', left: -73, top: 21 },
  cloudRightMid: { position: 'absolute', left: 287, top: -85 },
  cloudTop: { position: 'absolute', left: 161, top: -140 },
  cloudBottomRight: { position: 'absolute', left: 281, top: 110 },
});
