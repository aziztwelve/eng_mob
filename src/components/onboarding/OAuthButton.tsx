import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * <OAuthButton> — кнопка "Continue with Google/Apple".
 *
 * Для Apple используем чёрный фон / белый текст. Для Google — белый фон /
 * чёрный текст. Disabled — opacity 0.6.
 */
export interface OAuthButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Override label. По умолчанию — «Продолжить с Google/Apple». */
  label?: string;
}

export function OAuthButton({
  provider,
  onPress,
  loading,
  disabled,
  label,
}: OAuthButtonProps) {
  const { t } = useTranslation();
  const isApple = provider === 'apple';
  const text =
    label ??
    (isApple
      ? t('onboarding.signup.oauth.apple')
      : t('onboarding.signup.oauth.google'));
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`rounded-2xl py-4 px-4 flex-row items-center justify-center gap-3 active:opacity-80 ${
        isApple ? 'bg-foreground' : 'bg-card border-2 border-border'
      } ${isDisabled ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isApple ? '#1a1c26' : '#ffffff'} />
      ) : (
        <>
          <View className="w-5 h-5 items-center justify-center">
            <Text className="text-base font-black">
              {isApple ? '\uF8FF' : 'G'}
            </Text>
          </View>
          <Text
            className={`font-black text-base ${
              isApple ? 'text-background' : 'text-foreground'
            }`}
          >
            {text}
          </Text>
        </>
      )}
    </Pressable>
  );
}
