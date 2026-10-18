import { KeyboardLift } from '@/components/keyboard-lift';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Check, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { FigmaSvg } from '@/components/figma/FigmaSvg';
import { AuthClouds } from '@/components/auth/AuthClouds';
import { useRegister } from '@/hooks/use-auth';
import { RegisterRequest } from '@/types/api';

const userIcon = require('../../../assets/figma/register/user-profile.svg');
const mailIcon = require('../../../assets/figma/register/mail-profile.svg');
const chevronIcon = require('../../../assets/figma/register/chevron-profile.svg');
const backIcon = require('../../../assets/figma/register/back-profile.svg');
const lockIcon = require('../../../assets/figma/mieo-login/lock-364-15127-figma.svg');
const eyeIcon = require('../../../assets/figma/mieo-login/eye-364-15127-figma.svg');

// Hard (non-blurred) offset shadows from the Figma inputs; NativeWind has no classes for them.
const dimShadow = { shadowColor: '#ADB5BA', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
const focusShadow = { shadowColor: '#1AB3FF', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
const primaryShadow = { shadowColor: '#3E8CB2', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

type FieldName = 'username' | 'email' | 'password' | 'age';
type Gender = 'female' | 'male';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const register = useRegister();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 375);
  const [focused, setFocused] = useState<FieldName | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Gender and age are shown in the design, but the register API does not accept them yet.
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState('8');
  const [genderOpen, setGenderOpen] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterRequest>({
    defaultValues: { username: '', email: '', password: '' },
  });

  const onSubmit = (data: RegisterRequest) => { register.mutate(data); };

  const fieldClass = (name: FieldName, hasError: boolean) =>
    `h-[52px] flex-row items-center gap-4 px-3 rounded-xl border-[1.5px] bg-mieo-surface ${
      hasError ? 'border-mieo-error' : focused === name ? 'border-mieo-primary' : 'border-mieo-dim'
    }`;

  return (
    <KeyboardLift>
      <StatusBar style="dark" />
      <View className="flex-1 overflow-hidden bg-mieo-surface">
        <LinearGradient colors={['#B3E6FF', '#FFFFFF', '#FFFFFF']} locations={[0, 0.42365, 1]} style={StyleSheet.absoluteFill} />
        <AuthClouds />

        <ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center', paddingTop: 113, paddingBottom: 32, width: contentWidth }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="justify-center items-center gap-7" style={{ minHeight: 586, width: contentWidth }}>
            <View className="items-center px-4">
              <Text className="font-nunito-black text-[32px] leading-10 text-center text-mieo-heading">{t('auth.register.profile_title')}</Text>
              <Text className="font-nunito-medium text-base leading-5 tracking-wide text-center text-mieo-heading px-4">{t('auth.register.profile_subtitle')}</Text>
            </View>

            <View className="gap-4 items-center" style={{ width: 345 }}>
              {/* Name (API: username) */}
              <Controller control={control} name="username" rules={{ required: t('auth.register.username_required'), minLength: { value: 3, message: t('auth.register.username_min') } }} render={({ field: { onChange, onBlur, value } }) => (
                <View style={[{ width: 345 }, focused === 'username' ? focusShadow : dimShadow]}>
                  <View style={{ width: 345 }} className={fieldClass('username', !!errors.username)}>
                    <FigmaSvg source={userIcon} width={24} height={24} />
                    <TextInput className="flex-1 min-w-0 p-0 font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading" value={value} onChangeText={onChange} onFocus={() => setFocused('username')} onBlur={() => { setFocused(null); onBlur(); }} placeholder={t('auth.register.username_placeholder')} placeholderTextColor="#171A1C" autoCapitalize="none" autoComplete="username" />
                  </View>
                  {errors.username && <Text className="font-nunito-semibold text-xs mt-1 text-mieo-error-text">{errors.username.message}</Text>}
                </View>
              )} />

              {/* Email */}
              <Controller control={control} name="email" rules={{ required: t('auth.register.email_required'), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('auth.register.email_invalid') } }} render={({ field: { onChange, onBlur, value } }) => (
                <View style={[{ width: 345 }, focused === 'email' ? focusShadow : dimShadow]}>
                  <View style={{ width: 345 }} className={fieldClass('email', !!errors.email)}>
                    <FigmaSvg source={mailIcon} width={24} height={24} />
                    <TextInput className="flex-1 min-w-0 p-0 font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading" value={value} onChangeText={onChange} onFocus={() => setFocused('email')} onBlur={() => { setFocused(null); onBlur(); }} placeholder={t('auth.register.email_placeholder')} placeholderTextColor="#171A1C" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                  </View>
                  {errors.email && <Text className="font-nunito-semibold text-xs mt-1 text-mieo-error-text">{errors.email.message}</Text>}
                </View>
              )} />

              {/* Password (API requires it; not in the Figma frame, styled like the other fields) */}
              <Controller control={control} name="password" rules={{ required: t('auth.register.password_required'), minLength: { value: 8, message: t('auth.register.password_min') } }} render={({ field: { onChange, onBlur, value } }) => (
                <View style={[{ width: 345 }, focused === 'password' ? focusShadow : dimShadow]}>
                  <View style={{ width: 345 }} className={fieldClass('password', !!errors.password)}>
                    <FigmaSvg source={lockIcon} width={24} height={24} />
                    <TextInput className="flex-1 min-w-0 p-0 font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading" value={value} onChangeText={onChange} onFocus={() => setFocused('password')} onBlur={() => { setFocused(null); onBlur(); }} placeholder={t('auth.register.password_placeholder')} placeholderTextColor="#5D686F" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password-new" />
                    <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOff size={24} color="#5D686F" /> : <FigmaSvg source={eyeIcon} width={24} height={24} />}
                    </Pressable>
                  </View>
                  {errors.password && <Text className="font-nunito-semibold text-xs mt-1 text-mieo-error-text">{errors.password.message}</Text>}
                </View>
              )} />

              {/* Gender and age row */}
              <View className="flex-row items-center gap-4" style={{ width: 345 }}>
                <View className="flex-row items-center gap-4">
                  <Text className="font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading">{t('auth.register.gender_label')}</Text>
                  <Pressable accessibilityRole="button" onPress={() => setGenderOpen(true)} style={dimShadow} className="h-[52px] w-[150px] flex-row items-center gap-2 px-3 rounded-xl border-[1.5px] border-mieo-dim bg-mieo-surface">
                    <Text className="flex-1 font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading">{gender === 'female' ? t('auth.register.gender_female') : t('auth.register.gender_male')}</Text>
                    <FigmaSvg source={chevronIcon} width={24} height={24} />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-4">
                  <Text className="font-nunito-semibold text-sm tracking-[0.1px] text-mieo-heading">{t('auth.register.age_label')}</Text>
                  <TextInput value={age} onChangeText={setAge} onFocus={() => setFocused('age')} onBlur={() => setFocused(null)} keyboardType="number-pad" maxLength={3} style={focused === 'age' ? focusShadow : dimShadow} className={`h-[52px] w-16 text-center font-nunito-semibold text-sm text-mieo-heading rounded-xl border-[1.5px] bg-mieo-surface ${focused === 'age' ? 'border-mieo-primary' : 'border-mieo-dim'}`} />
                </View>
              </View>
            </View>

            {/* Submit */}
            <View className="w-full px-4 py-6">
              <Pressable accessibilityRole="button" onPress={handleSubmit(onSubmit)} disabled={register.isPending} style={[primaryShadow, register.isPending && styles.disabled]} className="min-h-12 items-center justify-center overflow-hidden px-6 py-3.5 rounded-2xl bg-mieo-primary active:opacity-80">
                <View pointerEvents="none" style={[styles.sheenBar, { left: -12, top: 13, height: 15, opacity: 0.3 }]} />
                <View pointerEvents="none" style={[styles.sheenBar, { left: 2, top: 21, height: 5, opacity: 0.2 }]} />
                <Text className="font-nunito-extrabold text-base tracking-[0.15px] text-[#F5FCFF]">{register.isPending ? t('auth.register.submitting') : t('auth.register.submit_button')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Back */}
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={dimShadow} className="absolute left-4 top-[50px] p-3 rounded-xl border-[1.5px] border-mieo-stroke bg-mieo-surface">
          <FigmaSvg source={backIcon} width={24} height={24} />
        </Pressable>
      </View>

      {/* Gender picker: full-screen list */}
      <Modal visible={genderOpen} animationType="slide" onRequestClose={() => setGenderOpen(false)}>
        <View className="flex-1 bg-mieo-bg">
          <View className="flex-row items-center justify-center px-4 pt-16 pb-4">
            <Text className="font-nunito-black text-2xl text-mieo-heading">{t('auth.register.gender_label')}</Text>
          </View>
          {(['female', 'male'] as Gender[]).map((option) => {
            const selected = gender === option;
            return (
              <Pressable key={option} accessibilityRole="button" onPress={() => { setGender(option); setGenderOpen(false); }} className={`mx-4 mb-4 h-[52px] flex-row items-center px-4 rounded-xl border-[1.5px] bg-mieo-surface ${selected ? 'border-mieo-primary' : 'border-mieo-dim'}`} style={selected ? focusShadow : dimShadow}>
                <Text className="flex-1 font-nunito-semibold text-base text-mieo-heading">{option === 'female' ? t('auth.register.gender_female') : t('auth.register.gender_male')}</Text>
                {selected && <Check size={20} color="#59C8FF" />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </KeyboardLift>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.6 },
  sheenBar: { position: 'absolute', width: 88, backgroundColor: '#FFFFFF', transform: [{ rotate: '119.15deg' }] },
});
