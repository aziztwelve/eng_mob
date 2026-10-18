import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Check, ChevronLeft, ChevronRight, FileText, HelpCircle, Languages, LogOut, Moon, Shield, Trash2, User, Volume2 } from 'lucide-react-native';
import { useFxPreferences } from '@/lib/fx-prefs';
import { fx } from '@/lib/fx';
import { getCurrentLang, setUiLang, type UiLang } from '@/lib/i18n';
import { useLogout } from '@/hooks/use-auth';

// Figma "Profile Setting" (304:6117): "Other Settings" list.
const LANG_NAMES: Record<UiLang, string> = { ru: 'Русский', en: 'English', kk: 'Қазақша' };

function Row({ icon, label, right, onPress, disabled }: { icon: React.ReactNode; label: string; right?: React.ReactNode; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress || disabled} className="flex-row items-center gap-4 py-3">
      {icon}
      <Text className="flex-1 font-nunito-semibold text-sm text-mieo-heading">{label}</Text>
      {right}
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px w-full bg-mieo-stroke" />;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 375);
  const { prefs, setPrefs } = useFxPreferences();
  const logout = useLogout();
  const [lang, setLang] = useState<UiLang>(getCurrentLang());

  const changeLang = async (next: UiLang) => {
    if (next === lang) return;
    await setUiLang(next);
    setLang(next);
    fx.tap();
  };

  const [langOpen, setLangOpen] = useState(false);

  const comingSoon = () => Toast.show({ type: 'info', text1: t('profile.coming_soon') });

  return (
    <View className="flex-1 bg-mieo-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40, alignItems: 'center' }}>
        <View className="flex-row items-center gap-4 px-4" style={{ width: contentWidth }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} className="rounded-xl border-[1.5px] border-mieo-stroke bg-mieo-surface p-3">
            <ChevronLeft size={24} color="#171A1C" />
          </Pressable>
          <Text className="font-nunito-extrabold text-[22px] text-mieo-heading">{t('profile.settings')}</Text>
        </View>

        <View className="mt-6 px-4" style={{ width: contentWidth }}>
          <Text className="mb-3 font-nunito-extrabold text-[22px] text-mieo-heading">{t('profile.other_settings')}</Text>
          <View className="rounded-3xl border-[1.5px] border-mieo-stroke bg-mieo-surface px-4 py-2">
            <Row icon={<User size={24} color="#171A1C" />} label={t('profile.edit_profile')} right={<ChevronRight size={20} color="#171A1C" />} onPress={() => router.push('/profile/edit' as never)} />
            <Divider />
            <Row icon={<Bell size={24} color="#171A1C" />} label={t('profile.disable_notifications')} right={<ChevronRight size={20} color="#171A1C" />} onPress={() => router.push('/profile/notifications')} />
            <Divider />
            <Row icon={<Moon size={24} color="#171A1C" />} label={t('profile.dark_mode')} right={<Switch value={false} disabled />} onPress={comingSoon} />
            <Divider />
            <Row icon={<Languages size={24} color="#171A1C" />} label={t('profile.language')} right={<Text className="font-nunito-semibold text-sm text-mieo-body">{LANG_NAMES[lang]}</Text>} onPress={() => setLangOpen(true)} />
            <Divider />
            <Row icon={<Volume2 size={24} color="#171A1C" />} label={t('profile.sounds')} right={<Switch value={prefs.sounds} onValueChange={(v) => setPrefs({ sounds: v })} />} />
            <Divider />
            <Row icon={<Volume2 size={24} color="#171A1C" />} label={t('profile.haptics')} right={<Switch value={prefs.haptics} onValueChange={(v) => setPrefs({ haptics: v })} />} />
            <Divider />
            <Row icon={<HelpCircle size={24} color="#171A1C" />} label={t('profile.help_support')} right={<ChevronRight size={20} color="#171A1C" />} onPress={comingSoon} />
            <Divider />
            <Row icon={<FileText size={24} color="#171A1C" />} label={t('profile.terms')} right={<ChevronRight size={20} color="#171A1C" />} onPress={comingSoon} />
            <Divider />
            <Row icon={<Shield size={24} color="#171A1C" />} label={t('profile.privacy')} right={<ChevronRight size={20} color="#171A1C" />} onPress={comingSoon} />
            <Divider />
            <Row icon={<LogOut size={24} color="#E26A6A" />} label={logout.isPending ? t('profile.logging_out') : t('profile.logout')} onPress={() => logout.mutate()} disabled={logout.isPending} />
            <Divider />
            <Row icon={<Trash2 size={24} color="#E26A6A" />} label={t('profile.delete_account')} right={<ChevronRight size={20} color="#E26A6A" />} onPress={() => router.push('/profile/delete-account' as never)} />
          </View>
        </View>
      </ScrollView>
      {/* Language picker */}
      <Modal visible={langOpen} animationType="slide" onRequestClose={() => setLangOpen(false)}>
        <View className="flex-1 bg-mieo-bg">
          <View className="flex-row items-center justify-center px-4 pt-16 pb-4">
            <Text className="font-nunito-black text-2xl text-mieo-heading">{t('profile.language')}</Text>
          </View>
          {(['ru', 'en', 'kk'] as UiLang[]).map((code) => {
            const selected = lang === code;
            return (
              <Pressable key={code} accessibilityRole="button" onPress={() => { void changeLang(code); setLangOpen(false); }} className={`mx-4 mb-4 h-[52px] flex-row items-center px-4 rounded-xl border-[1.5px] bg-mieo-surface ${selected ? 'border-mieo-primary' : 'border-mieo-dim'}`}>
                <Text className="flex-1 font-nunito-semibold text-base text-mieo-heading">{LANG_NAMES[code]}</Text>
                {selected && <Check size={20} color="#59C8FF" />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}
