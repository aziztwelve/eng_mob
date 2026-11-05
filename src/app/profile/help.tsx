import React from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { ProfileButton } from '@/components/profile/profile-ui';
import { PROFILE_LINKS } from '@/lib/profile-links';

export default function HelpScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const contact = async () => {
    try { await Linking.openURL(`mailto:${PROFILE_LINKS.supportEmail}?subject=${encodeURIComponent('LingoIQ support')}`); }
    catch { Toast.show({ type: 'error', text1: t('profile.open_failed'), text2: PROFILE_LINKS.supportEmail }); }
  };
  return <View className="flex-1 bg-mieo-bg">
    <Stack.Screen options={{ title: t('profile.help_title') }} />
    <ScrollView contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      {['recording', 'notifications', 'sync'].map(topic => <View key={topic} className="gap-3 rounded-2xl border border-[#C9EDFF] bg-mieo-surface p-5">
        <Text className="font-nunito-extrabold text-lg text-mieo-heading">{t(`profile.help_${topic}`)}</Text>
        <Text className="font-nunito-medium text-base text-mieo-body">{t(`profile.help_${topic}_body`)}</Text>
      </View>)}
      <ProfileButton label={t('profile.contact_support')} onPress={() => { void contact(); }} block />
      <Text selectable className="text-center font-nunito-semibold text-sm text-mieo-body">{PROFILE_LINKS.supportEmail}</Text>
    </ScrollView>
  </View>;
}
