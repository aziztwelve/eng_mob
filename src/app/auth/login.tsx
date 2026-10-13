import React, { useMemo, useState } from 'react';
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

function MailIcon() {
  return <View style={styles.icon24}><FigmaSvg source={mailBody} width={20.64} height={18.72} style={styles.iconLayer} /><FigmaSvg source={mailFold} width={19.12} height={9.1} style={[styles.iconLayer, { top: 4 }]} /></View>;
}
function LockIcon() {
  return <View style={styles.icon24}><FigmaSvg source={lockBody} width={18.72} height={13.93} style={[styles.iconLayer, { top: 8 }]} /><FigmaSvg source={lockShackle} width={11.04} height={8.16} style={[styles.iconLayer, { left: 6, top: 1 }]} /><FigmaSvg source={lockKeyhole} width={9.5} height={9.5} style={[styles.iconLayer, { left: 7.25, top: 10 }]} /></View>;
}
function EyeIcon() {
  return <View style={styles.eyeIcon}><FigmaSvg source={eyeTop} width={21.5} height={9.5} style={styles.iconLayer} /><FigmaSvg source={eyeBottom} width={21.5} height={9.5} style={styles.iconLayer} /><FigmaSvg source={lockKeyhole} width={9.5} height={9.5} style={[styles.iconLayer, { left: 6, top: 5 }]} /></View>;
}
function CloudDecoration() {
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
  const inputStyle = useMemo(() => [styles.input, { width: formWidth }], [formWidth]);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>({ defaultValues: { email: '', password: '' } });
  const showOAuthMessage = async (provider: 'google' | 'apple') => {
    const result = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
    if (!result.ok && result.reason !== 'cancelled') Toast.show({ type: 'info', text1: provider === 'google' ? 'Google Sign-In' : 'Apple Sign-In', text2: result.message ?? 'This provider is not configured in this build yet.' });
  };

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
    <StatusBar style="dark" />
    <LinearGradient colors={['#B3E6FF', '#FFFFFF', '#FFFFFF']} locations={[0, 0.42365, 1]} style={styles.screen}>
      <CloudDecoration />
      <ScrollView style={styles.flex} contentContainerStyle={[styles.scrollContent, { width: contentWidth }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.container, { width: contentWidth, paddingHorizontal: sidePadding }]}>
          <View style={styles.heading}><Text style={styles.title}>Welcome Back</Text><Text style={styles.subtitle}>Please login with your Account by entering your valid credentials</Text></View>
          <View style={styles.inputFields}>
            <Controller control={control} name="email" rules={{ required: t('auth.login.email_required'), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('auth.login.email_invalid') } }} render={({ field: { onChange, onBlur, value } }) => <View style={[inputStyle, styles.field, errors.email && styles.fieldError]}><MailIcon /><TextInput style={styles.textInput} value={value} onBlur={onBlur} onChangeText={onChange} placeholder="jennyfrost@gmail.com" placeholderTextColor="#171A1C" keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>} />
            <Controller control={control} name="password" rules={{ required: t('auth.login.password_required'), minLength: { value: 6, message: t('auth.login.password_min') } }} render={({ field: { onChange, onBlur, value } }) => <View style={[inputStyle, styles.field, styles.passwordField, errors.password && styles.fieldError]}><LockIcon /><TextInput style={styles.textInput} value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Password" placeholderTextColor="#5D686F" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password" /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setShowPassword((v) => !v)}><EyeIcon /></Pressable></View>} />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            <Pressable accessibilityRole="button" onPress={() => Alert.alert('Forgot Password?', 'Password recovery will be available soon.')} style={styles.forgot}><Text style={styles.forgotText}>Forgot Password .?</Text></Pressable>
          </View>
          <View style={styles.bottomAction}><Pressable accessibilityRole="button" onPress={handleSubmit((data) => login.mutate(data))} disabled={login.isPending} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, login.isPending && styles.disabled]}><Text style={styles.primaryButtonText}>{login.isPending ? t('auth.login.submitting') : 'Login Now'}</Text></Pressable></View>
          <View style={styles.social}>
            <View style={styles.socialHeading}><View style={styles.divider} /><Text style={styles.socialHeadingText}>Or Continue With</Text><View style={styles.divider} /></View>
            <View style={styles.socialList}>
              <Pressable accessibilityRole="button" onPress={() => void showOAuthMessage('google')} style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}><FigmaSvg source={googleIcon} width={23} height={23} /><Text style={styles.socialText}>Google</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => void showOAuthMessage('apple')} style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}><FigmaSvg source={appleIcon} width={20} height={24} /><Text style={styles.socialText}>Apple</Text></Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, overflow: 'hidden' },
  scrollContent: { alignItems: 'center', paddingTop: 113, paddingBottom: 32 },
  container: { minHeight: 586, justifyContent: 'center', gap: 28 },
  heading: { height: 80, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#171A1C', fontFamily: 'Nunito_900Black', fontSize: 32, lineHeight: 40, textAlign: 'center' },
  subtitle: { color: '#171A1C', fontFamily: 'Nunito_500Medium', fontSize: 16, lineHeight: 20, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 16 },
  inputFields: { gap: 16 },
  input: {},
  field: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#59C8FF', backgroundColor: '#FFFFFF', shadowColor: '#1AB3FF', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  passwordField: { borderColor: '#E3E6E8', shadowColor: '#E3E6E8' },
  fieldError: { borderColor: '#EB8787' },
  icon24: { width: 24, height: 24, position: 'relative', flexShrink: 0 },
  iconLayer: { position: 'absolute', left: 0, top: 0 },
  eyeIcon: { width: 24, height: 24, position: 'relative', flexShrink: 0 },
  textInput: { flex: 1, minWidth: 0, padding: 0, color: '#171A1C', fontFamily: 'Nunito_600SemiBold', fontSize: 14, letterSpacing: 0.1 },
  errorText: { color: '#B34D4D', fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: -8 },
  forgot: { alignSelf: 'stretch', alignItems: 'flex-end' },
  forgotText: { color: '#171A1C', fontFamily: 'Nunito_600SemiBold', fontSize: 14, letterSpacing: 0.1, textDecorationLine: 'underline' },
  bottomAction: { width: '100%', paddingHorizontal: 16, paddingVertical: 24 },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: '#59C8FF', shadowColor: '#3E8CB2', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  primaryButtonText: { color: '#F5FCFF', fontFamily: 'Nunito_800ExtraBold', fontSize: 16, letterSpacing: 0.15 },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.78 },
  social: { width: '100%', gap: 18, paddingHorizontal: 16, paddingVertical: 24 },
  socialHeading: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#E3E6E8' },
  socialHeadingText: { color: '#171A1C', fontFamily: 'Nunito_600SemiBold', fontSize: 14, letterSpacing: 0.1 },
  socialList: { width: '100%', flexDirection: 'row', gap: 16 },
  socialButton: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: '#E3E6E8', backgroundColor: '#FFFFFF', shadowColor: '#E3E6E8', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  socialText: { color: '#5D686F', fontFamily: 'Nunito_600SemiBold', fontSize: 14, letterSpacing: 0.1 },
  cloudLeftTop: { position: 'absolute', left: -85, top: -113 },
  cloudRightTop: { position: 'absolute', left: 155, top: -23 },
  cloudLeftMid: { position: 'absolute', left: -73, top: 21 },
  cloudRightMid: { position: 'absolute', left: 287, top: -85 },
  cloudTop: { position: 'absolute', left: 161, top: -140 },
  cloudBottomRight: { position: 'absolute', left: 281, top: 110 },
});
