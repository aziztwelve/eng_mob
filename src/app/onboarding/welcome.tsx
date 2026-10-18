import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { CloudBear, CloudButton, CloudScreen } from '@/components/onboarding/CloudScreen';
import { usePatchOnboardingV3 } from '@/hooks/use-onboarding';
import { analytics } from '@/lib/analytics';
import { resetOnboarding } from '@/lib/onboarding-storage';
import { getCurrentLang, setUiLang, type UiLang } from '@/lib/i18n';
import { UI_LANGUAGES } from '@/lib/supported-languages';

const neon = { surface: '#FFFFFF', border: '#B5E6FF', text: '#142A35', primary: '#078FC8' };

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState<null | 'terms' | 'privacy'>(null);
  const patch = usePatchOnboardingV3();
  React.useEffect(() => { analytics.track('onboarding_started', { ui_lang: getCurrentLang() }); }, []);
  async function handleStart() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await resetOnboarding();
      await patch.mutateAsync({ patch: { target_language: 'en', native_language: getCurrentLang() }, localExtra: { current_step: 'goal' } });
      router.push('/onboarding/goal');
    } finally { setSubmitting(false); }
  }
  return (
    <CloudScreen>
      <View className="z-20 flex-row items-center justify-between px-5 pb-2 pt-4">
        <Text className="font-nunito-black text-2xl text-[#142A35]">LingoIQ</Text>
        <UiLangSwitcher value={getCurrentLang()} onChange={(lang) => void setUiLang(lang)} />
      </View>
      <ScrollView className="flex-1" contentContainerClassName="grow items-center justify-center px-6 py-3" showsVerticalScrollIndicator={false}>
        <CloudBear />
        <Text accessibilityRole="header" className="mt-4 text-center font-nunito-black text-[32px] leading-[38px] text-[#142A35]">{t('onboarding.welcome.greeting_title')}</Text>
        <Text className="mt-4 max-w-[310px] text-center font-nunito-semibold text-base leading-6 text-[#496779]">{t('onboarding.welcome.tagline')}</Text>
      </ScrollView>
      <View className="rounded-t-[28px] bg-white/95 px-5 pb-5 pt-4">
        <CloudButton label={t('onboarding.welcome.cta')} onPress={() => void handleStart()} loading={submitting} testID="onboarding-start" />
        <Pressable onPress={() => router.push('/auth/login')} accessibilityRole="button" className="min-h-12 items-center justify-center py-3">
          <Text className="text-center font-nunito-extrabold text-sm text-[#078FC8]">{t('onboarding.welcome.signin_link')}</Text>
        </Pressable>
        <Text className="text-center font-nunito-medium text-[11px] leading-4 text-[#58788A]">
          {t('onboarding.welcome.legal_prefix')}{' '}
          <Text onPress={() => setLegalOpen('terms')} className="text-[#078FC8] underline">{t('onboarding.welcome.terms_link')}</Text>{' '}
          {t('onboarding.welcome.legal_and')}{' '}
          <Text onPress={() => setLegalOpen('privacy')} className="text-[#078FC8] underline">{t('onboarding.welcome.privacy_link')}</Text>
        </Text>
      </View>
      <LegalModal kind={legalOpen} onClose={() => setLegalOpen(null)} />
    </CloudScreen>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UiLangSwitcher({
  value,
  onChange,
}: {
  value: UiLang;
  onChange: (v: UiLang) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = UI_LANGUAGES.find((l) => l.code === value) ?? UI_LANGUAGES[0];
  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: neon.surface, borderWidth: 1, borderColor: neon.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 14 }}>{current.flag}</Text>
        <Text style={{ color: neon.text, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>
          {current.code}
        </Text>
      </Pressable>
      {open ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          style={{ position: 'absolute', top: 36, right: 0, minWidth: 120, zIndex: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: neon.border, borderRadius: 16, paddingVertical: 4 }}
        >
          {UI_LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => {
                onChange(l.code as UiLang);
                setOpen(false);
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Text style={{ fontSize: 14 }}>{l.flag}</Text>
              <Text style={{ color: neon.text, fontWeight: '800', fontSize: 14 }}>{l.nameNative}</Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

function LegalModal({
  kind,
  onClose,
}: {
  kind: null | 'terms' | 'privacy';
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const visible = kind !== null;
  const titleKey =
    kind === 'terms'
      ? 'onboarding.welcome.terms_modal_title'
      : 'onboarding.welcome.privacy_modal_title';
  const bodyKey =
    kind === 'terms'
      ? 'onboarding.welcome.terms_modal_body'
      : 'onboarding.welcome.privacy_modal_body';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{ maxHeight: '85%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: neon.border }}
        >
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <Text style={{ color: neon.text, fontWeight: '900', fontSize: 20, flex: 1 }}>
              {visible ? t(titleKey) : ''}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="p-1 active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.common.done')}
            >
              <X size={22} color="#9ca3af" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 }}
          >
            <Text style={{ color: neon.text, fontWeight: '500', fontSize: 14, lineHeight: 24 }}>
              {visible ? t(bodyKey) : ''}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
