import { KeyboardLift } from '@/components/keyboard-lift';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Check, ChevronDown, ChevronLeft, Mail, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/hooks/use-auth';

type Gender = 'female' | 'male';

// Figma "Edit profile" (329:9009). Name, gender and age are not stored by the backend yet,
// so Update only validates and reports that saving is not connected.
const dimShadow = { shadowColor: '#ADB5BA', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
const focusShadow = { shadowColor: '#1AB3FF', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
const primaryShadow = { shadowColor: '#3E8CB2', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 375);
  const { data: user } = useCurrentUser();

  const [name, setName] = useState(user?.name ?? user?.username ?? '');
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState('8');
  const [focused, setFocused] = useState<string | null>(null);
  const [genderOpen, setGenderOpen] = useState(false);

  const onUpdate = () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: t('profile.name_required') });
      return;
    }
    Toast.show({ type: 'info', text1: t('profile.not_connected') });
  };

  return (
    <View className="flex-1 bg-mieo-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardLift>
<ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40, alignItems: 'center' }}>
        {/* Top bar */}
        <View className="flex-row items-center gap-4 px-4" style={{ width: contentWidth }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={dimShadow} className="rounded-xl border-[1.5px] border-mieo-stroke bg-mieo-surface p-3">
            <ChevronLeft size={24} color="#171A1C" />
          </Pressable>
          <Text className="font-nunito-extrabold text-[22px] text-mieo-heading">{t('profile.edit_profile')}</Text>
        </View>

        <View className="mt-6 gap-4 items-center" style={{ width: contentWidth }}>
          {/* Name */}
          <View style={[{ width: 345 }, focused === 'name' ? focusShadow : dimShadow]} className={`h-[52px] flex-row items-center gap-4 px-3 rounded-xl border-[1.5px] bg-mieo-surface ${focused === 'name' ? 'border-mieo-primary' : 'border-mieo-dim'}`}>
            <User size={24} color="#464E53" />
            <TextInput value={name} onChangeText={setName} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} placeholder={t('profile.name_label')} placeholderTextColor="#5D686F" className="flex-1 min-w-0 p-0 font-nunito-semibold text-sm text-mieo-heading" />
          </View>

          {/* Email (read-only, from account) */}
          <View style={[{ width: 345 }, dimShadow]} className="h-[52px] flex-row items-center gap-4 px-3 rounded-xl border-[1.5px] border-mieo-dim bg-mieo-surface">
            <Mail size={24} color="#464E53" />
            <Text className="flex-1 font-nunito-semibold text-sm text-mieo-heading" numberOfLines={1}>{user?.email ?? ''}</Text>
          </View>

          {/* Gender + age */}
          <View className="flex-row items-center gap-4" style={{ width: 345 }}>
            <View className="flex-row items-center gap-3">
              <Text className="font-nunito-semibold text-sm text-mieo-heading">{t('profile.gender')}</Text>
              <Pressable accessibilityRole="button" onPress={() => setGenderOpen(true)} style={dimShadow} className="h-[52px] w-[150px] flex-row items-center gap-2 px-3 rounded-xl border-[1.5px] border-mieo-dim bg-mieo-surface">
                <Text className="flex-1 font-nunito-semibold text-sm text-mieo-heading">{gender === 'female' ? t('auth.register.gender_female') : t('auth.register.gender_male')}</Text>
                <ChevronDown size={24} color="#171A1C" />
              </Pressable>
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="font-nunito-semibold text-sm text-mieo-heading">{t('profile.age')}</Text>
              <TextInput value={age} onChangeText={setAge} onFocus={() => setFocused('age')} onBlur={() => setFocused(null)} keyboardType="number-pad" maxLength={3} style={focused === 'age' ? focusShadow : dimShadow} className={`h-[52px] w-16 text-center font-nunito-semibold text-sm text-mieo-heading rounded-xl border-[1.5px] bg-mieo-surface ${focused === 'age' ? 'border-mieo-primary' : 'border-mieo-dim'}`} />
            </View>
          </View>
        </View>

        {/* Update */}
        <View className="w-full items-center px-4 mt-10">
          <Pressable accessibilityRole="button" onPress={onUpdate} style={primaryShadow} className="w-full min-h-12 items-center justify-center overflow-hidden px-6 py-3.5 rounded-2xl bg-mieo-primary active:opacity-80">
            <Text className="font-nunito-extrabold text-base tracking-[0.15px] text-[#F5FCFF]">{t('profile.update')}</Text>
          </Pressable>
        </View>
      </ScrollView>
</KeyboardLift>

      {/* Gender picker */}
      <Modal visible={genderOpen} animationType="slide" onRequestClose={() => setGenderOpen(false)}>
        <View className="flex-1 bg-mieo-bg">
          <View className="flex-row items-center justify-center px-4 pt-16 pb-4">
            <Text className="font-nunito-black text-2xl text-mieo-heading">{t('profile.gender')}</Text>
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
    </View>
  );
}
