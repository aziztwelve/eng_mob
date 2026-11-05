import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardLift } from '@/components/keyboard-lift';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { ProfileButton, ProfileQueryError } from '@/components/profile/profile-ui';
import { useCurrentUser } from '@/hooks/use-auth';
import { useAccountProfile, useUpdateAccountProfile } from '@/hooks/use-account-profile';
import { AuthService } from '@/lib/auth-service';
import { profileDraft, profilePayload, validateProfileDraft, type ProfileDraft } from '@/lib/profile-form';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const profile = useAccountProfile();
  const save = useUpdateAccountProfile();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const keyboardHeight = useKeyboardHeight();
  const revealFocusedField = useCallback(() => {
    requestAnimationFrame(() => {
      const input = TextInput.State.currentlyFocusedInput();
      const viewport = scroll.current?.getNativeScrollRef();
      if (input && viewport) {
        input.measureInWindow((_left, inputY) => {
          viewport.measureInWindow((_x, viewportY) => {
            scroll.current?.scrollTo({ y: Math.max(0, scrollOffset.current + inputY - viewportY - 40), animated: true });
          });
        });
      }
    });
  }, []);
  useEffect(() => {
    // Wait for KeyboardLift to resize the form before measuring the focused field.
    if (keyboardHeight > 0) revealFocusedField();
  }, [keyboardHeight, revealFocusedField]);
  const dirty = useRef(false);
  const busy = useRef(false);
  const owner = useRef(user?.id);
  useEffect(() => {
    if (owner.current !== user?.id) { owner.current = user?.id; dirty.current = false; setDraft(null); }
    if (profile.data && !dirty.current) setDraft(profileDraft(profile.data, user?.username ?? ''));
  }, [profile.data, user?.id, user?.username]);
  const change = (field: keyof ProfileDraft, value: string) => {
    dirty.current = true;
    setDraft(previous => previous ? { ...previous, [field]: value } : previous);
  };
  const onSave = async () => {
    if (!draft || busy.current) return;
    const error = validateProfileDraft(draft);
    if (error) { Toast.show({ type: 'error', text1: t(`profile.invalid_${error}`) }); return; }
    const expectedOwner = user?.id;
    busy.current = true;
    try {
      const result = await save.mutateAsync(profilePayload(draft));
      if (await AuthService.getSessionUserID() !== expectedOwner) return;
      dirty.current = false;
      setDraft(profileDraft(result, user?.username ?? ''));
      Toast.show({ type: 'success', text1: t('common.saved') });
    } catch (error) {
      Toast.show({ type: 'error', text1: t('common.save_failed'), text2: error instanceof Error ? error.message : undefined });
    } finally { busy.current = false; }
  };
  const genderLabel = (value: string) => value ? t(`auth.register.gender_${value}`) : t('profile.unspecified');
  return (
    <View className="flex-1 bg-mieo-bg">
      <Stack.Screen options={{ title: t('profile.edit_profile') }} />
      <KeyboardLift>
        <ScrollView ref={scroll} onLayout={keyboardHeight > 0 ? revealFocusedField : undefined} onScroll={event => { scrollOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {profile.isError ? <ProfileQueryError onRetry={() => { void profile.refetch(); }} /> : !draft ? <ActivityIndicator color="#1AB3FF" /> : <>
            <Field label={t('profile.name_label')} value={draft.name} onFocus={revealFocusedField} onChangeText={value => change('name', value)} editable={!save.isPending} maxLength={100} autoComplete="name" />
            <View className="gap-2">
              <Text className="font-nunito-bold text-sm text-mieo-body">{t('profile.email')}</Text>
              <Text selectable className="rounded-xl border border-mieo-stroke bg-mieo-surface p-4 font-nunito-semibold text-base text-mieo-body">{user?.email ?? '—'}</Text>
            </View>
            <Field label={t('profile.birthday')} value={draft.birthday} onFocus={revealFocusedField} onChangeText={value => change('birthday', value)} placeholder="YYYY-MM-DD" editable={!save.isPending} maxLength={10} autoCapitalize="none" />
            <View className="gap-2">
              <Text className="font-nunito-bold text-sm text-mieo-body">{t('profile.gender')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('profile.gender')} disabled={save.isPending} onPress={() => setGenderOpen(true)} className="min-h-[52px] rounded-xl border border-mieo-stroke bg-mieo-surface p-4">
                <Text className="font-nunito-semibold text-base text-mieo-heading">{genderLabel(draft.gender)}</Text>
              </Pressable>
            </View>
            <Field label={t('profile.timezone')} value={draft.timezone} onFocus={revealFocusedField} onChangeText={value => change('timezone', value)} editable={!save.isPending} autoCapitalize="none" autoCorrect={false} />
            <Text className="font-nunito-medium text-sm text-mieo-body">{t('profile.timezone_hint')}</Text>
            <ProfileButton label={save.isPending ? t('profile.updating') : t('profile.update')} disabled={save.isPending} onPress={() => { void onSave(); }} block />
          </>}
        </ScrollView>
      </KeyboardLift>
      <Modal visible={genderOpen} animationType="slide" onRequestClose={() => setGenderOpen(false)}>
        <View className="flex-1 bg-mieo-bg" style={{ paddingTop: insets.top + 12 }}>
          <View className="flex-row items-center gap-4 p-4">
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => setGenderOpen(false)} className="rounded-xl border border-mieo-stroke bg-mieo-surface p-3"><ChevronLeft size={24} color="#171A1C" /></Pressable>
            <Text className="font-nunito-extrabold text-[22px] text-mieo-heading">{t('profile.gender')}</Text>
          </View>
          {['', 'female', 'male'].map(value => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: draft?.gender === value }} onPress={() => { change('gender', value); setGenderOpen(false); }} className="mx-4 mb-3 min-h-[52px] flex-row items-center rounded-xl border border-mieo-stroke bg-mieo-surface p-4">
              <Text className="flex-1 font-nunito-semibold text-base text-mieo-heading">{genderLabel(value)}</Text>
              {draft?.gender === value && <Check size={20} color="#1AB3FF" />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}
function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return <View className="gap-2"><Text className="font-nunito-bold text-sm text-mieo-body">{label}</Text><TextInput {...props} accessibilityLabel={label} placeholderTextColor="#ADB5BA" className="min-h-[52px] rounded-xl border border-mieo-stroke bg-mieo-surface p-4 font-nunito-semibold text-base text-mieo-heading" /></View>;
}
