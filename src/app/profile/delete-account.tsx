import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronLeft, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { AccountApi } from '@/lib/api-client';
import { AuthService } from '@/lib/auth-service';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await AccountApi.deleteAccount();
      await AuthService.logout();
      queryClient.clear();
      router.replace('/auth/login');
    } catch (error) {
      setIsDeleting(false);
      Toast.show({
        type: 'error',
        text1: t('profile.delete_failed'),
        text2: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <View className="flex-1 bg-mieo-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}>
        <View className="flex-row items-center gap-4">
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} className="rounded-xl border-[1.5px] border-mieo-stroke bg-mieo-surface p-3">
            <ChevronLeft size={24} color="#171A1C" />
          </Pressable>
          <Text className="font-nunito-extrabold text-[22px] text-mieo-heading">{t('profile.delete_account')}</Text>
        </View>

        <View className="mt-8 items-center rounded-3xl border-[1.5px] border-[#F0A5A5] bg-mieo-surface px-5 py-7">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#FFF0F0]">
            <AlertTriangle size={32} color="#E26A6A" />
          </View>
          <Text className="mt-5 text-center font-nunito-extrabold text-2xl text-mieo-heading">{t('profile.delete_title')}</Text>
          <Text className="mt-3 text-center font-nunito-medium text-base leading-6 text-mieo-body">{t('profile.delete_body')}</Text>

          {confirming && (
            <Text className="mt-4 text-center font-nunito-extrabold text-base text-[#C74949]">{t('profile.delete_confirm')}</Text>
          )}

          <Pressable
            disabled={isDeleting}
            onPress={() => {
              if (!confirming) setConfirming(true);
              else void deleteAccount();
            }}
            className="mt-6 min-h-[52px] w-full flex-row items-center justify-center gap-2 rounded-2xl bg-[#E26A6A] px-5"
          >
            {isDeleting ? <ActivityIndicator color="#fff" /> : <Trash2 size={19} color="#fff" />}
            <Text className="font-nunito-extrabold text-base text-white">
              {isDeleting ? t('profile.deleting') : confirming ? t('profile.delete_confirm_button') : t('profile.delete_account')}
            </Text>
          </Pressable>

          <Pressable disabled={isDeleting} onPress={() => router.back()} className="mt-4 px-5 py-3">
            <Text className="font-nunito-extrabold text-base text-mieo-body">{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
