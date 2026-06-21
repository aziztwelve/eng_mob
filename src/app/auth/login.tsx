import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLogin } from '@/hooks/use-auth';
import { useForm, Controller } from 'react-hook-form';
import { LoginRequest } from '@/types/api';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const login = useLogin();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginRequest) => { login.mutate(data); };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      className="flex-1"
    >
      <LinearGradient
        colors={["#2E0A4A", "#6A1252", "#A8243F", "#C9521F"]}
        locations={[0, 0.38, 0.7, 0.96]}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="max-w-md w-full mx-auto">
            {/* Header */}
            <View className="mb-8 items-center">
              <View
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: '#FF6BBF',
                  justifyContent: 'center', alignItems: 'center',
                  marginBottom: 16,
                  shadowColor: '#FF6BBF',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.5,
                  shadowRadius: 14,
                  elevation: 10,
                }}
              >
                <Text style={{ fontSize: 36 }}>🍭</Text>
              </View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFDF5E', letterSpacing: -0.5 }}>
                LingoIQ
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 4 }}>
                {t('auth.login.title')}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                {t('auth.login.subtitle')}
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 16 }}>
              {/* Email */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
                  {t('auth.login.email_label')}
                </Text>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: t('auth.login.email_required'),
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: t('auth.login.email_invalid') },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderWidth: 1.5,
                        borderColor: errors.email ? '#FF4B7E' : 'rgba(255,255,255,0.3)',
                        borderRadius: 20,
                        paddingHorizontal: 18,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: '#fff',
                      }}
                      placeholder={t('auth.login.email_placeholder')}
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  )}
                />
                {errors.email && (
                  <Text style={{ color: '#FF7FAA', fontSize: 12, marginTop: 4 }}>{errors.email.message}</Text>
                )}
              </View>

              {/* Password */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
                  {t('auth.login.password_label')}
                </Text>
                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: t('auth.login.password_required'),
                    minLength: { value: 6, message: t('auth.login.password_min') },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderWidth: 1.5,
                        borderColor: errors.password ? '#FF4B7E' : 'rgba(255,255,255,0.3)',
                        borderRadius: 20,
                        paddingHorizontal: 18,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: '#fff',
                      }}
                      placeholder={t('auth.login.password_placeholder')}
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                  )}
                />
                {errors.password && (
                  <Text style={{ color: '#FF7FAA', fontSize: 12, marginTop: 4 }}>{errors.password.message}</Text>
                )}
              </View>

              {/* Login Button */}
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={login.isPending}
                style={{
                  borderRadius: 28,
                  paddingVertical: 16,
                  marginTop: 8,
                  backgroundColor: '#FF6BBF',
                  shadowColor: '#FF6BBF',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: login.isPending ? 0 : 0.5,
                  shadowRadius: 12,
                  elevation: 8,
                  opacity: login.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
                </Text>
              </Pressable>

              {/* Register Link */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{t('auth.login.no_account')}</Text>
                <Link href="/auth/register" asChild>
                  <Pressable>
                    <Text style={{ color: '#FFDF5E', fontWeight: '700' }}>{t('auth.login.signup_link')}</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
